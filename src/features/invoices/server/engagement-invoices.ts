import type { Database } from '@/shared/db/database'
import { parseRows } from '@/shared/model/schema'
import { eq, inArray } from 'drizzle-orm'
import { invoiceItemSchema, invoiceSchema } from '../model/invoice.schema'
import { invoiceItems, invoices } from './invoices.table'

/** An engagement's invoices and their lines, typed for the pure selectors. */
export function engagementInvoices(db: Database, engagementId: string) {
  const rows = db
    .select()
    .from(invoices)
    .where(eq(invoices.engagementId, engagementId))
    .all()
  const ids = rows.map((row) => row.id)
  const items =
    ids.length === 0
      ? []
      : db
          .select()
          .from(invoiceItems)
          .where(inArray(invoiceItems.invoiceId, ids))
          .all()
  return {
    invoices: parseRows(invoiceSchema, rows),
    invoiceItems: parseRows(invoiceItemSchema, items),
  }
}
