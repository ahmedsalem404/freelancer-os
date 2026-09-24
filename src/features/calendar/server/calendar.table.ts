import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagements } from '../../engagements/server/engagements.table'
import { DATE_KINDS, DATE_RECURRENCES } from '../model/enums'

/** Domains, SSL, licenses… The calendar itself is a derived view. */
export const importantDates = sqliteTable(
  'important_dates',
  {
    id: id(),
    title: text().notNull(),
    kind: text({ enum: DATE_KINDS }).notNull(),
    dueOn: text().notNull(),
    recurrence: text({ enum: DATE_RECURRENCES }).notNull().default('yearly'),
    remindDaysBefore: integer().notNull().default(14),
    clientId: text().references(() => clients.id),
    engagementId: text().references(() => engagements.id),
    handledOn: text(),
    notes: text(),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [
    check('date_kind', sql`${t.kind} IN ${inList(DATE_KINDS)}`),
    check(
      'date_recurrence',
      sql`${t.recurrence} IN ${inList(DATE_RECURRENCES)}`
    ),
    index('important_dates_due').on(t.dueOn),
  ]
)
