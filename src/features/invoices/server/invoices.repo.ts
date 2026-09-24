import type { Database } from '@/shared/db/database'
import { asc, desc } from 'drizzle-orm'
import { invoiceItems, invoices } from './invoices.table'
import { payments } from './payments.table'

/** Snapshot slice owned by `invoices`. Status/paid/balance stay derived. */
export function loadInvoices(db: Database) {
  return {
    invoices: db.select().from(invoices).orderBy(desc(invoices.issueOn)).all(),
    invoiceItems: db
      .select()
      .from(invoiceItems)
      .orderBy(asc(invoiceItems.invoiceId), asc(invoiceItems.position))
      .all(),
    payments: db
      .select()
      .from(payments)
      .orderBy(desc(payments.receivedOn))
      .all(),
  }
}
