import { useState } from 'react'
import { ChoiceRow } from '@/shared/components/choice-row'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUploadFile } from '../api/use-files'
import type { AttachmentKind } from '../model/enums'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  type UploadFields,
} from '../model/upload.input'

type Props = {
  /** Who the file belongs to (client, engagement or payment). */
  owner: Pick<UploadFields, 'clientId' | 'engagementId' | 'paymentId'>
  kinds: readonly Exclude<AttachmentKind, 'logo'>[]
  onClose: () => void
}

/** Pick a file, say what it is, add a note, upload. */
export function UploadDialog({ owner, kinds, onClose }: Props) {
  const { t } = useTranslation()
  const upload = useUploadFile()
  const [file, setFile] = useState<File>()
  const [kind, setKind] = useState(kinds[0])
  const [note, setNote] = useState('')
  const isTooLarge = (file?.size ?? 0) > MAX_UPLOAD_BYTES

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || isTooLarge || upload.isPending) return
    upload.mutate(
      { fields: { ...owner, kind, note }, file },
      {
        onSuccess: () => {
          toast.success(t('files.uploaded'))
          onClose()
        },
      }
    )
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !upload.isPending && onClose()}
    >
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('files.upload')}</DialogTitle>
          </DialogHeader>
          <label className='flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 text-sm focus-within:ring-2 focus-within:ring-ring hover:bg-accent/40'>
            <Upload className='size-5 shrink-0 text-muted-foreground' />
            <span className='min-w-0 flex-1 truncate'>
              {file?.name ?? t('files.choose')}
            </span>
            <input
              type='file'
              accept={UPLOAD_ACCEPT}
              className='sr-only'
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
          {isTooLarge && (
            <p className='text-xs text-destructive'>{t('files.tooLarge')}</p>
          )}
          {kinds.length > 1 && (
            <ChoiceRow
              label={t('files.kindLabel')}
              options={kinds}
              value={kind}
              onChange={setKind}
              labelOf={(k) => t(`files.kind.${k}`)}
            />
          )}
          <TextField
            id='upload-note'
            label={t('files.note')}
            placeholder={t('files.notePlaceholder')}
            value={note}
            onChange={setNote}
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!file || isTooLarge}
              isPending={upload.isPending}
              pendingText={t('files.uploading')}
            >
              {t('files.upload')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
