import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, moneyQuad, timestamps } from '../../../shared/db/columns'
import { PAYMENT_METHOD_KINDS } from '../../settings/model/enums'
import { paymentMethods } from '../../settings/server/identities.table'
import { teamMembers } from '../../settings/server/team.table'
import { PAYMENT_STATUSES } from '../model/enums'
import { invoices } from './invoices.table'

/**
 * What was actually received (money quad, may differ from the invoice
 * currency) and how much of it is credited to the invoice (`appliedAmount`,
 * invoice currency). Only confirmed payments count.
 */
export const payments = sqliteTable(
  'payments',
  {
    id: id(),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id),
    ...moneyQuad(),
    appliedAmount: integer().notNull(),
    receivedOn: text().notNull(),
    paymentMethodId: text().references(() => paymentMethods.id),
    method: text('method_kind', { enum: PAYMENT_METHOD_KINDS }).notNull(),
    reference: text(),
    status: text({ enum: PAYMENT_STATUSES }).notNull().default('confirmed'),
    confirmedAt: text(),
    confirmedBy: text().references(() => teamMembers.id),
    note: text(),
    ...timestamps(),
  },
  (t) => [
    check('payment_status', sql`${t.status} IN ${inList(PAYMENT_STATUSES)}`),
    check(
      'payment_method_kind',
      sql`${t.method} IN ${inList(PAYMENT_METHOD_KINDS)}`
    ),
    check('payment_positive', sql`${t.appliedAmount} > 0 AND ${t.amount} > 0`),
    check(
      'payment_confirmed_dated',
      sql`${t.status} <> 'confirmed' OR ${t.confirmedAt} IS NOT NULL`
    ),
    index('payments_invoice').on(t.invoiceId),
    index('payments_received').on(t.receivedOn),
  ]
)
