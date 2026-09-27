import type { Database } from '@/shared/db/database'
import { failure, success } from '@/shared/http/envelope'
import { DomainError } from '@/shared/http/errors'
import type { AppEnv } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  authGate,
  createAuthRoutes,
  sessionMember,
} from '@/features/auth/server'
import { clientsRoutes, createVaultRoutes } from '@/features/clients/server'
import { engagementsRoutes } from '@/features/engagements/server'
import {
  expensesRoutes,
  ownSubscriptionsRoutes,
} from '@/features/finance/server'
import { invoicesRoutes } from '@/features/invoices/server'
import { leadsRoutes } from '@/features/leads/server'
import { createPortalRoutes } from '@/features/portal/server'
import { ratesRoutes } from '@/features/rates/server'
import { timeRoutes } from '@/features/time/server'
import { todayRoutes } from '@/features/today/server'
import { buildBackup } from './backup'
import { type Clock, createRunner } from './context'
import { loadSnapshot } from './snapshot'
import { loadWorkspace } from './workspace'

export type AppOptions = { clock?: Clock; storage: Storage }

/** Reachable without a session: health, sign-in/out and the client portal. */
const PUBLIC_PATHS = new Set([
  '/api/health',
  '/api/auth/sign-in',
  '/api/auth/sign-out',
])
const isPublic = (path: string) =>
  PUBLIC_PATHS.has(path) || path.startsWith('/api/portal/')
/**
 * Every signed-in member may call these; the rest is owner-only. The
 * services themselves keep an assistant to their own tasks, time and notes.
 */
const ANY_MEMBER = [
  'GET /api/auth/me',
  'PUT /api/auth/account',
  'GET /api/workspace',
  'POST /api/tasks',
  'POST /api/tasks/carry-over',
  'POST /api/tasks/:id/toggle',
  'PUT /api/reflections/today',
  'POST /api/day/close',
  'POST /api/time',
].map((rule) => {
  const [method, path] = rule.split(' ')
  const pattern = new RegExp(`^${path.replace(/:[a-z]+/g, '[^/]+')}$`)
  return { method, pattern }
})
const isAnyMember = (method: string, path: string) =>
  ANY_MEMBER.some((r) => r.method === method && r.pattern.test(path))

const FEATURE_ROUTES = [
  ratesRoutes,
  invoicesRoutes,
  engagementsRoutes,
  timeRoutes,
  leadsRoutes,
  todayRoutes,
  clientsRoutes,
  expensesRoutes,
  ownSubscriptionsRoutes,
]

/** HTTP composition root: mounts feature routes under /api. */
export function createApp(
  db: Database,
  { clock = () => new Date(), storage }: AppOptions
) {
  const app = new Hono<AppEnv>().basePath('/api')
  app.use('*', sessionMember(db, clock))
  app.use('*', async (c, next) => {
    c.set('run', createRunner(db, clock, c.var.member ?? undefined))
    await next()
  })
  app.use('*', authGate({ isPublic, isAnyMember }))
  app.get('/health', (c) => c.json(success({ status: 'up' })))
  app.get('/snapshot', (c) => c.json(success(loadSnapshot(db))))
  app.get('/workspace', (c) => c.json(success(c.var.run(loadWorkspace))))
  app.get('/backup', (c) => {
    const day = clock().toISOString().slice(0, 10)
    c.header('content-type', 'application/zip')
    c.header(
      'content-disposition',
      `attachment; filename="freelancer-os-backup-${day}.zip"`
    )
    c.header('cache-control', 'no-store')
    return c.body(buildBackup(db, storage).slice().buffer)
  })
  app.route('/', createAuthRoutes())
  app.route('/', createVaultRoutes(storage))
  for (const routes of FEATURE_ROUTES) app.route('/', routes)
  app.route('/', createPortalRoutes())

  app.notFound((c) => c.json(failure('not_found', 'Unknown endpoint'), 404))
  app.onError((error, c) => {
    if (error instanceof DomainError) {
      return c.json(failure(error.code, error.message), error.status)
    }
    if (error instanceof HTTPException) {
      return c.json(failure('bad_request', error.message), error.status)
    }
    // Detailed context stays in the server log; the client gets a generic error.
    process.stderr.write(
      `[api] ${c.req.method} ${c.req.path}: ${error.stack ?? error}\n`
    )
    return c.json(failure('internal_error', 'Something went wrong'), 500)
  })

  return app
}
