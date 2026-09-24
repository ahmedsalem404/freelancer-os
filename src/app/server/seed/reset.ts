/**
 * `npm run db:reset` — deletes the LOCAL database file, re-creates the schema
 * from drizzle/ and loads the demo data. Never point DB_FILE at real data.
 */
import { sql } from 'drizzle-orm'
import { rmSync } from 'node:fs'
import { openDatabase, runMigrations } from '../db'
import { readEnv } from '../env'
import { seedDemo } from './demo'

const env = readEnv()
for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${env.DB_FILE}${suffix}`, { force: true })
}

const { db, close } = openDatabase(env.DB_FILE)
runMigrations(db, env.MIGRATIONS_DIR)
seedDemo(db)

const tables = db.all<{ name: string }>(
  sql`SELECT name FROM sqlite_master WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name`
)
let total = 0
for (const { name } of tables) {
  const [{ n }] = db.all<{ n: number }>(
    sql.raw(`SELECT COUNT(*) AS n FROM "${name}"`)
  )
  total += n
  process.stdout.write(`${name.padEnd(22)} ${n}\n`)
}
process.stdout.write(
  `\n${tables.length} tables, ${total} rows → ${env.DB_FILE}\n`
)
close()
