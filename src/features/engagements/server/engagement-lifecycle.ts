import { deleteUnused } from '@/shared/db/delete-unused'
import { DomainError } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { engagements } from './engagements.table'
import { findEngagement, openCycle } from './lookup'

function setArchivedAt(ctx: Ctx, id: string, archivedAt: string | null) {
  ctx.db
    .update(engagements)
    .set({ archivedAt })
    .where(eq(engagements.id, id))
    .run()
}

/**
 * Hides an engagement from lists; its records stay. A recurring one still
 * in a cycle is refused — stop it first, or it would renew out of sight.
 */
export function archiveEngagement(ctx: Ctx, id: string) {
  findEngagement(ctx, id)
  if (openCycle(ctx, id)) {
    throw new DomainError(
      'engagement_running',
      'Stop the open cycle before archiving',
      409
    )
  }
  setArchivedAt(ctx, id, ctx.now)
  return { id }
}

export function unarchiveEngagement(ctx: Ctx, id: string) {
  findEngagement(ctx, id)
  setArchivedAt(ctx, id, null)
  return { id }
}

/**
 * Removes an engagement opened by mistake. Its cycles and stages go with
 * it (cascade); any deliverable, invoice, time or link refuses the delete.
 */
export function deleteEngagement(ctx: Ctx, id: string) {
  findEngagement(ctx, id)
  deleteUnused(
    () => ctx.db.delete(engagements).where(eq(engagements.id, id)).run(),
    'engagement_in_use',
    'engagement'
  )
  return { id }
}
