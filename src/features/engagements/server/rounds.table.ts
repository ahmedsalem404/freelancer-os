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
import { teamMembers } from '../../settings/server/team.table'
import {
  APPROVAL_DECISIONS,
  APPROVAL_SOURCES,
  ROUND_SOURCES,
} from '../model/enums'
import { deliverables } from './work.table'

/** Feedback rounds; `invoiceItemId` is set once an out-of-scope round is billed. */
export const reviewRounds = sqliteTable(
  'review_rounds',
  {
    id: id(),
    deliverableId: text()
      .notNull()
      .references(() => deliverables.id),
    roundNo: integer().notNull(),
    receivedOn: text().notNull(),
    note: text().notNull(),
    source: text({ enum: ROUND_SOURCES }).notNull().default('owner'),
    createdBy: text().references(() => teamMembers.id),
    portalLinkId: text(),
    invoiceItemId: text(),
    ...timestamps(),
  },
  (t) => [
    unique('round_no').on(t.deliverableId, t.roundNo),
    check('round_source', sql`${t.source} IN ${inList(ROUND_SOURCES)}`),
    index('rounds_invoice_item').on(t.invoiceItemId),
  ]
)

/** Append-only record of every approval / change request. */
export const approvals = sqliteTable(
  'approvals',
  {
    id: id(),
    deliverableId: text()
      .notNull()
      .references(() => deliverables.id),
    reviewRoundId: text().references(() => reviewRounds.id),
    source: text({ enum: APPROVAL_SOURCES }).notNull(),
    portalLinkId: text(),
    recordedBy: text().references(() => teamMembers.id),
    decision: text({ enum: APPROVAL_DECISIONS }).notNull(),
    signerName: text(),
    comment: text(),
    ipHash: text(),
    userAgent: text(),
    createdAt: text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    check('approval_source', sql`${t.source} IN ${inList(APPROVAL_SOURCES)}`),
    check(
      'approval_decision',
      sql`${t.decision} IN ${inList(APPROVAL_DECISIONS)}`
    ),
    index('approvals_deliverable').on(t.deliverableId, t.createdAt),
  ]
)
