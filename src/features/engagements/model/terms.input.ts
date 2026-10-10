import { z } from 'zod'
import { isoDate } from '@/shared/model/schema'
import { CURRENCIES } from '@/shared/money/currency'
import { ENGAGEMENT_TYPES, PAYMENT_CHANNELS } from './enums'

/** What an engagement is agreed at. Money is in minor units. */
const termsShape = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(ENGAGEMENT_TYPES),
  amountMinor: z.number().int().nonnegative(),
  startOn: isoDate,
  cyclePeriod: z.enum(['monthly', 'yearly']).optional(),
})

type TermsRules = Pick<z.infer<typeof termsShape>, 'type' | 'cyclePeriod'>

function checkTerms(v: TermsRules, ctx: z.RefinementCtx) {
  if (v.type !== 'project' && v.cyclePeriod === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['cyclePeriod'],
      message: 'Recurring engagements need a billing period',
    })
  }
}

/** The terms alone — a won lead supplies the client itself. */
export const engagementTermsInput = termsShape.superRefine(checkTerms)

/** Body of `POST /api/engagements`: terms for an existing client. */
export const openEngagementInput = termsShape
  .extend({
    clientId: z.string().min(1),
    /** Defaults to the client's currency. */
    currency: z.enum(CURRENCIES).optional(),
    paymentChannel: z.enum(PAYMENT_CHANNELS).optional(),
  })
  .superRefine(checkTerms)

/**
 * Body of `PUT /api/engagements/:id/terms`. The type is sent back as
 * stored (it can't change) so the same shape rules apply.
 */
export const updateTermsInput = termsShape
  .pick({
    type: true,
    amountMinor: true,
    cyclePeriod: true,
  })
  .superRefine(checkTerms)

/** Body of `PUT /api/engagements/:id`. A blank date clears it. */
export const updateEngagementInput = z.object({
  title: z.string().trim().min(1).max(200),
  nextAction: z.string().trim().max(300).default(''),
  nextActionOn: isoDate.optional(),
  /** Blank clears it. */
  paymentChannel: z.enum(PAYMENT_CHANNELS).optional(),
})

export type EngagementTermsInput = z.infer<typeof engagementTermsInput>
export type OpenEngagementInput = z.infer<typeof openEngagementInput>
export type UpdateEngagementInput = z.input<typeof updateEngagementInput>
export type UpdateTermsInput = z.infer<typeof updateTermsInput>
