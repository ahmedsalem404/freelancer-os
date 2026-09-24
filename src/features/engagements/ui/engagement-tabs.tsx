import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { useDateFormat } from '@/shared/lib/dates'
import { FileText, ImageIcon, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { engagementCurrentValue } from '@/features/engagements/model/guard'
import { invoicePaid } from '@/features/invoices/model/invoice-status'
import { InvoiceTable } from '@/features/invoices/ui/invoice-table'
import { Money } from '@/features/rates/ui/money'

export function MoneyTab({ engagement: e }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const db = useDb()
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
      <Panel bodyClassName='p-0'>
        <InvoiceTable invoices={invoices} showClient={false} />
      </Panel>
    </div>
  )
}

export function TimeTab({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const timeEntries = useDb().timeEntries
  const team = useDb().team
  const entries = timeEntries.filter((x) => x.engagementId === engagementId)
  if (entries.length === 0) return <EmptyState>{t('common.empty')}</EmptyState>
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
          >
            <div className='grid gap-0.5'>
              <span>{entry.description}</span>
              <span className='text-xs text-muted-foreground'>
                {fmt(entry.workOn)} ·{' '}
                {team.find((m) => m.id === entry.memberId)?.name}
              </span>
            </div>
            <span className='num text-muted-foreground'>
              {t('time.hoursShort', {
                h: Math.round((entry.minutes / 60) * 10) / 10,
              })}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function FilesTab({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const attachments = useDb().attachments
  const files = attachments.filter((a) => a.engagementId === engagementId)
  return (
    <Panel
      title={t('engagements.attachments')}
      action={
        <Button
          size='sm'
          variant='outline'
          onClick={() => toast(t('settings.backendSoon'))}
        >
          <Upload /> {t('common.upload')}
        </Button>
      }
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('engagements.attachmentsHint')}
      </p>
      {files.length === 0 ? (
        <EmptyState>{t('engagements.noAttachments')}</EmptyState>
      ) : (
        <ul className='grid gap-2 sm:grid-cols-2'>
          {files.map((file) => (
            <li
              key={file.id}
              className='flex items-center gap-3 rounded-lg border p-3 text-sm'
            >
              {file.kind === 'agreement_chat' ? (
                <ImageIcon className='size-5 text-chart-3' />
              ) : (
                <FileText className='size-5 text-primary' />
              )}
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate'>{file.fileName}</span>
                <span className='text-xs text-muted-foreground'>
                  {t(`engagements.attachmentKind.${file.kind}`)} ·{' '}
                  {fmt(file.uploadedOn)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
