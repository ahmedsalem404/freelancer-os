import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList } from '../../../shared/db/columns'
import { teamMembers } from '../../settings/server/team.table'
import { REMINDER_ACTIONS, REMINDER_KINDS } from '../model/enums'

/**
 * What was sent or dismissed. The schedule itself is derived from the data
 * (docs/database.md §3.9), so a paid invoice simply stops asking. The
 * target is a plain id checked by the service: the log may outlive it.
 */
export const reminderLog = sqliteTable(
  'reminder_log',
  {
    id: id(),
    kind: text({ enum: REMINDER_KINDS }).notNull(),
    targetId: text().notNull(),
    occurrenceOn: text().notNull(),
    offsetDays: integer().notNull(),
    action: text({ enum: REMINDER_ACTIONS }).notNull(),
    messageBody: text(),
    actedBy: text()
      .notNull()
      .references(() => teamMembers.id),
    /** `kind:targetId:occurrenceOn:offsetDays` — one decision per reminder. */
    dedupeKey: text().notNull().unique(),
    createdAt: text().notNull(),
  },
  (t) => [
    check('reminder_kind', sql`${t.kind} IN ${inList(REMINDER_KINDS)}`),
    check('reminder_action', sql`${t.action} IN ${inList(REMINDER_ACTIONS)}`),
    index('reminder_target').on(t.kind, t.targetId),
  ]
)
