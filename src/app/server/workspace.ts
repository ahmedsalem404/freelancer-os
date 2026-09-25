import { addDaysIso } from '@/shared/model/dates'
import type { Ctx } from '@/shared/server/context'
import { and, desc, eq, gte, inArray, isNull, or } from 'drizzle-orm'
import { engagements } from '@/features/engagements/server/engagements.table'
import { timeEntries } from '@/features/time/server/time.table'
import { assignedEngagementIds } from '@/features/today/server'
import { dailyReflections, tasks } from '@/features/today/server/today.table'

/** How far back finished tasks and logged time stay on "My day". */
const HISTORY_DAYS = 14

/**
 * The acting member's own slice (`GET /api/workspace`), read in the
 * request's transaction. Assistants see only this; it carries no money.
 */
export function loadWorkspace(ctx: Ctx) {
  const since = addDaysIso(ctx.today, -HISTORY_DAYS)
  const me = ctx.memberId
  const engagementIds = [...assignedEngagementIds(ctx.db, me)]
  return {
    today: ctx.today,
    tasks: ctx.db
      .select({
        id: tasks.id,
        title: tasks.title,
        engagementId: tasks.engagementId,
        dueOn: tasks.dueOn,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.assigneeId, me),
          or(isNull(tasks.completedAt), gte(tasks.completedAt, since))
        )
      )
      .orderBy(tasks.dueOn, tasks.position)
      .all(),
    engagements: engagementIds.length
      ? ctx.db
          .select({ id: engagements.id, title: engagements.title })
          .from(engagements)
          .where(inArray(engagements.id, engagementIds))
          .all()
      : [],
    timeEntries: ctx.db
      .select({
        id: timeEntries.id,
        engagementId: timeEntries.engagementId,
        description: timeEntries.description,
        minutes: timeEntries.minutes,
        workOn: timeEntries.workOn,
      })
      .from(timeEntries)
      .where(and(eq(timeEntries.memberId, me), gte(timeEntries.workOn, since)))
      .orderBy(desc(timeEntries.workOn))
      .all(),
    reflection:
      ctx.db
        .select({ note: dailyReflections.note })
        .from(dailyReflections)
        .where(
          and(
            eq(dailyReflections.memberId, me),
            eq(dailyReflections.day, ctx.today)
          )
        )
        .get()?.note ?? '',
  }
}
