import { parseRows } from '@/shared/model/schema'
import type { Ctx } from '@/shared/server/context'
import { asc, eq, inArray } from 'drizzle-orm'
import {
  approvalSchema,
  deliverableSchema,
  reviewRoundSchema,
  stageSchema,
} from '../model/work.schema'
import { approvals, reviewRounds } from './rounds.table'
import { deliverables, engagementStages } from './work.table'

/** Stages, deliverables, rounds and approvals of one engagement. */
export function engagementWork(ctx: Ctx, engagementId: string) {
  const items = parseRows(
    deliverableSchema,
    ctx.db
      .select()
      .from(deliverables)
      .where(eq(deliverables.engagementId, engagementId))
      .orderBy(asc(deliverables.position))
      .all()
  )
  const ids = items.map((d) => d.id)
  return {
    stages: parseRows(
      stageSchema,
      ctx.db
        .select()
        .from(engagementStages)
        .where(eq(engagementStages.engagementId, engagementId))
        .orderBy(asc(engagementStages.position))
        .all()
    ),
    deliverables: items,
    rounds:
      ids.length === 0
        ? []
        : parseRows(
            reviewRoundSchema,
            ctx.db
              .select()
              .from(reviewRounds)
              .where(inArray(reviewRounds.deliverableId, ids))
              .all()
          ),
    approvals:
      ids.length === 0
        ? []
        : parseRows(
            approvalSchema,
            ctx.db
              .select()
              .from(approvals)
              .where(inArray(approvals.deliverableId, ids))
              .all()
          ),
  }
}
