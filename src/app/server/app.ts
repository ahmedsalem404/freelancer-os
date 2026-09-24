import type { Database } from '@/shared/db/database'
import { failure, success } from '@/shared/http/envelope'
import { DomainError } from '@/shared/http/errors'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { vaultRoutes } from '@/features/clients/server'
import { engagementsRoutes } from '@/features/engagements/server'
import { invoicesRoutes } from '@/features/invoices/server'
import { leadsRoutes } from '@/features/leads/server'
import { ratesRoutes } from '@/features/rates/server'
import { timeRoutes } from '@/features/time/server'
import { todayRoutes } from '@/features/today/server'
import { type Clock, createRunner } from './context'
import { loadSnapshot } from './snapshot'

export type AppOptions = { clock?: Clock }

const FEATURE_ROUTES = [
  ratesRoutes,
  invoicesRoutes,
  engagementsRoutes,
  timeRoutes,
  leadsRoutes,
  todayRoutes,
  vaultRoutes,
]

/** HTTP composition root: mounts feature routes under /api. */
export function createApp(
  db: Database,
  { clock = () => new Date() }: AppOptions = {}
) {
  const app = new Hono<AppEnv>().basePath('/api')
  const run = createRunner(db, clock)

  app.use('*', async (c, next) => {
    c.set('run', run)
    await next()
  })
  app.get('/health', (c) => c.json(success({ status: 'up' })))
  app.get('/snapshot', (c) => c.json(success(loadSnapshot(db))))
  for (const routes of FEATURE_ROUTES) app.route('/', routes)

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
