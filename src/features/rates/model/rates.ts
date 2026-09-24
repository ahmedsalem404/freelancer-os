import type { Currency } from '@/shared/money/currency'
import type { DailyRate } from './rates.schema'

/** Rates to base (SAR per 1 unit of each currency). */
export type LastRates = Record<Currency, number>

/** YER quotes → rates to base. Only a prefill; records keep their own rate. */
export function ratesFromDaily({ sarInYer, usdInYer }: DailyRate): LastRates {
  return { SAR: 1, YER: 1 / sarInYer, USD: usdInYer / sarInYer }
}
