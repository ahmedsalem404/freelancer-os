import { z } from 'zod'
import { CURRENCIES } from './currency'

export const currencySchema = z.enum(CURRENCIES)

/** amount + currency + rate snapshot + base amount, all minor units. */
export const moneyFieldsSchema = z.object({
  amount: z.number().int(),
  currency: currencySchema,
  /** SAR per 1 unit of `currency`, typed by the owner at write time. */
  rateToBase: z.number().positive(),
  /** round(amount * rateToBase), in SAR minor units. */
  baseAmount: z.number().int(),
})

export type MoneyFields = z.infer<typeof moneyFieldsSchema>
