import type { Database } from '@/shared/db/database'
import { newId } from '@/shared/db/new-id'
import { DomainError } from '@/shared/http/errors'
import type { Currency } from '@/shared/money/currency'
import type { Ctx } from '@/shared/server/context'
import { desc } from 'drizzle-orm'
import { ratesFromDaily } from '@/features/rates/model/rates'
import type { SaveDailyRateInput } from '../model/rates.schema'
import { exchangeRates } from './rates.table'

/** Saves today's quotes; saving again the same day replaces them. */
export function saveDailyRate(ctx: Ctx, input: SaveDailyRateInput) {
  ctx.db
    .insert(exchangeRates)
    .values({ id: newId('rate'), effectiveOn: ctx.today, ...input })
    .onConflictDoUpdate({
      target: exchangeRates.effectiveOn,
      set: { ...input, updatedAt: ctx.now },
    })
    .run()
  return { day: ctx.today, ...input }
}

/** Rates to base from the newest quote — prefill for server-built invoices. */
export function latestRates(db: Database): Record<Currency, number> {
  const row = db
    .select()
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.effectiveOn))
    .limit(1)
    .get()
  if (!row) {
    throw new DomainError(
      'rate_missing',
      "Set today's exchange rate first",
      409
    )
  }
  return ratesFromDaily({
    day: row.effectiveOn,
    sarInYer: row.sarInYer,
    usdInYer: row.usdInYer,
  })
}
