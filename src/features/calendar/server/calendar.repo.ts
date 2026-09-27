import type { Database } from '@/shared/db/database'
import { asc, isNull } from 'drizzle-orm'
import { importantDates } from './calendar.table'
import { calendarEvents } from './events.table'

/** Snapshot slice owned by `calendar` (manual dates; the rest is derived). */
export function loadCalendar(db: Database) {
  return {
    importantDates: db
      .select()
      .from(importantDates)
      .where(isNull(importantDates.archivedAt))
      .orderBy(asc(importantDates.dueOn))
      .all(),
    calendarEvents: db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        startsOn: calendarEvents.startsOn,
        endsOn: calendarEvents.endsOn,
        startTime: calendarEvents.startTime,
        clientId: calendarEvents.clientId,
        engagementId: calendarEvents.engagementId,
        notes: calendarEvents.notes,
      })
      .from(calendarEvents)
      .orderBy(asc(calendarEvents.startsOn))
      .all(),
  }
}
