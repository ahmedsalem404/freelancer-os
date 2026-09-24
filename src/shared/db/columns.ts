/**
 * Server-only column builders shared by every feature's *.table.ts
 * (docs/database.md §1). Relative imports only: drizzle-kit loads these files.
 * Column names are derived snake_case (`casing: 'snake_case'`).
 */
import { type SQL, sql } from 'drizzle-orm'
import { integer, real, text } from 'drizzle-orm/sqlite-core'
import { CURRENCIES } from '../money/currency'

const nowIso = () => new Date().toISOString()

export const id = () => text().primaryKey()

export const bool = () => integer({ mode: 'boolean' })

/** `created_at` / `updated_at` as ISO-8601 UTC text, set by the app. */
export const timestamps = () => ({
  createdAt: text().notNull().$defaultFn(nowIso),
  updatedAt: text().notNull().$defaultFn(nowIso).$onUpdateFn(nowIso),
})

/** amount + currency + rate snapshot + base amount (minor units). */
export const moneyQuad = () => ({
  amount: integer().notNull(),
  currency: text({ enum: CURRENCIES }).notNull(),
  rateToBase: real().notNull(),
  baseAmount: integer().notNull(),
})

/** SQL `IN (...)` list for enum CHECK constraints. */
export function inList(values: readonly string[]): SQL {
  return sql.raw(
    `(${values.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ')})`
  )
}
