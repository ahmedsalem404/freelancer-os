import type { Currency, MoneyFields } from './types'

/** Base currency for every report. Rates = SAR per 1 unit of a currency. */
export const BASE_CURRENCY: Currency = 'SAR'

export const CURRENCIES: Currency[] = ['SAR', 'USD', 'YER']

/** Every supported currency has exponent 2 (halala / cent / fils). */
const MINOR_PER_MAJOR = 100

export const toMinor = (major: number) => Math.round(major * MINOR_PER_MAJOR)
export const toMajor = (minor: number) => minor / MINOR_PER_MAJOR

/** Builds the full money quad. The rate is always supplied by the caller. */
export function money(
  amount: number,
  currency: Currency,
  rateToBase: number
): MoneyFields {
  const rate = currency === BASE_CURRENCY ? 1 : rateToBase
  return {
    amount,
    currency,
    rateToBase: rate,
    baseAmount: Math.round(amount * rate),
  }
}

/**
 * Today's exchange rate as the owner types it: both quotes in YER
 * (1 SAR = sarInYer YER, 1 USD = usdInYer YER). Only a prefill for new
 * records — every record still snapshots its own rate.
 */
export type DailyRate = { day: string; sarInYer: number; usdInYer: number }

/** YER quotes → rates to base (SAR per 1 unit of each currency). */
export function ratesFromDaily({
  sarInYer,
  usdInYer,
}: DailyRate): Record<Currency, number> {
  return { SAR: 1, YER: 1 / sarInYer, USD: usdInYer / sarInYer }
}

/** Minor units of `from` → minor units of `to`, through SAR. */
export function convert(
  minor: number,
  from: Currency,
  to: Currency,
  rates: Record<Currency, number>
) {
  if (from === to) return minor
  return Math.round((minor * rates[from]) / rates[to])
}

/** Base (SAR minor) → display currency minor, using that currency's rate. */
export function fromBase(baseAmount: number, displayRate: number) {
  return baseAmount / displayRate
}

const SYMBOLS: Record<'ar' | 'en', Record<Currency, string>> = {
  ar: { SAR: 'ر.س', USD: '$', YER: 'ر.ي' },
  en: { SAR: 'SAR', USD: 'USD', YER: 'YER' },
}

const numberFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Minor units → "1,250.00" (latin digits, paired with the `num` utility). */
export function formatAmount(minor: number) {
  return numberFormat.format(toMajor(minor))
}

export function currencySymbol(currency: Currency, lang: 'ar' | 'en') {
  return SYMBOLS[lang][currency]
}

export function formatMoney(
  minor: number,
  currency: Currency,
  lang: 'ar' | 'en'
) {
  return `${formatAmount(minor)} ${currencySymbol(currency, lang)}`
}
