import { sql } from 'drizzle-orm'
import { check, index, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagements } from '../../engagements/server/engagements.table'
import { teamMembers } from '../../settings/server/team.table'

/** Manual events (meetings, calls…); the rest of the calendar is derived. */
export const calendarEvents = sqliteTable(
  'calendar_events',
  {
    id: id(),
    title: text().notNull(),
    startsOn: text().notNull(),
    endsOn: text(),
    /** `HH:MM`; NULL = all day. */
    startTime: text(),
    clientId: text().references(() => clients.id, { onDelete: 'set null' }),
    engagementId: text().references(() => engagements.id, {
      onDelete: 'set null',
    }),
    notes: text(),
    createdBy: text()
      .notNull()
      .references(() => teamMembers.id),
    ...timestamps(),
  },
  (t) => [
    check(
      'event_range',
      sql`${t.endsOn} IS NULL OR ${t.endsOn} >= ${t.startsOn}`
    ),
    index('calendar_events_start').on(t.startsOn),
  ]
)
