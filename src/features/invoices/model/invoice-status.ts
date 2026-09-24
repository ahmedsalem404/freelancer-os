import type { Invoice, InvoiceItem, Payment } from './invoice.schema'

/** Derived — never stored (docs/database.md §5.1). */
export type InvoiceStatus =
  'draft' | 'void' | 'unpaid' | 'partial' | 'paid' | 'overdue'

type PaymentsDb = { payments: Payment[] }

export const itemsOf = (db: { invoiceItems: InvoiceItem[] }, invoiceId: string) =>
  db.invoiceItems.filter((i) => i.invoiceId === invoiceId)

export const invoicePaid = (db: PaymentsDb, invoiceId: string) =>
  db.payments
    .filter((p) => p.invoiceId === invoiceId && p.status === 'confirmed')
    .reduce((sum, p) => sum + p.appliedAmount, 0)

export const invoiceBalance = (db: PaymentsDb, invoice: Invoice) =>
  Math.max(0, invoice.amount - invoicePaid(db, invoice.id))

export function invoiceStatus(
  db: PaymentsDb,
  invoice: Invoice,
  today: string
): InvoiceStatus {
  if (invoice.state === 'void') return 'void'
  if (invoice.state === 'draft') return 'draft'
  const paid = invoicePaid(db, invoice.id)
  if (paid >= invoice.amount) return 'paid'
  if (today > invoice.dueOn) return 'overdue'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

/** Issued, not void, not fully paid. */
export const isOpenInvoice = (db: PaymentsDb, invoice: Invoice, today: string) =>
  ['unpaid', 'partial', 'overdue'].includes(invoiceStatus(db, invoice, today))
