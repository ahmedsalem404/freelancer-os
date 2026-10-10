import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { engagementCurrentValue } from '@/features/engagements/model/guard'
import { invoicePaid } from '@/features/invoices/model/invoice-status'
import { InvoiceTable } from '@/features/invoices/ui/invoice-table'
import { NewInvoiceDialog } from '@/features/invoices/ui/new-invoice-dialog'
import { Money } from '@/features/rates/ui/money'

export function MoneyTab({ engagement: e }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const db = useDb()
  const [isInvoicing, setIsInvoicing] = useState(false)
  const invoices = db.invoices.filter((i) => i.engagementId === e.id)
  const invoiced = invoices
    .filter((i) => i.state === 'issued')
    .reduce((s, i) => s + i.amount, 0)
  const collected = invoices.reduce((s, i) => s + invoicePaid(db, i.id), 0)

  return (
    <div className='grid gap-4'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <StatTile
          label={t('engagements.contractValue')}
          value={
            <Money
              amount={engagementCurrentValue(db, e)}
              currency={e.currency}
            />
          }
        />
        <StatTile
          label={t('engagements.invoiced')}
          value={<Money amount={invoiced} currency={e.currency} />}
        />
        <StatTile
          label={t('engagements.collected')}
          value={<Money amount={collected} currency={e.currency} />}
        />
      </div>
      <Panel
        bodyClassName='p-0'
        action={
          <Button
            size='sm'
            variant='outline'
            onClick={() => setIsInvoicing(true)}
          >
            <Plus /> {t('engagements.newInvoice')}
          </Button>
        }
      >
        <InvoiceTable invoices={invoices} showClient={false} />
      </Panel>
      {isInvoicing && (
        <NewInvoiceDialog
          clientId={e.clientId}
          engagementId={e.id}
          onClose={() => setIsInvoicing(false)}
        />
      )}
    </div>
  )
}
