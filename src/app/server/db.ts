import type { Database } from '@/shared/db/database'
import Sqlite from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type Connection = { db: Database; close: () => void }

/** Opens (and creates if missing) the SQLite file with safe defaults. */
export function openDatabase(file: string): Connection {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const sqlite = new Sqlite(file)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle({ client: sqlite, casing: 'snake_case' })
  return { db, close: () => sqlite.close() }
}

/** Applies every pending migration from `drizzle/`. Idempotent. */
export function runMigrations(db: Database, migrationsFolder: string) {
  migrate(db, { migrationsFolder })
}
