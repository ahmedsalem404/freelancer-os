import { sql } from 'drizzle-orm'
import { check, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id, timestamps } from '../../../shared/db/columns'

/**
 * Daily exchange rate as the owner types it — both quotes in YER
 * (ARCHITECTURE.md decision 2026-09-25). One row per day; the newest row is
 * "today's rate" and only prefills new records.
 */
export const exchangeRates = sqliteTable(
  'exchange_rates',
  {
    id: id(),
    effectiveOn: text().notNull().unique(),
    sarInYer: real().notNull(),
    usdInYer: real().notNull(),
    note: text(),
    ...timestamps(),
  },
  (t) => [
    check('rate_sar_positive', sql`${t.sarInYer} > 0`),
    check('rate_usd_positive', sql`${t.usdInYer} > 0`),
  ]
)
