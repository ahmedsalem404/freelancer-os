import { z } from 'zod'
import { isoDate, isoDateTime, recordId } from '@/shared/model/schema'
import { REMINDER_ACTIONS, REMINDER_KINDS } from './enums'

/** One logged decision (snapshot row). */
export const reminderLogSchema = z.object({
  kind: z.enum(REMINDER_KINDS),
  targetId: recordId,
  occurrenceOn: isoDate,
  offsetDays: z.number().int(),
  action: z.enum(REMINDER_ACTIONS),
  createdAt: isoDateTime,
})

/** Body of `POST /api/reminders`: the owner sent or dismissed one. */
export const reminderActionInput = z.object({
  kind: z.enum(REMINDER_KINDS),
  targetId: recordId,
  occurrenceOn: isoDate,
  offsetDays: z.number().int().min(-366).max(366),
  action: z.enum(REMINDER_ACTIONS),
  messageBody: z.string().max(4000).optional(),
})

export type ReminderLogRow = z.infer<typeof reminderLogSchema>
export type ReminderActionInput = z.infer<typeof reminderActionInput>

export const dedupeKey = (r: {
  kind: string
  targetId: string
  occurrenceOn: string
  offsetDays: number
}) => `${r.kind}:${r.targetId}:${r.occurrenceOn}:${r.offsetDays}`
