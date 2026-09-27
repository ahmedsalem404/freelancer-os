import { useDb } from '@/app/client/snapshot-query'
import { useMessageTemplate } from '@/app/client/use-message-template'
import { useDateFormat } from '@/shared/lib/dates'
import { daysBetween, todayIso } from '@/shared/model/dates'
import { useMoneyText } from '@/features/rates/ui/money'
import { invoiceBalance } from '../model/invoice-status'
import type { Invoice } from '../model/invoice.schema'

export type InvoiceMessageKey =
  'invoice_send' | 'reminder_due' | 'reminder_overdue'

/** The WhatsApp text for an invoice, from the owner's templates. */
export function useInvoiceMessage() {
  const db = useDb()
  const fill = useMessageTemplate()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  return (invoice: Invoice, key: InvoiceMessageKey) => {
    const client = db.clients.find((c) => c.id === invoice.clientId)
    const payMethods = db.paymentMethods
      .filter((m) => m.billingIdentityId === invoice.billingIdentityId)
      .map((m) => `• ${m.label}: ${m.details}`)
      .join('\n')
    return fill(key, {
      client_name: client?.name,
      invoice_number: invoice.number,
      amount: moneyText(invoice.amount, invoice.currency),
      balance: moneyText(invoiceBalance(db, invoice), invoice.currency),
      due_on: fmt(invoice.dueOn),
      days_late: Math.max(0, daysBetween(invoice.dueOn, todayIso())),
      pay_methods: payMethods,
    })
  }
}
