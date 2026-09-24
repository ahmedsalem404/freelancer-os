import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { CURRENCIES } from '../../../shared/money/currency'
import { IDENTITY_KINDS, PAYMENT_METHOD_KINDS } from '../model/enums'

/** Personal name vs studio — which identity is printed on an invoice. */
export const billingIdentities = sqliteTable(
  'billing_identities',
  {
    id: id(),
    kind: text({ enum: IDENTITY_KINDS }).notNull(),
    name: text().notNull(),
    legalName: text(),
    tagline: text().notNull().default(''),
    initials: text().notNull(),
    color: text().notNull(),
    whatsapp: text(),
    email: text(),
    address: text(),
    taxNumber: text(),
    invoiceFooter: text(),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [check('identity_kind', sql`${t.kind} IN ${inList(IDENTITY_KINDS)}`)]
)

/** Bank / Kuraimi / USDT / cash details printed on invoices (not secrets). */
export const paymentMethods = sqliteTable(
  'payment_methods',
  {
    id: id(),
    billingIdentityId: text()
      .notNull()
      .references(() => billingIdentities.id),
    kind: text({ enum: PAYMENT_METHOD_KINDS }).notNull(),
    label: text().notNull(),
    details: text().notNull(),
    currency: text({ enum: CURRENCIES }),
    position: integer().notNull().default(0),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [
    check(
      'payment_method_kind',
      sql`${t.kind} IN ${inList(PAYMENT_METHOD_KINDS)}`
    ),
    index('payment_methods_identity').on(t.billingIdentityId, t.position),
  ]
)
