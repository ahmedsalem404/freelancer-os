import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AttachmentList, UploadDialog } from '@/features/files'

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
  const files = useDb().attachments.filter(
    (a) => a.engagementId === engagementId
  )
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
      {files.length === 0 ? (
        <EmptyState>{t('engagements.noAttachments')}</EmptyState>
      ) : (
        <AttachmentList files={files} />
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
