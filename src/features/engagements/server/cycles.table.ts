import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { teamMembers } from '../../settings/server/team.table'
import { CYCLE_DECISIONS } from '../model/enums'
import { engagements } from './engagements.table'

/**
 * One row per retainer/subscription period — history, never overwritten.
 * `renewalInvoiceId` is a plain id (invoices depend on engagements, not back).
 */
export const engagementCycles = sqliteTable(
  'engagement_cycles',
  {
    id: id(),
    engagementId: text()
      .notNull()
      .references(() => engagements.id, { onDelete: 'cascade' }),
    seq: integer().notNull(),
    startsOn: text().notNull(),
    endsOn: text().notNull(),
    amount: integer().notNull(),
    includedUnits: real(),
    graceDays: integer().notNull().default(0),
    graceExtendedDays: integer().notNull().default(0),
    decision: text({ enum: CYCLE_DECISIONS }).notNull().default('pending'),
    decidedAt: text(),
    decidedBy: text().references(() => teamMembers.id),
    decisionNote: text(),
    renewalInvoiceId: text(),
    serviceStoppedOn: text(),
    ...timestamps(),
  },
  (t) => [
    unique('cycle_seq').on(t.engagementId, t.seq),
    check('cycle_decision', sql`${t.decision} IN ${inList(CYCLE_DECISIONS)}`),
    check('cycle_dates', sql`${t.endsOn} > ${t.startsOn}`),
    check(
      'cycle_renewed_has_invoice',
      sql`${t.decision} <> 'renewed' OR ${t.renewalInvoiceId} IS NOT NULL`
    ),
    uniqueIndex('cycle_one_open')
      .on(t.engagementId)
      .where(sql`${t.decision} IN ('pending','grace')`),
    index('cycles_ends_on').on(t.endsOn),
  ]
)
