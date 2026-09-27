import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Money } from '@/features/rates/ui/money'

export function PaymentsList() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {db.payments.map((p) => {
          const invoice = db.invoices.find((i) => i.id === p.invoiceId)
          const client = db.clients.find((c) => c.id === invoice?.clientId)
          const hasProof = db.attachments.some((a) => a.paymentId === p.id)
          return (
            <li
              key={p.id}
              className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm'
            >
              <div className='grid gap-0.5'>
                <span className='font-medium'>
                  {client?.company ?? client?.name}
                </span>
                <span className='text-xs text-muted-foreground'>
                  <span className='num'>{invoice?.number}</span> ·{' '}
                  {fmt(p.receivedOn)} · {t(`payMethod.${p.method}`)}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <span
                  className={
                    hasProof
                      ? 'inline-flex items-center gap-1 text-xs text-success'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {hasProof && <Paperclip className='size-3.5' />}
                  {hasProof ? t('finance.proofAttached') : t('finance.noProof')}
                </span>
                <Money
                  amount={p.amount}
                  currency={p.currency}
                  rateToBase={p.rateToBase}
                  showBase
                />
              </div>
            </li>
          )
        })}
      </ul>
      {db.payments.length === 0 && (
        <div className='p-4'>
          <EmptyState>{t('common.empty')}</EmptyState>
        </div>
      )}
    </Panel>
  )
}
