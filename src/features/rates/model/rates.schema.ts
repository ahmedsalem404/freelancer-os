import { isoDate } from '@/shared/model/schema'
import { z } from 'zod'

/** Upper bound that still accepts any realistic YER quote. */
const MAX_QUOTE = 1_000_000

const quote = z.number().positive().max(MAX_QUOTE)

/**
 * Today's exchange rate as the owner types it: both quotes in YER
 * (1 SAR = sarInYer YER, 1 USD = usdInYer YER). Only a prefill for new
 * records — every record still snapshots its own rate.
 */
export const dailyRateSchema = z.object({
  day: isoDate,
  sarInYer: quote,
  usdInYer: quote,
})

/** Body of `PUT /api/rates/today`. */
export const saveDailyRateInput = z.object({
  sarInYer: quote,
  usdInYer: quote,
})

export type DailyRate = z.infer<typeof dailyRateSchema>
export type SaveDailyRateInput = z.infer<typeof saveDailyRateInput>
