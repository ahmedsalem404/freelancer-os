import { z } from 'zod'
import { isoDate, optionalText, recordId } from '@/shared/model/schema'
import { DATE_KINDS, DATE_RECURRENCES } from './enums'

export const importantDateSchema = z.object({
  id: recordId,
  title: z.string(),
  kind: z.enum(DATE_KINDS),
  dueOn: isoDate,
  recurrence: z.enum(DATE_RECURRENCES).default('yearly'),
  remindDaysBefore: z.number().int().nonnegative().default(14),
  clientId: recordId.optional(),
  engagementId: recordId.optional(),
  handledOn: isoDate.optional(),
  notes: z.string().optional(),
})

/** A manual calendar event (meeting, call…). */
export const calendarEventSchema = z.object({
  id: recordId,
  title: z.string(),
  startsOn: isoDate,
  endsOn: isoDate.optional(),
  startTime: z.string().optional(),
  clientId: recordId.optional(),
  engagementId: recordId.optional(),
  notes: z.string().optional(),
})

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM')
  .optional()
  .or(z.literal('').transform(() => undefined))

/** Body of `POST /api/calendar-events` and `PUT /api/calendar-events/:id`. */
export const calendarEventInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    startsOn: isoDate,
    endsOn: isoDate.optional().or(z.literal('').transform(() => undefined)),
    startTime: time,
    clientId: recordId.optional(),
    engagementId: recordId.optional(),
    notes: optionalText(1000),
  })
  .refine((e) => !e.endsOn || e.endsOn >= e.startsOn, {
    message: 'The end is before the start',
    path: ['endsOn'],
  })

/** Body of `POST /api/important-dates` and `PUT /api/important-dates/:id`. */
export const importantDateInput = z.object({
  title: z.string().trim().min(1).max(120),
  kind: z.enum(DATE_KINDS),
  dueOn: isoDate,
  recurrence: z.enum(DATE_RECURRENCES),
  remindDaysBefore: z.number().int().min(0).max(365),
  clientId: recordId.optional(),
  notes: optionalText(1000),
})

export type ImportantDate = z.infer<typeof importantDateSchema>
export type CalendarEvent = z.infer<typeof calendarEventSchema>
export type CalendarEventInput = z.input<typeof calendarEventInput>
export type CalendarEventFields = z.output<typeof calendarEventInput>
export type ImportantDateInput = z.infer<typeof importantDateInput>
