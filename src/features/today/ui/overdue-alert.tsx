import { Link } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { daysFrom } from '@/shared/lib/dates'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useInvoiceMessage } from '@/features/invoices'
import { invoiceBalance } from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { useMoneyText } from '@/features/rates/ui/money'

/** An overdue invoice with a one-tap WhatsApp reminder. */
export function OverdueAlert({ invoice: inv }: { invoice: Invoice }) {
  const { t } = useTranslation()
  const invoiceMessage = useInvoiceMessage()
  const moneyText = useMoneyText()
  const db = useDb()
  const now = todayIso()
  const client = db.clients.find((c) => c.id === inv.clientId)
  if (!client) return null
  const balance = invoiceBalance(db, inv)
  const text = invoiceMessage(inv, 'reminder_overdue')
  return (
    <li
      key={inv.id}
      className='flex flex-wrap items-center justify-between gap-3 p-4'
    >
      <div className='grid gap-0.5'>
        <Link
          to='/invoices/$id'
          params={{ id: inv.id }}
          className='font-medium hover:underline'
        >
          <span className='num'>{inv.number}</span> ·{' '}
          {client.company ?? client.name}
        </Link>
        <span className='text-xs text-overdue'>
          {t('invoiceStatus.overdue')} ·{' '}
          {t('common.daysAgo', {
            count: -daysFrom(now, inv.dueOn),
          })}{' '}
          · {moneyText(balance, inv.currency)}
        </span>
      </div>
      <Button asChild size='sm' variant='outline'>
        <a
          href={waLink(client.whatsapp, text)}
          target='_blank'
          rel='noopener noreferrer'
        >
          {t('common.whatsapp')}
        </a>
      </Button>
    </li>
  )
}
