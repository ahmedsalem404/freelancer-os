import type { Database } from '@/shared/db/database'
import { newId } from '@/shared/db/new-id'
import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { desc } from 'drizzle-orm'
import { Hono } from 'hono'
import { dedupeKey, reminderActionInput } from '../model/reminder.schema'
import { reminderLog } from './reminder-log.table'

/** Snapshot slice owned by `reminders`: the decisions, newest first. */
export function loadReminders(db: Database) {
  return {
    reminderLog: db
      .select({
        kind: reminderLog.kind,
        targetId: reminderLog.targetId,
        occurrenceOn: reminderLog.occurrenceOn,
        offsetDays: reminderLog.offsetDays,
        action: reminderLog.action,
        createdAt: reminderLog.createdAt,
      })
      .from(reminderLog)
      .orderBy(desc(reminderLog.createdAt))
      .all(),
  }
}

/**
 * Owner-only. Logging the same reminder twice is harmless: the first
 * decision stands (unique dedupe key), so a double click never duplicates.
 */
export const remindersRoutes = new Hono<AppEnv>().post(
  '/reminders',
  jsonBody(reminderActionInput),
  (c) => {
    const input = c.req.valid('json')
    c.var.run((ctx) =>
      ctx.db
        .insert(reminderLog)
        .values({
          id: newId('rem'),
          ...input,
          messageBody: input.messageBody ?? null,
          actedBy: ctx.memberId,
          dedupeKey: dedupeKey(input),
          createdAt: ctx.now,
        })
        .onConflictDoNothing({ target: reminderLog.dedupeKey })
        .run()
    )
    return c.json(success({ logged: true }), 201)
  }
)
