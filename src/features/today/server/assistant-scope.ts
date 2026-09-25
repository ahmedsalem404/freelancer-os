import { DomainError } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, isNotNull } from 'drizzle-orm'
import { tasks } from './today.table'

/**
 * The engagements an assistant may see the title of and log time on: those
 * of the tasks assigned to them (docs/database.md §3.1).
 */
export function assignedEngagementIds(db: Ctx['db'], memberId: string) {
  const rows = db
    .selectDistinct({ id: tasks.engagementId })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, memberId), isNotNull(tasks.engagementId)))
    .all()
  return new Set(rows.flatMap((r) => (r.id ? [r.id] : [])))
}

/** Assistants may only point work at engagements from their own tasks. */
export function assertEngagementInScope(ctx: Ctx, engagementId?: string) {
  if (ctx.role === 'owner' || !engagementId) return
  if (!assignedEngagementIds(ctx.db, ctx.memberId).has(engagementId)) {
    throw new DomainError('forbidden', 'Not one of your engagements', 403)
  }
}
