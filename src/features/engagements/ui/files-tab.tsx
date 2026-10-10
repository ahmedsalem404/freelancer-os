import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { todayIso } from '@/shared/model/dates'
import { Receipt, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AttachmentList, UploadDialog } from '@/features/files'
import { invoiceStatus } from '@/features/invoices/model/invoice-status'
import { InvoiceStatusBadge } from '@/features/invoices/ui/invoice-status-badge'
import { Money } from '@/features/rates/ui/money'

/** What an engagement's evidence can be. */
const ENGAGEMENT_FILE_KINDS = [
  'agreement_chat',
  'contract',
  'deliverable_file',
  'other',
] as const

/** Agreement evidence and delivered files for one engagement. */
export function FilesTab({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const db = useDb()
  const files = db.attachments.filter((a) => a.engagementId === engagementId)
  const invoices = db.invoices.filter((i) => i.engagementId === engagementId)
  const [isUploading, setIsUploading] = useState(false)
  return (
    <Panel
      title={t('engagements.attachments')}
      action={
        <Button
          size='sm'
          variant='outline'
          onClick={() => setIsUploading(true)}
        >
          <Upload /> {t('files.upload')}
        </Button>
      }
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('engagements.attachmentsHint')}
      </p>
      {invoices.length > 0 && (
        <ul className='mb-3 grid gap-2 sm:grid-cols-2'>
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                to='/invoices/$id'
                params={{ id: invoice.id }}
                className='flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50'
              >
                <Receipt className='size-5 shrink-0 text-primary' />
                <span className='num min-w-0 flex-1 truncate'>
                  {invoice.number}
                </span>
                <Money amount={invoice.amount} currency={invoice.currency} />
                <InvoiceStatusBadge
                  status={invoiceStatus(db, invoice, todayIso())}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {files.length === 0 && invoices.length === 0 ? (
        <EmptyState>{t('engagements.noAttachments')}</EmptyState>
      ) : (
        files.length > 0 && <AttachmentList files={files} />
      )}
      {isUploading && (
        <UploadDialog
          owner={{ engagementId }}
          kinds={ENGAGEMENT_FILE_KINDS}
          onClose={() => setIsUploading(false)}
        />
      )}
    </Panel>
  )
}
