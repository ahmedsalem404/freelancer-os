import { money } from '@/shared/money/money'
import { addAttachment } from '@/features/files/server'
import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import type { RecordPaymentInput } from '../model/invoice.input'
import { invoices } from './invoices.table'
import { payments } from './payments.table'

/** Records a confirmed payment (and its proof's metadata) on an issued invoice. */
export function recordPayment(
  ctx: Ctx,
  invoiceId: string,
  input: RecordPaymentInput
) {
  const invoice = required(
    ctx.db
      .select({ state: invoices.state, currency: invoices.currency })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get(),
    'invoice',
    invoiceId
  )
  if (invoice.state !== 'issued') {
    throw new DomainError(
      'invoice_not_open',
      `Invoice ${invoiceId} is ${invoice.state}`,
      409
    )
  }

  const id = newId('pay')
  ctx.db
    .insert(payments)
    .values({
      id,
      invoiceId,
      ...money(input.amountMinor, invoice.currency, input.rateToBase),
      appliedAmount: input.amountMinor,
      receivedOn: ctx.today,
      method: input.method,
      status: 'confirmed',
      confirmedAt: ctx.now,
      confirmedBy: ctx.memberId,
    })
    .run()

  if (input.proofName) {
    addAttachment(ctx, {
      kind: 'payment_proof',
      fileName: input.proofName,
      paymentId: id,
    })
  }
  return { id }
}
