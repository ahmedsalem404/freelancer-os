import type { Database } from '@/shared/db/database'
import { failure, success } from '@/shared/http/envelope'
import { DomainError } from '@/shared/http/errors'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  authGate,
  createAuthRoutes,
  sessionMember,
} from '@/features/auth/server'
import { clientsRoutes, vaultRoutes } from '@/features/clients/server'
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
import { type Clock, createRunner } from './context'
import { loadSnapshot } from './snapshot'

export type AppOptions = { clock?: Clock }

/** Reachable without a session: health, sign-in/out and the client portal. */
const PUBLIC_PATHS = new Set([
  '/api/health',
  '/api/auth/sign-in',
  '/api/auth/sign-out',
])
const isPublic = (path: string) =>
  PUBLIC_PATHS.has(path) || path.startsWith('/api/portal/')
/** Every signed-in member may call these; the rest is owner-only. */
const ANY_MEMBER = new Set(['/api/auth/me', '/api/auth/account'])

const FEATURE_ROUTES = [
  ratesRoutes,
  invoicesRoutes,
  engagementsRoutes,
  timeRoutes,
  leadsRoutes,
  todayRoutes,
  vaultRoutes,
  clientsRoutes,
  expensesRoutes,
  ownSubscriptionsRoutes,
]

/** HTTP composition root: mounts feature routes under /api. */
export function createApp(
  db: Database,
  { clock = () => new Date() }: AppOptions = {}
) {
  const app = new Hono<AppEnv>().basePath('/api')
  app.use('*', sessionMember(db, clock))
  app.use('*', async (c, next) => {
    c.set('run', createRunner(db, clock, c.var.member?.id))
    await next()
  })
  app.use('*', authGate({ isPublic, anyMember: ANY_MEMBER }))
  app.get('/health', (c) => c.json(success({ status: 'up' })))
  app.get('/snapshot', (c) => c.json(success(loadSnapshot(db))))
  app.route('/', createAuthRoutes())
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
