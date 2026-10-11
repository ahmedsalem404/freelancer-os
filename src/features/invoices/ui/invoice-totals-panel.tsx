import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { useTranslation } from 'react-i18next'
import { invoicePaid } from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { Money } from '@/features/rates/ui/money'

/** Total, paid and balance of one invoice. */
export function InvoiceTotalsPanel({
  invoice,
  balance,
}: {
  invoice: Invoice
  balance: number
}) {
  const { t } = useTranslation()
  const db = useDb()
  return (
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
  )
}
