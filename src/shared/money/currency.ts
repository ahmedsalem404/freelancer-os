/** Supported currencies. SAR is the base (report) currency. */
export const CURRENCIES = ['SAR', 'USD', 'YER'] as const

export type Currency = (typeof CURRENCIES)[number]

export const BASE_CURRENCY: Currency = 'SAR'
