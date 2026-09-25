import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, ne } from 'drizzle-orm'
import type { VoidInvoiceInput } from '../model/invoice.input'
import { invoices } from './invoices.table'
import { payments } from './payments.table'

/**
 * Cancels an issued invoice instead of editing it: the number stays used
 * and the invoice stays on record. Money already received blocks this —
 * refund or reassign the payment first.
 */
export function voidInvoice(ctx: Ctx, id: string, input: VoidInvoiceInput) {
  const invoice = required(
    ctx.db
      .select({ state: invoices.state })
      .from(invoices)
      .where(eq(invoices.id, id))
      .get(),
    'invoice',
    id
  )
  if (invoice.state !== 'issued') {
    throw new DomainError(
      'invoice_not_open',
      `Invoice ${id} is ${invoice.state}`,
      409
    )
  }
  const paid = ctx.db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.invoiceId, id), ne(payments.status, 'rejected')))
    .get()
  if (paid) {
    throw new DomainError(
      'invoice_has_payments',
      'This invoice has payments recorded against it',
      409
    )
  }

  ctx.db
    .update(invoices)
    .set({ state: 'void', voidedAt: ctx.now, voidReason: input.reason })
    .where(eq(invoices.id, id))
    .run()
  return { id }
}
