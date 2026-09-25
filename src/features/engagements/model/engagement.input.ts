import { z } from 'zod'
import { isoDate } from '@/shared/model/schema'
import { approvalSourceSchema, roundSourceSchema } from './work.schema'

/** Longest grace the owner can grant in one decision. */
export const MAX_GRACE_DAYS = 90

const NOTE_MAX = 2000
const SIGNER_MAX = 120

/** A feedback round, from the team or the client portal. */
export const addFeedbackInput = z.object({
  note: z.string().trim().min(1).max(NOTE_MAX),
  source: roundSourceSchema.default('owner'),
})

/** An approval, from the owner or the client portal. */
export const approveInput = z.object({
  source: approvalSourceSchema,
  signerName: z.string().trim().min(1).max(SIGNER_MAX).optional(),
})

/**
 * Bodies of the signed-in endpoints `POST /api/deliverables/:id/{rounds,
 * approval}`: never `client_link` — only the portal records that.
 */
export const teamFeedbackInput = addFeedbackInput.extend({
  source: z.enum(['owner', 'assistant']).default('owner'),
})
export const ownerApproveInput = approveInput.extend({
  source: z.literal('owner').default('owner'),
})

/** Body of `POST /api/engagements/:id/scope`. */
export const changeScopeInput = z.object({
  title: z.string().trim().min(1).max(200),
  /** Minor units, in the engagement currency. */
  feeMinor: z.number().int().positive(),
  dueOn: isoDate,
})

/** Body of `POST /api/engagements/:id/grace`. */
export const extendGraceInput = z.object({
  days: z.number().int().min(1).max(MAX_GRACE_DAYS),
})

export type AddFeedbackInput = z.infer<typeof addFeedbackInput>
export type ApproveInput = z.infer<typeof approveInput>
export type ChangeScopeInput = z.infer<typeof changeScopeInput>
export type ExtendGraceInput = z.infer<typeof extendGraceInput>
