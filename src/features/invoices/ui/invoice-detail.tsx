import { useState } from 'react'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import { MessageCircle, Printer, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  invoiceBalance,
  invoicePaid,
  invoiceStatus,
} from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { InvoiceStatusBadge } from '@/features/invoices/ui/invoice-status-badge'
import { RecordPaymentDialog } from '@/features/invoices/ui/record-payment-dialog'
import { Money, useMoneyText } from '@/features/rates/ui/money'
import { InvoiceDocument } from './invoice-document'
import { RemindersPanel } from './reminders-panel'

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
