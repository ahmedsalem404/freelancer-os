import { z } from 'zod'
import { isoDate } from '@/shared/model/schema'
import { ENGAGEMENT_TYPES } from './enums'

/** Upper bound for included hours in one retainer cycle. */
const MAX_INCLUDED_HOURS = 744

/** What an engagement is agreed at. Money is in minor units. */
const termsShape = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(ENGAGEMENT_TYPES),
  amountMinor: z.number().int().nonnegative(),
  startOn: isoDate,
  cyclePeriod: z.enum(['monthly', 'yearly']).optional(),
  includedHours: z.number().positive().max(MAX_INCLUDED_HOURS).optional(),
})

type TermsRules = Pick<
  z.infer<typeof termsShape>,
  'type' | 'cyclePeriod' | 'includedHours'
>

function checkTerms(v: TermsRules, ctx: z.RefinementCtx) {
  if (v.type !== 'project' && v.cyclePeriod === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['cyclePeriod'],
      message: 'Recurring engagements need a billing period',
    })
  }
  if (v.type === 'retainer' && v.includedHours === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['includedHours'],
      message: 'A retainer needs its included hours',
    })
  }
}

/** The terms alone — a won lead supplies the client itself. */
export const engagementTermsInput = termsShape.superRefine(checkTerms)

/** Body of `POST /api/engagements`: terms for an existing client. */
export const openEngagementInput = termsShape
  .extend({ clientId: z.string().min(1) })
  .superRefine(checkTerms)

/** Body of `PUT /api/engagements/:id`. A blank date clears it. */
export const updateEngagementInput = z.object({
  title: z.string().trim().min(1).max(200),
  nextAction: z.string().trim().max(300).default(''),
  nextActionOn: isoDate.optional(),
})

export type EngagementTermsInput = z.infer<typeof engagementTermsInput>
export type OpenEngagementInput = z.infer<typeof openEngagementInput>
export type UpdateEngagementInput = z.input<typeof updateEngagementInput>
