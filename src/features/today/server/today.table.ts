import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'
import { id, timestamps } from '../../../shared/db/columns'
import { engagements } from '../../engagements/server/engagements.table'
import { engagementStages } from '../../engagements/server/work.table'
import { teamMembers } from '../../settings/server/team.table'

/** Tasks. Done = `completedAt IS NOT NULL`; assignee drives visibility. */
export const tasks = sqliteTable(
  'tasks',
  {
    id: id(),
    title: text().notNull(),
    notes: text(),
    engagementId: text().references(() => engagements.id, {
      onDelete: 'set null',
    }),
    stageId: text().references(() => engagementStages.id, {
      onDelete: 'set null',
    }),
    assigneeId: text()
      .notNull()
      .references(() => teamMembers.id),
    createdBy: text()
      .notNull()
      .references(() => teamMembers.id),
    dueOn: text(),
    completedAt: text(),
    completedBy: text().references(() => teamMembers.id),
    carriedOverCount: integer().notNull().default(0),
    position: integer().notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index('tasks_assignee').on(t.assigneeId, t.completedAt, t.dueOn),
    index('tasks_engagement').on(t.engagementId),
  ]
)

/** End-of-day reflection, one per member per day. */
export const dailyReflections = sqliteTable(
  'daily_reflections',
  {
    id: id(),
    memberId: text()
      .notNull()
      .references(() => teamMembers.id),
    day: text('on_date').notNull(),
    note: text('reflection').notNull(),
    carriedCount: integer().notNull().default(0),
    ...timestamps(),
  },
  (t) => [unique('reflection_per_day').on(t.memberId, t.day)]
)
