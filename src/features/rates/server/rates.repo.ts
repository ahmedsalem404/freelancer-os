import type { Database } from '@/shared/db/database'
import { desc } from 'drizzle-orm'
import { exchangeRates } from './rates.table'

const HISTORY_DAYS = 30

/** Snapshot slice owned by `rates`: newest first, [0] is today's rate. */
export function loadRates(db: Database) {
  return {
    dailyRates: db
      .select({
        day: exchangeRates.effectiveOn,
        sarInYer: exchangeRates.sarInYer,
        usdInYer: exchangeRates.usdInYer,
      })
      .from(exchangeRates)
      .orderBy(desc(exchangeRates.effectiveOn))
      .limit(HISTORY_DAYS)
      .all(),
  }
}
