import { isoDate } from '@/shared/model/schema'
import { z } from 'zod'
import { approvalSourceSchema, roundSourceSchema } from './work.schema'

/** Longest grace the owner can grant in one decision. */
export const MAX_GRACE_DAYS = 90

/** Body of `POST /api/deliverables/:id/rounds`. */
export const addFeedbackInput = z.object({
  note: z.string().trim().min(1).max(2000),
  source: roundSourceSchema.default('owner'),
})

/** Body of `POST /api/deliverables/:id/approval`. */
export const approveInput = z.object({
  source: approvalSourceSchema,
  signerName: z.string().trim().min(1).max(120).optional(),
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
