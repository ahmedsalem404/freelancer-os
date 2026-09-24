import type { Database } from '@/shared/db/database'
import { asc, isNull } from 'drizzle-orm'
import { importantDates } from './calendar.table'

/** Snapshot slice owned by `calendar` (manual dates; the rest is derived). */
export function loadCalendar(db: Database) {
  return {
    importantDates: db
      .select()
      .from(importantDates)
      .where(isNull(importantDates.archivedAt))
      .orderBy(asc(importantDates.dueOn))
      .all(),
  }
}
