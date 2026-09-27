import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useDateFormat } from '@/shared/lib/dates'
import { ExternalLink, FileText, ImageIcon, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { fileUrl, useDeleteFile } from '../api/use-files'
import type { Attachment } from '../model/attachment.schema'

/** Files with open and delete; a name-only (demo) row just shows its name. */
export function AttachmentList({ files }: { files: Attachment[] }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const remove = useDeleteFile()
  const [deleting, setDeleting] = useState<Attachment>()

  return (
    <>
      <ul className='grid gap-2 sm:grid-cols-2'>
        {files.map((file) => (
          <li
            key={file.id}
            className='flex items-center gap-3 rounded-lg border p-3 text-sm'
          >
            {file.mimeType?.startsWith('image/') ||
            file.kind === 'agreement_chat' ? (
              <ImageIcon className='size-5 shrink-0 text-chart-3' />
            ) : (
              <FileText className='size-5 shrink-0 text-primary' />
            )}
            <div className='grid min-w-0 flex-1 gap-0.5'>
              <span className='truncate'>{file.fileName}</span>
              <span className='truncate text-xs text-muted-foreground'>
                {t(`files.kind.${file.kind}`)} · {fmt(file.uploadedOn)}
                {!file.hasFile && ` · ${t('files.nameOnly')}`}
              </span>
              {file.note && (
                <span className='truncate text-xs text-muted-foreground'>
                  {file.note}
                </span>
              )}
            </div>
            {file.hasFile && (
              <Button asChild size='icon' variant='ghost' className='size-8'>
                <a
                  href={fileUrl(file.id)}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t('files.open')}
                >
                  <ExternalLink />
                </a>
              </Button>
            )}
            <Button
              size='icon'
              variant='ghost'
              className='size-8 text-destructive'
              aria-label={t('common.delete')}
              onClick={() => setDeleting(file)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={deleting !== undefined}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        destructive
        title={t('common.deleteTitle', { name: deleting?.fileName })}
        desc={t('files.deleteHint')}
        confirmText={t('common.delete')}
        isLoading={remove.isPending}
        handleConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(undefined)
              toast.success(t('common.deletedDone'))
            },
          })
        }
      />
    </>
  )
}
