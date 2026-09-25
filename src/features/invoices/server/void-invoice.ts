import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { VoidInvoiceInput } from '../model/invoice.input'
import { invoices } from './invoices.table'
import { payments } from './payments.table'

/**
 * Billed revision rounds point at their invoice line; a void frees them so
 * they can be billed again. `engagements` sits above `invoices`, so the
 * back-link is cleared by id (ARCHITECTURE.md §3, rule 7).
 */
function releaseRevisionRounds(ctx: Ctx, invoiceId: string) {
  ctx.db.run(
    sql`UPDATE review_rounds SET invoice_item_id = NULL
        WHERE invoice_item_id IN
          (SELECT id FROM invoice_items WHERE invoice_id = ${invoiceId})`
  )
}

/**
 * Cancels an issued invoice instead of editing it: the number stays used
 * and the invoice stays on record. Money already received blocks this —
 * refund or reassign the payment first. A renewal invoice is refused: its
 * new cycle is already open, and undoing a renewal is its own flow.
 */
export function voidInvoice(ctx: Ctx, id: string, input: VoidInvoiceInput) {
  const invoice = required(
    ctx.db
      .select({ state: invoices.state, kind: invoices.kind })
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
  if (invoice.kind === 'renewal') {
    throw new DomainError(
      'invoice_is_renewal',
      'A renewal invoice cannot be voided',
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
  releaseRevisionRounds(ctx, id)
  return { id }
}
