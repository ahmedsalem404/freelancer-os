import type { Database } from '@/shared/db/database'
import { desc } from 'drizzle-orm'
import { timeEntries } from './time.table'

/** Snapshot slice owned by `time`. */
export function loadTime(db: Database) {
  return {
    timeEntries: db
      .select()
      .from(timeEntries)
      .orderBy(desc(timeEntries.workOn))
      .all(),
  }
}
