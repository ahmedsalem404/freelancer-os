import { isoDate, isoDateTime, recordId } from '@/shared/model/schema'
import { z } from 'zod'
import {
  APPROVAL_DECISIONS,
  APPROVAL_SOURCES,
  DELIVERABLE_ORIGINS,
  ROUND_SOURCES,
} from './enums'

export const stageSchema = z.object({
  id: recordId,
  engagementId: recordId,
  title: z.string(),
  position: z.number().int(),
  completedAt: isoDateTime.optional(),
})

export const deliverableSchema = z.object({
  id: recordId,
  engagementId: recordId,
  title: z.string(),
  dueOn: isoDate.optional(),
  revisionLimit: z.number().int().nonnegative(),
  origin: z.enum(DELIVERABLE_ORIGINS),
  /** The invoice line that billed a change-scope deliverable. */
  invoiceItemId: recordId.optional(),
  position: z.number().int(),
})

export const roundSourceSchema = z.enum(ROUND_SOURCES)

export const reviewRoundSchema = z.object({
  id: recordId,
  deliverableId: recordId,
  roundNo: z.number().int().positive(),
  receivedOn: isoDate,
  note: z.string(),
  source: roundSourceSchema,
  /** Set once this out-of-scope round has been billed. */
  invoiceItemId: recordId.optional(),
})

export const approvalSourceSchema = z.enum(APPROVAL_SOURCES)

export const approvalSchema = z.object({
  id: recordId,
  deliverableId: recordId,
  source: approvalSourceSchema,
  decision: z.enum(APPROVAL_DECISIONS),
  signerName: z.string().optional(),
  createdAt: isoDateTime,
})

export type Stage = z.infer<typeof stageSchema>
export type Deliverable = z.infer<typeof deliverableSchema>
export type ReviewRound = z.infer<typeof reviewRoundSchema>
export type Approval = z.infer<typeof approvalSchema>
