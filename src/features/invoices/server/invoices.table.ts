import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, moneyQuad, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagementCycles } from '../../engagements/server/cycles.table'
import { engagements } from '../../engagements/server/engagements.table'
import { deliverables } from '../../engagements/server/work.table'
import { billingIdentities } from '../../settings/server/identities.table'
import {
  INVOICE_ITEM_SOURCES,
  INVOICE_KINDS,
  INVOICE_STATES,
} from '../model/enums'

/** Invoices. Status / paid / balance are derived from payments (§5.1). */
export const invoices = sqliteTable(
  'invoices',
  {
    id: id(),
    number: text().unique(),
    state: text({ enum: INVOICE_STATES }).notNull().default('draft'),
    kind: text({ enum: INVOICE_KINDS }).notNull().default('standard'),
    clientId: text()
      .notNull()
      .references(() => clients.id),
    engagementId: text().references(() => engagements.id),
    billingIdentityId: text()
      .notNull()
      .references(() => billingIdentities.id),
    issueOn: text().notNull(),
    dueOn: text().notNull(),
    ...moneyQuad(),
    note: text(),
    issuedAt: text(),
    voidedAt: text(),
    voidReason: text(),
    lastSentAt: text(),
    ...timestamps(),
  },
  (t) => [
    check('invoice_state', sql`${t.state} IN ${inList(INVOICE_STATES)}`),
    check('invoice_kind', sql`${t.kind} IN ${inList(INVOICE_KINDS)}`),
    check(
      'invoice_issued_numbered',
      sql`${t.state} = 'draft' OR (${t.number} IS NOT NULL AND ${t.issuedAt} IS NOT NULL)`
    ),
    check(
      'invoice_void_dated',
      sql`${t.state} <> 'void' OR ${t.voidedAt} IS NOT NULL`
    ),
    check('invoice_due_after_issue', sql`${t.dueOn} >= ${t.issueOn}`),
    check('invoice_amount', sql`${t.amount} >= 0`),
    index('invoices_client').on(t.clientId, t.issueOn),
    index('invoices_engagement').on(t.engagementId),
    index('invoices_state_due').on(t.state, t.dueOn),
  ]
)

/** Invoice lines; each billed guard event points back to its line. */
export const invoiceItems = sqliteTable(
  'invoice_items',
  {
    id: id(),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    position: integer().notNull().default(0),
    description: text().notNull(),
    quantity: real().notNull().default(1),
    unitPrice: integer().notNull(),
    amount: integer().notNull(),
    sourceKind: text({ enum: INVOICE_ITEM_SOURCES })
      .notNull()
      .default('manual'),
    deliverableId: text().references(() => deliverables.id),
    cycleId: text().references(() => engagementCycles.id),
    ...timestamps(),
  },
  (t) => [
    check(
      'item_source',
      sql`${t.sourceKind} IN ${inList(INVOICE_ITEM_SOURCES)}`
    ),
    check('item_quantity', sql`${t.quantity} > 0`),
    check(
      'item_cycle_link',
      sql`${t.sourceKind} NOT IN ('retainer_overage','renewal') OR ${t.cycleId} IS NOT NULL`
    ),
    check(
      'item_deliverable_link',
      sql`${t.sourceKind} <> 'revision_overage' OR ${t.deliverableId} IS NOT NULL`
    ),
    index('items_invoice').on(t.invoiceId, t.position),
    index('items_cycle').on(t.cycleId),
    index('items_deliverable').on(t.deliverableId),
  ]
)
