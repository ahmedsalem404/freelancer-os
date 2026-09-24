import { newId } from '@/shared/db/new-id'
import { required } from '@/shared/http/errors'
import { addDaysIso } from '@/shared/model/dates'
import type { Ctx } from '@/shared/server/context'
import { and, eq, isNull, lte, max, sql } from 'drizzle-orm'
import type { AddTaskInput } from '../model/today.schema'
import { tasks } from './today.table'

/** Adds a task for today, assigned to the acting member, at the end. */
export function addTask(ctx: Ctx, input: AddTaskInput) {
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
      assigneeId: ctx.memberId,
      createdBy: ctx.memberId,
      dueOn: ctx.today,
      position: (last?.position ?? -1) + 1,
    })
    .run()
  return { id }
}

/** Done ↔ not done; "done" is `completed_at IS NOT NULL`. */
export function toggleTask(ctx: Ctx, taskId: string) {
  const task = required(
    ctx.db
      .select({ completedAt: tasks.completedAt })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .get(),
    'task',
    taskId
  )
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
