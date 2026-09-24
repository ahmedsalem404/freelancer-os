import { z } from 'zod'
import { isoDate } from '@/shared/model/schema'
import { ENGAGEMENT_TYPES } from '@/features/engagements/model/enums'

/** Upper bound for included hours in one retainer cycle. */
const MAX_INCLUDED_HOURS = 744

/**
 * Body of `POST /api/leads/:id/convert`: the engagement the won lead opens.
 * Money is in minor units, in the lead's currency.
 */
export const convertLeadInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(ENGAGEMENT_TYPES),
    amountMinor: z.number().int().nonnegative(),
    startOn: isoDate,
    cyclePeriod: z.enum(['monthly', 'yearly']).optional(),
    includedHours: z.number().positive().max(MAX_INCLUDED_HOURS).optional(),
  })
  .refine((v) => v.type === 'project' || v.cyclePeriod !== undefined, {
    path: ['cyclePeriod'],
    message: 'Recurring engagements need a billing period',
  })
  .refine((v) => v.type !== 'retainer' || v.includedHours !== undefined, {
    path: ['includedHours'],
    message: 'A retainer needs its included hours',
  })

export type ConvertLeadInput = z.infer<typeof convertLeadInput>
