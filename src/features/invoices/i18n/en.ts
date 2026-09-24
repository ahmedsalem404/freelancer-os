import type { Widen } from '@/shared/i18n/widen'
import type { invoicesAr } from './ar'

export const invoicesEn: Widen<typeof invoicesAr> = {
  invoiceStatus: {
    unpaid: 'Unpaid',
    partial: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    draft: 'Draft',
    void: 'Void',
  },
  invoiceKind: {
    standard: 'Standard',
    deposit: 'Deposit',
    overage: 'Overage',
    renewal: 'Renewal',
    scope: 'Scope change',
  },
  payMethod: {
    bank: 'Bank transfer',
    kuraimi: 'Kuraimi',
    usdt: 'USDT',
    cash: 'Cash',
  },
  invoice: {
    title: 'Invoice',
    billTo: 'Bill to',
    from: 'From',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    lineTotal: 'Total',
    total: 'Amount due',
    payWith: 'Payment methods',
    thanks: 'Thank you for your trust.',
    whatsappMessage:
      'Hi {{name}}, here is invoice {{number}} for {{amount}}, due {{due}}. Thank you.',
    reminders: 'Automatic reminders',
    remindersHint: 'A ready message from the system — no awkwardness',
    reminderAt_zero: 'On the due date',
    reminderAt: '{{count}} days after',
    notFound: 'Invoice not found',
  },
}
