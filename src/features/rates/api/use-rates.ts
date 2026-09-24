import { useDb } from '@/app/client/snapshot-query'
import { useAction } from '@/app/client/use-action'
import { callApi } from '@/shared/http/api-client'
import type { Currency } from '@/shared/money/currency'
import { ratesFromDaily } from '@/features/rates/model/rates'
import {
  type DailyRate,
  type SaveDailyRateInput,
  dailyRateSchema,
} from '../model/rates.schema'

/**
 * Used only until the owner types a first rate, so screens can still show
 * converted totals. Every record keeps the rate typed when it was created.
 */
const FALLBACK_RATE: DailyRate = { day: '', sarInYer: 425, usdInYer: 1600 }

/** Newest typed rate (history is newest-first); fallback before the first. */
export const useCurrentRate = (): DailyRate =>
  useDb().dailyRates[0] ?? FALLBACK_RATE

/** Rates to base (SAR per unit) — the prefill for new records. */
export const useLastRates = (): Record<Currency, number> =>
  ratesFromDaily(useCurrentRate())

export const useSaveDailyRate = () =>
  useAction((input: SaveDailyRateInput) =>
    callApi('PUT', '/rates/today', dailyRateSchema, input)
  )
