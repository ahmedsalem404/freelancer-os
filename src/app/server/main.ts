import { serve } from '@hono/node-server'
import { settings } from '@/features/settings/server/settings.table'
import { createApp } from './app'
import { openDatabase, runMigrations } from './db'
import { readEnv } from './env'

// No authentication yet (phase 3) → listen on this machine only.
const HOSTNAME = '127.0.0.1'

const env = readEnv()
const { db, close } = openDatabase(env.DB_FILE)
runMigrations(db, env.MIGRATIONS_DIR)

if (!db.select().from(settings).get()) {
  process.stdout.write(
    '[api] Database is empty — run `npm run db:reset` to load demo data.\n'
  )
}

const server = serve(
  { fetch: createApp(db).fetch, port: env.API_PORT, hostname: HOSTNAME },
  (info) => {
    process.stdout.write(
      `[api] http://${HOSTNAME}:${info.port}/api · db ${env.DB_FILE}\n`
    )
  }
)

const shutdown = () => {
  server.close()
  close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
