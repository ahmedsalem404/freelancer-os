import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { and, eq, sum } from 'drizzle-orm'
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
      .select({
        state: invoices.state,
        currency: invoices.currency,
        amount: invoices.amount,
      })
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

  const paid = ctx.db
    .select({ total: sum(payments.appliedAmount) })
    .from(payments)
    .where(
      and(eq(payments.invoiceId, invoiceId), eq(payments.status, 'confirmed'))
    )
    .get()
  const balance = invoice.amount - Number(paid?.total ?? 0)
  if (input.amountMinor > balance) {
    throw new DomainError(
      'overpayment',
      `Payment exceeds the remaining balance (${balance})`,
      422
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

  return { id }
}
