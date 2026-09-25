import { newId } from '@/shared/db/new-id'
import { DomainError, notFound, required } from '@/shared/http/errors'
import { addDaysIso } from '@/shared/model/dates'
import type { Ctx } from '@/shared/server/context'
import { and, eq, isNull, lte, max, sql } from 'drizzle-orm'
import { teamMembers } from '@/features/settings/server'
import type { AddTaskInput } from '../model/today.schema'
import { assertEngagementInScope } from './assistant-scope'
import { tasks } from './today.table'

/** The member a new task goes to; only the owner may pick someone else. */
function assigneeFor(ctx: Ctx, requested?: string) {
  if (!requested || requested === ctx.memberId) return ctx.memberId
  if (ctx.role !== 'owner') {
    throw new DomainError('forbidden', 'Only the owner assigns tasks', 403)
  }
  const member = ctx.db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.id, requested),
        eq(teamMembers.isActive, true),
        isNull(teamMembers.archivedAt)
      )
    )
    .get()
  if (!member) throw notFound('member', requested)
  return member.id
}

/** Adds a task for today (for the acting member unless the owner picks), at the end. */
export function addTask(ctx: Ctx, input: AddTaskInput) {
  const assigneeId = assigneeFor(ctx, input.assigneeId)
  assertEngagementInScope(ctx, input.engagementId)
  const last = ctx.db
    .select({ position: max(tasks.position) })
    .from(tasks)
    .get()
  const id = newId('task')
  ctx.db
    .insert(tasks)
    .values({
      id,
      title: input.title,
      engagementId: input.engagementId,
      assigneeId,
      createdBy: ctx.memberId,
      dueOn: ctx.today,
      position: (last?.position ?? -1) + 1,
    })
    .run()
  return { id }
}

/**
 * Done ↔ not done; "done" is `completed_at IS NOT NULL`. An assistant only
 * sees their own tasks, so anyone else's answers 404.
 */
export function toggleTask(ctx: Ctx, taskId: string) {
  const task = required(
    ctx.db
      .select({ completedAt: tasks.completedAt, assigneeId: tasks.assigneeId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .get(),
    'task',
    taskId
  )
  if (ctx.role !== 'owner' && task.assigneeId !== ctx.memberId) {
    throw notFound('task', taskId)
  }
  const isDone = task.completedAt !== null
  ctx.db
    .update(tasks)
    .set({
      completedAt: isDone ? null : ctx.now,
      completedBy: isDone ? null : ctx.memberId,
    })
    .where(eq(tasks.id, taskId))
    .run()
  return { completed: !isDone }
}

/** End of day: the acting member's unfinished tasks move to tomorrow. */
export function carryOverTasks(ctx: Ctx) {
  const result = ctx.db
    .update(tasks)
    .set({
      dueOn: addDaysIso(ctx.today, 1),
      carriedOverCount: sql`${tasks.carriedOverCount} + 1`,
    })
    .where(
      and(
        eq(tasks.assigneeId, ctx.memberId),
        isNull(tasks.completedAt),
        lte(tasks.dueOn, ctx.today)
      )
    )
    .run()
  return { moved: result.changes }
}
