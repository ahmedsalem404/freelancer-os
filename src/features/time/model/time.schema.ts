import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'

/** A day has 1440 minutes; one entry never spans more. */
const MAX_MINUTES = 24 * 60

export const timeEntrySchema = z.object({
  id: recordId,
  memberId: recordId,
  engagementId: recordId.optional(),
  clientId: recordId.optional(),
  description: z.string(),
  minutes: z.number().int().positive(),
  workOn: isoDate,
  billable: z.boolean(),
  countsToAllowance: z.boolean(),
})

/** Body of `POST /api/time`. The server sets member, client and day. */
export const logTimeInput = z.object({
  engagementId: recordId.optional(),
  minutes: z.number().int().positive().max(MAX_MINUTES),
  description: z.string().trim().max(500),
  billable: z.boolean(),
})

export type TimeEntry = z.infer<typeof timeEntrySchema>
export type LogTimeInput = z.infer<typeof logTimeInput>
