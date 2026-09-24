import type { Database } from '@/shared/db/database'
import { failure, success } from '@/shared/http/envelope'
import { Hono } from 'hono'
import { loadSnapshot } from './snapshot'

/** HTTP composition root: mounts feature routes under /api. */
export function createApp(db: Database) {
  const app = new Hono().basePath('/api')

  app.get('/health', (c) => c.json(success({ status: 'up' })))
  app.get('/snapshot', (c) => c.json(success(loadSnapshot(db))))

  app.notFound((c) => c.json(failure('not_found', 'Unknown endpoint'), 404))
  app.onError((error, c) => {
    // Detailed context stays in the server log; the client gets a generic error.
    process.stderr.write(
      `[api] ${c.req.method} ${c.req.path}: ${error.stack ?? error}\n`
    )
    return c.json(failure('internal_error', 'Something went wrong'), 500)
  })

  return app
}
