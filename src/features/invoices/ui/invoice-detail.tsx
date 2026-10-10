import { useEffect, useRef, useState } from 'react'
import {
  useCanGoBack,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { RecordNotFound } from '@/app/client/layout/record-not-found'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import {
  ArrowRight,
  Ban,
  FileDown,
  MessageCircle,
  Printer,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { fileUrl } from '@/features/files'
import {
  invoiceBalance,
  invoicePaid,
  invoiceStatus,
} from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { InvoiceStatusBadge } from '@/features/invoices/ui/invoice-status-badge'
import { RecordPaymentDialog } from '@/features/invoices/ui/record-payment-dialog'
import { Money } from '@/features/rates/ui/money'
import { InvoiceDocument } from './invoice-document'
import { RemindersPanel } from './reminders-panel'
import { useInvoiceMessage } from './use-invoice-message'
import { useSaveInvoicePdf } from './use-save-invoice-pdf'
import { VoidInvoiceDialog } from './void-invoice-dialog'

export function InvoiceDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const invoice = useDb().invoices.find((i) => i.id === id)
  if (!invoice) {
    return <RecordNotFound title={t('invoice.notFound')} backTo='/finance' />
  }
  return <InvoiceView invoice={invoice} />
}

function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation()
  const invoiceMessage = useInvoiceMessage()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()
  const pdf = useSaveInvoicePdf()
  const { state } = useLocation()
  const db = useDb()
  const [isPaying, setIsPaying] = useState(false)
  const [isVoiding, setIsVoiding] = useState(false)
  const savedPdf = db.attachments.find((a) => a.invoiceId === invoice.id)
  const canSavePdf = invoice.engagementId !== undefined && !savedPdf
  // Just issued from an engagement: keep a PDF copy with its files, once.
  const wantsPdf = state.attachPdf === true
  const hasTried = useRef(false)
  useEffect(() => {
    if (!wantsPdf || !canSavePdf || hasTried.current) return
    hasTried.current = true
    void pdf.save(invoice).then(() =>
      navigate({
        to: '/invoices/$id',
        params: { id: invoice.id },
        replace: true,
        state: {},
      })
    )
  }, [wantsPdf, canSavePdf, pdf, invoice, navigate])
  const client = db.clients.find((c) => c.id === invoice.clientId)!
  const status = invoiceStatus(db, invoice, todayIso())
  const isVoid = invoice.state === 'void'
  const balance = isVoid ? 0 : invoiceBalance(db, invoice)
  // Mirrors the server: invoices with payments stay on record.
  const canVoid =
    invoice.state === 'issued' &&
    !db.payments.some(
      (p) => p.invoiceId === invoice.id && p.status !== 'rejected'
    )
  const message = invoiceMessage(invoice, 'invoice_send')
  // Back to where the user came from; a direct link falls back to its list.
  const goBack = () =>
    canGoBack
      ? router.history.back()
      : invoice.engagementId
        ? navigate({
            to: '/engagements/$id',
            params: { id: invoice.engagementId },
          })
        : navigate({ to: '/finance' })

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
          <Button variant='outline' size='sm' onClick={goBack}>
            <ArrowRight className='ltr:rotate-180' /> {t('common.back')}
          </Button>
          <Button variant='outline' size='sm' onClick={() => window.print()}>
            <Printer /> {t('common.print')}
          </Button>
          {canSavePdf && (
            <Button
              variant='outline'
              size='sm'
              disabled={pdf.isPending}
              onClick={() => void pdf.save(invoice)}
            >
              <FileDown />{' '}
              {t(pdf.isPending ? 'invoice.pdf.saving' : 'invoice.pdf.save')}
            </Button>
          )}
          {savedPdf?.hasFile && (
            <Button asChild variant='outline' size='sm'>
              <a
                href={fileUrl(savedPdf.id)}
                target='_blank'
                rel='noopener noreferrer'
              >
                <FileDown /> {t('invoice.pdf.open')}
              </a>
            </Button>
          )}
          {balance > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsPaying(true)}
            >
              <Wallet /> {t('finance.recordPayment')}
            </Button>
          )}
          {canVoid && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsVoiding(true)}
            >
              <Ban /> {t('invoice.void.action')}
            </Button>
          )}
          {!isVoid && (
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
          )}
        </>
      }
    >
      {isVoid && invoice.voidReason && (
        <p className='rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground'>
          {t('invoice.void.reasonLabel')} {invoice.voidReason}
        </p>
      )}
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
          {!isVoid && (
            <RemindersPanel invoice={invoice} whatsapp={client.whatsapp} />
          )}
        </div>
      </div>
      <RecordPaymentDialog
        invoice={isPaying ? invoice : undefined}
        onOpenChange={(open) => !open && setIsPaying(false)}
      />
      {isVoiding && (
        <VoidInvoiceDialog
          invoice={invoice}
          onClose={() => setIsVoiding(false)}
        />
      )}
    </PageShell>
  )
}
