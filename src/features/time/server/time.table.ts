import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { bool, id, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagements } from '../../engagements/server/engagements.table'
import { deliverables } from '../../engagements/server/work.table'
import { teamMembers } from '../../settings/server/team.table'

/** Time attributed to a client / engagement; drives the retainer hours meter. */
export const timeEntries = sqliteTable(
  'time_entries',
  {
    id: id(),
    memberId: text()
      .notNull()
      .references(() => teamMembers.id),
    clientId: text().references(() => clients.id),
    engagementId: text().references(() => engagements.id),
    deliverableId: text().references(() => deliverables.id),
    taskId: text(),
    workOn: text().notNull(),
    startedAt: text(),
    minutes: integer().notNull(),
    description: text().notNull().default(''),
    entryType: text({ enum: ['manual', 'timer'] })
      .notNull()
      .default('manual'),
    billable: bool().notNull().default(true),
    countsToAllowance: bool().notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    check('time_minutes', sql`${t.minutes} > 0`),
    check(
      'time_engagement_has_client',
      sql`${t.engagementId} IS NULL OR ${t.clientId} IS NOT NULL`
    ),
    index('time_engagement').on(t.engagementId, t.workOn),
    index('time_client').on(t.clientId, t.workOn),
    index('time_member').on(t.memberId, t.workOn),
  ]
)
