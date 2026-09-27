import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import { addMonthsIso } from '@/shared/model/dates'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import type {
  CalendarEventFields,
  ImportantDateInput,
} from '../model/calendar.schema'
import { importantDates } from './calendar.table'
import { calendarEvents } from './events.table'

const MONTHS_IN = { monthly: 1, yearly: 12 } as const

/** SQLite refuses an unknown client / engagement id. */
function mapForeignKey(error: unknown): never {
  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
  ) {
    throw new DomainError('not_found', 'The linked record is gone', 404)
  }
  throw error
}

const eventColumns = (input: CalendarEventFields) => ({
  title: input.title,
  startsOn: input.startsOn,
  endsOn: input.endsOn ?? null,
  startTime: input.startTime ?? null,
  clientId: input.clientId ?? null,
  engagementId: input.engagementId ?? null,
  notes: input.notes ?? null,
})

export function addEvent(ctx: Ctx, input: CalendarEventFields) {
  const id = newId('evt')
  try {
    ctx.db
      .insert(calendarEvents)
      .values({ id, ...eventColumns(input), createdBy: ctx.memberId })
      .run()
  } catch (error) {
    mapForeignKey(error)
  }
  return { id }
}

export function updateEvent(ctx: Ctx, id: string, input: CalendarEventFields) {
  const row = ctx.db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .get()
  required(row, 'Event', id)
  try {
    ctx.db
      .update(calendarEvents)
      .set(eventColumns(input))
      .where(eq(calendarEvents.id, id))
      .run()
  } catch (error) {
    mapForeignKey(error)
  }
  return { id }
}

export function deleteEvent(ctx: Ctx, id: string) {
  const result = ctx.db
    .delete(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .run()
  if (result.changes === 0) required(undefined, 'Event', id)
  return { id }
}

const dateColumns = (input: ImportantDateInput) => ({
  title: input.title,
  kind: input.kind,
  dueOn: input.dueOn,
  recurrence: input.recurrence,
  remindDaysBefore: input.remindDaysBefore,
  clientId: input.clientId ?? null,
  notes: input.notes ?? null,
})

export function saveImportantDate(
  ctx: Ctx,
  id: string | undefined,
  input: ImportantDateInput
) {
  try {
    if (!id) {
      const newRow = newId('date')
      ctx.db
        .insert(importantDates)
        .values({ id: newRow, ...dateColumns(input) })
        .run()
      return { id: newRow }
    }
    dateOf(ctx, id)
    ctx.db
      .update(importantDates)
      .set({ ...dateColumns(input), handledOn: null })
      .where(eq(importantDates.id, id))
      .run()
    return { id }
  } catch (error) {
    return mapForeignKey(error)
  }
}

function dateOf(ctx: Ctx, id: string) {
  return required(
    ctx.db.select().from(importantDates).where(eq(importantDates.id, id)).get(),
    'Date',
    id
  )
}

/**
 * "Renewed / handled": a recurring date rolls forward one period (and asks
 * again next time); a one-off date is closed.
 */
export function handleImportantDate(ctx: Ctx, id: string) {
  const row = dateOf(ctx, id)
  const set =
    row.recurrence === 'none'
      ? { handledOn: ctx.today }
      : { dueOn: addMonthsIso(row.dueOn, MONTHS_IN[row.recurrence]) }
  ctx.db.update(importantDates).set(set).where(eq(importantDates.id, id)).run()
  return { id, ...set }
}

export function archiveImportantDate(ctx: Ctx, id: string) {
  dateOf(ctx, id)
  ctx.db
    .update(importantDates)
    .set({ archivedAt: ctx.now })
    .where(eq(importantDates.id, id))
    .run()
  return { id }
}
