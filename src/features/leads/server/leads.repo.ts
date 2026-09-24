import type { Database } from '@/shared/db/database'
import { asc } from 'drizzle-orm'
import { leads } from './leads.table'

/** Snapshot slice owned by `leads`. */
export function loadLeads(db: Database) {
  return {
    leads: db
      .select()
      .from(leads)
      .orderBy(asc(leads.stage), asc(leads.position))
      .all(),
  }
}
