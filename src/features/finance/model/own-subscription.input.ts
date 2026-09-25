import { z } from 'zod'
import { isoDate, optionalText } from '@/shared/model/schema'
import { currencySchema } from '@/shared/money/money.schema'
import { SUBSCRIPTION_PERIODS } from './enums'

/** Longest reminder lead before a renewal, in days. */
const MAX_REMIND_DAYS = 60
const DEFAULT_REMIND_DAYS = 3

/**
 * Body of `POST /api/own-subscriptions` and `PUT /api/own-subscriptions/:id`:
 * one of the owner's own tools (Figma, hosting…). Money in minor units.
 */
export const ownSubscriptionInput = z.object({
  name: z.string().trim().min(1).max(120),
  vendor: optionalText(120),
  amountMinor: z.number().int().positive(),
  currency: currencySchema,
  period: z.enum(SUBSCRIPTION_PERIODS),
  nextRenewalOn: isoDate,
  remindDaysBefore: z
    .number()
    .int()
    .min(0)
    .max(MAX_REMIND_DAYS)
    .default(DEFAULT_REMIND_DAYS),
})

export type OwnSubscriptionInput = z.input<typeof ownSubscriptionInput>
export type OwnSubscriptionFields = z.output<typeof ownSubscriptionInput>
