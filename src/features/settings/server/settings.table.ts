import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { timestamps } from '../../../shared/db/columns'
import { billingIdentities } from './identities.table'

/** One row only (id = 1) — every business rule is read from here. */
export const settings = sqliteTable(
  'settings',
  {
    id: integer().primaryKey().default(1),
    businessName: text().notNull().default('Freelancer OS'),
    timezone: text().notNull().default('Asia/Aden'),
    defaultBillingIdentityId: text().references(() => billingIdentities.id),
    invoicePrefix: text().notNull().default('INV'),
    invoiceSeqYear: integer().notNull(),
    invoiceSeqNext: integer().notNull().default(1),
    invoiceSeqPad: integer().notNull().default(3),
    defaultDueDays: integer().notNull().default(7),
    reminderOffsets: text({ mode: 'json' })
      .$type<number[]>()
      .notNull()
      .default(sql`'[0,7,14]'`),
    renewalNoticeDays: integer().notNull().default(7),
    defaultRevisionLimit: integer().notNull().default(2),
    defaultGraceDays: integer().notNull().default(5),
    meterNearRatio: real().notNull().default(0.8),
    dueSoonDays: integer().notNull().default(7),
    ...timestamps(),
  },
  (t) => [
    check('settings_single_row', sql`${t.id} = 1`),
    check('settings_due_days', sql`${t.defaultDueDays} >= 0`),
  ]
)
