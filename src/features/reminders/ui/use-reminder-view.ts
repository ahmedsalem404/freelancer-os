import { useDb } from '@/app/client/snapshot-query'
import { useMessageTemplate } from '@/app/client/use-message-template'
import { useDateFormat } from '@/shared/lib/dates'
import { useTranslation } from 'react-i18next'
import { useInvoiceMessage } from '@/features/invoices'
import { useMoneyText } from '@/features/rates/ui/money'
import type { PendingReminder } from '../model/schedule'

/** What the reminders list shows for one pending reminder. */
export type ReminderView = {
  title: string
  detail: string
  /** Where to send it; absent for the owner's own reminders. */
  whatsapp?: string
  message?: string
  link?: { to: '/invoices/$id' | '/engagements/$id'; id: string }
  /** An important date can be marked renewed from the list. */
  importantDateId?: string
  /** An own subscription can be recorded as renewed and paid. */
  ownSubscriptionId?: string
}

/** Turns a pending reminder into its title, message and destination. */
export function useReminderView() {
  const { t } = useTranslation()
  const db = useDb()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const fill = useMessageTemplate()
  const invoiceMessage = useInvoiceMessage()
  const clientOf = (id?: string) => db.clients.find((c) => c.id === id)

  return (r: PendingReminder): ReminderView | undefined => {
    const when = fmt(r.occurrenceOn)
    if (r.kind === 'invoice_due') {
      const invoice = db.invoices.find((i) => i.id === r.targetId)
      if (!invoice) return undefined
      const client = clientOf(invoice.clientId)
      return {
        title: t('reminders.invoice', { number: invoice.number }),
        detail: `${client?.company ?? client?.name ?? ''} · ${when}`,
        whatsapp: client?.whatsapp,
        message: invoiceMessage(
          invoice,
          r.offsetDays > 0 ? 'reminder_overdue' : 'reminder_due'
        ),
        link: { to: '/invoices/$id', id: invoice.id },
      }
    }
    if (r.kind === 'subscription_renewal') {
      const e = db.engagements.find((x) => x.id === r.targetId)
      if (!e) return undefined
      const client = clientOf(e.clientId)
      return {
        title: t('reminders.renewal', { name: e.title }),
        detail: `${client?.company ?? client?.name ?? ''} · ${when}`,
        whatsapp: client?.whatsapp,
        message: fill('renewal_notice', {
          client_name: client?.name,
          service: e.title,
          ends_on: when,
          amount: moneyText(e.amount, e.currency),
        }),
        link: { to: '/engagements/$id', id: e.id },
      }
    }
    if (r.kind === 'lead_follow_up') {
      const lead = db.leads.find((l) => l.id === r.targetId)
      if (!lead) return undefined
      return {
        title: t('reminders.lead', { name: lead.company ?? lead.name }),
        detail: `${lead.service} · ${when}`,
        whatsapp: lead.whatsapp,
        message: fill('lead_follow_up', {
          client_name: lead.name,
          service: lead.service,
        }),
      }
    }
    if (r.kind === 'own_subscription') {
      const sub = db.ownSubscriptions.find((s) => s.id === r.targetId)
      if (!sub) return undefined
      return {
        title: t('reminders.own', { name: sub.name }),
        detail: `${moneyText(sub.amount, sub.currency)} · ${when}`,
        ownSubscriptionId: sub.id,
      }
    }
    const date = db.importantDates.find((d) => d.id === r.targetId)
    if (!date) return undefined
    return {
      title: date.title,
      detail: `${t(`calendar.kinds.${date.kind}`)} · ${when}`,
      importantDateId: date.id,
    }
  }
}
