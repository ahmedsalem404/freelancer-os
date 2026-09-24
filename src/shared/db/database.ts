import type { RunResult } from 'better-sqlite3'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'

/**
 * The Drizzle handle every feature repository / service receives. The base
 * type accepts both the connection and a transaction (`db.transaction(tx => …)`).
 */
export type Database = BaseSQLiteDatabase<'sync', RunResult>
