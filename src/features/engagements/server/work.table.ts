import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { DELIVERABLE_ORIGINS } from '../model/enums'
import { engagements } from './engagements.table'

export const engagementStages = sqliteTable(
  'engagement_stages',
  {
    id: id(),
    engagementId: text()
      .notNull()
      .references(() => engagements.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    position: integer().notNull(),
    completedAt: text(),
    ...timestamps(),
  },
  (t) => [unique('stage_position').on(t.engagementId, t.position)]
)

/**
 * Deliverables. "Approved" is derived from `approvals`; `invoiceItemId` is a
 * plain id pointing at the line that billed a change-scope deliverable.
 */
export const deliverables = sqliteTable(
  'deliverables',
  {
    id: id(),
    engagementId: text()
      .notNull()
      .references(() => engagements.id),
    stageId: text().references(() => engagementStages.id, {
      onDelete: 'set null',
    }),
    title: text().notNull(),
    dueOn: text(),
    revisionLimit: integer().notNull(),
    origin: text({ enum: DELIVERABLE_ORIGINS }).notNull().default('contract'),
    invoiceItemId: text(),
    position: integer().notNull().default(0),
    cancelledAt: text(),
    ...timestamps(),
  },
  (t) => [
    check(
      'deliverable_origin',
      sql`${t.origin} IN ${inList(DELIVERABLE_ORIGINS)}`
    ),
    check('deliverable_limit', sql`${t.revisionLimit} >= 0`),
    check(
      'deliverable_scope_billed',
      sql`${t.origin} = 'contract' OR ${t.invoiceItemId} IS NOT NULL`
    ),
    index('deliverables_engagement').on(t.engagementId, t.position),
    index('deliverables_due').on(t.dueOn),
  ]
)
