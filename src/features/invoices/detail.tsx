import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import {
  invoiceBalance,
  invoicePaid,
  invoiceStatus,
  itemsOf,
} from '@/domain/selectors'
import type { Invoice } from '@/domain/types'
import { BellRing, MessageCircle, Printer, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from '@/components/fos/badges'
import { Money, useMoneyText } from '@/components/fos/money'
import { EmptyState, PageShell, Panel } from '@/components/fos/page'
import { RecordPaymentDialog } from '@/components/fos/record-payment-dialog'

export function InvoiceDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const invoice = useDb().invoices.find((i) => i.id === id)
  if (!invoice) {
    return (
      <PageShell title={t('invoice.notFound')}>
        <EmptyState>{t('common.empty')}</EmptyState>
      </PageShell>
    )
  }
  return <InvoiceView invoice={invoice} />
}

function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const db = useDb()
  const [isPaying, setIsPaying] = useState(false)
  const client = db.clients.find((c) => c.id === invoice.clientId)!
  const status = invoiceStatus(db, invoice, todayIso())
  const balance = invoiceBalance(db, invoice)
  const message = t('invoice.whatsappMessage', {
    name: client.name,
    number: invoice.number,
    amount: moneyText(balance || invoice.amount, invoice.currency),
    due: fmt(invoice.dueOn),
  })

  return (
    <PageShell
      eyebrow={t(`invoiceKind.${invoice.kind}`)}
      title={
        <span className='flex flex-wrap items-center gap-3'>
          <span className='num'>{invoice.number}</span>
          <InvoiceStatusBadge status={status} />
        </span>
      }
      actions={
        <>
          <Button variant='outline' size='sm' onClick={() => window.print()}>
            <Printer /> {t('common.print')}
          </Button>
          {balance > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsPaying(true)}
            >
              <Wallet /> {t('finance.recordPayment')}
            </Button>
          )}
          <Button
            asChild
            size='sm'
            className='bg-[#1f8a5b] text-white hover:bg-[#1f8a5b]/90'
          >
            <a
              href={waLink(client.whatsapp, message)}
              target='_blank'
              rel='noopener noreferrer'
            >
              <MessageCircle /> {t('common.whatsapp')}
            </a>
          </Button>
        </>
      }
    >
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
        <InvoiceDocument invoice={invoice} />
        <div className='grid content-start gap-4'>
          <Panel bodyClassName='grid gap-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('common.total')}</span>
              <Money
                amount={invoice.amount}
                currency={invoice.currency}
                rateToBase={invoice.rateToBase}
                showBase
                className='items-end'
              />
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('common.paid')}</span>
              <Money
                amount={invoicePaid(db, invoice.id)}
                currency={invoice.currency}
              />
            </div>
            <div className='flex justify-between border-t pt-2 font-medium'>
              <span>{t('common.balance')}</span>
              <Money amount={balance} currency={invoice.currency} />
            </div>
          </Panel>
          <RemindersPanel
            invoice={invoice}
            message={message}
            whatsapp={client.whatsapp}
          />
        </div>
      </div>
      <RecordPaymentDialog
        invoice={isPaying ? invoice : undefined}
        onOpenChange={(open) => !open && setIsPaying(false)}
      />
    </PageShell>
  )
}

type RemindersProps = { invoice: Invoice; message: string; whatsapp: string }

function RemindersPanel({ invoice, message, whatsapp }: RemindersProps) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const offsets = useDb().settings.reminderOffsets
  const now = todayIso()
  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <BellRing className='size-4' /> {t('invoice.reminders')}
        </span>
      }
      bodyClassName='grid gap-2'
    >
      <p className='text-xs text-muted-foreground'>
        {t('invoice.remindersHint')}
      </p>
      {offsets.map((offset) => {
        const on = format(
          addDays(parseISO(invoice.dueOn), offset),
          'yyyy-MM-dd'
        )
        const isDue = on <= now
        return (
          <div
            key={offset}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border p-2 text-sm',
              isDue && 'border-billable/50 bg-billable-soft/40'
            )}
          >
            <span className='grid'>
              <span>{t('invoice.reminderAt', { count: offset })}</span>
              <span className='text-xs text-muted-foreground'>{fmt(on)}</span>
            </span>
            {isDue && (
              <Button asChild size='sm' variant='ghost'>
                <a
                  href={waLink(whatsapp, message)}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t('common.whatsapp')}
                >
                  <MessageCircle />
                </a>
              </Button>
            )}
          </div>
        )
      })}
    </Panel>
  )
}

/** The printable document, styled by the client's billing identity. */
function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  const identity = db.identities.find(
    (i) => i.id === invoice.billingIdentityId
  )!
  const methods = db.paymentMethods.filter(
    (m) => m.billingIdentityId === identity.id
  )
  const client = db.clients.find((c) => c.id === invoice.clientId)!
  const items = itemsOf(db, invoice.id)

  return (
    <article className='print-area overflow-hidden rounded-xl border bg-white text-[#0d1f24] shadow-sm'>
      <div className='h-2' style={{ backgroundColor: identity.color }} />
      <div className='grid gap-8 p-6 sm:p-10'>
        <header className='flex flex-wrap items-start justify-between gap-6'>
          <div className='flex items-center gap-3'>
            <span
              className='grid size-12 place-items-center rounded-lg text-lg font-bold text-white'
              style={{ backgroundColor: identity.color }}
            >
              {identity.initials}
            </span>
            <div className='grid'>
              <span className='font-display text-lg font-semibold'>
                {identity.name}
              </span>
              <span className='text-xs text-[#5b6b6f]'>{identity.tagline}</span>
            </div>
          </div>
          <div className='grid gap-1 text-end'>
            <span className='font-display text-3xl font-semibold tracking-tight'>
              {t('invoice.title')}
            </span>
            <span className='num text-sm text-[#5b6b6f]'>{invoice.number}</span>
          </div>
        </header>

        <div className='grid gap-6 text-sm sm:grid-cols-3'>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.billTo')}
            </span>
            <span className='font-medium'>{client.company ?? client.name}</span>
            {client.company && <span>{client.name}</span>}
            <span className='num text-[#5b6b6f]'>+{client.whatsapp}</span>
          </div>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.issueDate')}
            </span>
            <span>{fmt(invoice.issueOn, 'd MMMM yyyy')}</span>
          </div>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.dueDate')}
            </span>
            <span className='font-medium'>
              {fmt(invoice.dueOn, 'd MMMM yyyy')}
            </span>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[480px] text-sm'>
            <thead>
              <tr className='border-b-2 border-[#0d1f24] text-xs'>
                <th className='py-2 text-start font-medium'>
                  {t('invoice.item')}
                </th>
                <th className='py-2 text-center font-medium'>
                  {t('invoice.qty')}
                </th>
                <th className='py-2 text-end font-medium'>
                  {t('invoice.price')}
                </th>
                <th className='py-2 text-end font-medium'>
                  {t('invoice.lineTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className='border-b border-[#dde3e1]'>
                  <td className='py-3'>{item.description}</td>
                  <td className='num py-3 text-center'>{item.quantity}</td>
                  <td className='py-3 text-end'>
                    <Money
                      amount={item.unitPrice}
                      currency={invoice.currency}
                    />
                  </td>
                  <td className='py-3 text-end'>
                    <Money amount={item.amount} currency={invoice.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='flex justify-end'>
          <div
            className='grid min-w-56 gap-1 rounded-lg p-4'
            style={{ backgroundColor: `${identity.color}14` }}
          >
            <span className='text-xs text-[#5b6b6f]'>{t('invoice.total')}</span>
            <Money
              amount={invoice.amount}
              currency={invoice.currency}
              className='text-2xl font-semibold'
            />
          </div>
        </div>

        <footer className='grid gap-3 border-t border-[#dde3e1] pt-6 text-sm'>
          <span className='text-xs font-medium text-[#5b6b6f]'>
            {t('invoice.payWith')}
          </span>
          <div className='grid gap-2 sm:grid-cols-2'>
            {methods.map((m) => (
              <div
                key={m.id}
                className='rounded-lg border border-[#dde3e1] p-3'
              >
                <div className='font-medium'>{m.label}</div>
                <div className='num text-xs text-[#5b6b6f]'>{m.details}</div>
              </div>
            ))}
          </div>
          <p className='text-xs text-[#5b6b6f]'>
            {t('invoice.thanks')} {identity.invoiceFooter}
          </p>
        </footer>
      </div>
    </article>
  )
}
