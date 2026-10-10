import { useDb } from '@/app/client/snapshot-query'
import { itemsOf } from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { InvoiceSheet } from './invoice-sheet'

/** A saved invoice as the client sees it (and as it prints). */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const db = useDb()
  const identity = db.identities.find(
    (i) => i.id === invoice.billingIdentityId
  )!
  return (
    <InvoiceSheet
      identity={identity}
      client={db.clients.find((c) => c.id === invoice.clientId)!}
      number={invoice.number}
      issueOn={invoice.issueOn}
      dueOn={invoice.dueOn}
      items={itemsOf(db, invoice.id)}
      currency={invoice.currency}
      amount={invoice.amount}
      methods={db.paymentMethods.filter(
        (m) => m.billingIdentityId === identity.id
      )}
      channel={
        db.engagements.find((e) => e.id === invoice.engagementId)
          ?.paymentChannel
      }
    />
  )
}
