import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '@/lib/dates'
import { invoiceBalance, invoiceStatus } from '@/domain/selectors'
import type { Invoice } from '@/domain/types'
import { today, useStore } from '@/mock/store'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from './badges'
import { Money } from './money'
import { EmptyState } from './page'
import { RecordPaymentDialog } from './record-payment-dialog'

type Props = { invoices: Invoice[]; showClient?: boolean }

export function InvoiceTable({ invoices, showClient = true }: Props) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useStore()
  const [paying, setPaying] = useState<Invoice>()
  const now = today()

  if (invoices.length === 0) return <EmptyState>{t('common.empty')}</EmptyState>

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[640px] text-sm'>
          <thead className='text-xs text-muted-foreground'>
            <tr className='border-b'>
              <th className='px-4 py-2 text-start font-medium'>
                {t('finance.number')}
              </th>
              {showClient && (
                <th className='px-4 py-2 text-start font-medium'>
                  {t('common.client')}
                </th>
              )}
              <th className='px-4 py-2 text-start font-medium'>
                {t('common.due')}
              </th>
              <th className='px-4 py-2 text-start font-medium'>
                {t('common.status')}
              </th>
              <th className='px-4 py-2 text-end font-medium'>
                {t('common.total')}
              </th>
              <th className='px-4 py-2 text-end font-medium'>
                {t('common.balance')}
              </th>
              <th className='px-4 py-2' />
            </tr>
          </thead>
          <tbody className='divide-y'>
            {invoices.map((inv) => {
              const status = invoiceStatus(db, inv, now)
              const client = db.clients.find((c) => c.id === inv.clientId)
              const balance = invoiceBalance(db, inv)
              return (
                <tr
                  key={inv.id}
                  className='transition-colors hover:bg-accent/30'
                >
                  <td className='px-4 py-3'>
                    <Link
                      to='/invoices/$id'
                      params={{ id: inv.id }}
                      className='num font-medium hover:underline'
                    >
                      {inv.number}
                    </Link>
                    <div className='text-xs text-muted-foreground'>
                      {t(`invoiceKind.${inv.kind}`)}
                    </div>
                  </td>
                  {showClient && (
                    <td className='px-4 py-3'>
                      {client?.company ?? client?.name}
                    </td>
                  )}
                  <td className='px-4 py-3 text-muted-foreground'>
                    {fmt(inv.dueOn)}
                  </td>
                  <td className='px-4 py-3'>
                    <InvoiceStatusBadge status={status} />
                  </td>
                  <td className='px-4 py-3 text-end'>
                    <Money
                      amount={inv.amount}
                      currency={inv.currency}
                      rateToBase={inv.rateToBase}
                      showBase
                    />
                  </td>
                  <td className='px-4 py-3 text-end'>
                    <Money amount={balance} currency={inv.currency} />
                  </td>
                  <td className='px-4 py-3 text-end'>
                    {balance > 0 && inv.state === 'issued' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setPaying(inv)}
                      >
                        {t('finance.recordPayment')}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <RecordPaymentDialog
        invoice={paying}
        onOpenChange={(open) => !open && setPaying(undefined)}
      />
    </>
  )
}
