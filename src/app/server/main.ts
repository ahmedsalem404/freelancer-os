import { serve } from '@hono/node-server'
import { and, eq, isNull } from 'drizzle-orm'
import { settings, teamMembers } from '@/features/settings/server'
import { createApp } from './app'
import { openDatabase, runMigrations } from './db'
import { readEnv } from './env'

const env = readEnv()
const { db, close } = openDatabase(env.DB_FILE)
runMigrations(db, env.MIGRATIONS_DIR)

if (!db.select().from(settings).get()) {
  process.stdout.write(
    '[api] Database is empty — run `npm run db:reset` to load demo data.\n'
  )
}

const ownerWithoutPassword = db
  .select({ email: teamMembers.email })
  .from(teamMembers)
  .where(and(eq(teamMembers.role, 'owner'), isNull(teamMembers.passwordHash)))
  .get()
if (ownerWithoutPassword) {
  process.stdout.write(
    `[api] The owner has no password yet — run: npm run auth:set-password -- ${ownerWithoutPassword.email}\n`
  )
}

const server = serve(
  { fetch: createApp(db).fetch, port: env.API_PORT, hostname: env.API_HOST },
  (info) => {
    process.stdout.write(
      `[api] http://${env.API_HOST}:${info.port}/api · db ${env.DB_FILE}\n`
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
