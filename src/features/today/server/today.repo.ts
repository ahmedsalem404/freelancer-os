import type { Database } from '@/shared/db/database'
import { asc } from 'drizzle-orm'
import { dailyReflections, tasks } from './today.table'

/** Snapshot slice owned by `today`. */
export function loadToday(db: Database) {
  return {
    tasks: db
      .select()
      .from(tasks)
      .orderBy(asc(tasks.dueOn), asc(tasks.position))
      .all(),
    reflections: db.select().from(dailyReflections).all(),
  }
}
