import type { Database } from '@/shared/db/database'
import { asc, isNull } from 'drizzle-orm'
import { engagementCycles } from './cycles.table'
import { engagements } from './engagements.table'
import { approvals, reviewRounds } from './rounds.table'
import { deliverables, engagementStages } from './work.table'

/** Snapshot slice owned by `engagements` (the guard reads all of it). */
export function loadEngagements(db: Database) {
  return {
    // Archived ones stay: invoices, time and cycles still point at them.
    engagements: db.select().from(engagements).all(),
    cycles: db
      .select()
      .from(engagementCycles)
      .orderBy(asc(engagementCycles.engagementId), asc(engagementCycles.seq))
      .all(),
    stages: db
      .select()
      .from(engagementStages)
      .orderBy(
        asc(engagementStages.engagementId),
        asc(engagementStages.position)
      )
      .all(),
    deliverables: db
      .select()
      .from(deliverables)
      .where(isNull(deliverables.cancelledAt))
      .orderBy(asc(deliverables.engagementId), asc(deliverables.position))
      .all(),
    rounds: db
      .select()
      .from(reviewRounds)
      .orderBy(asc(reviewRounds.deliverableId), asc(reviewRounds.roundNo))
      .all(),
    approvals: db
      .select()
      .from(approvals)
      .orderBy(asc(approvals.createdAt))
      .all(),
  }
}
