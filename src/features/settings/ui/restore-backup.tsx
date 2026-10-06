import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRestoreBackup } from '../api/use-restore-backup'

/** Pick a backup zip, confirm, and the whole system goes back to it. */
export function RestoreBackup() {
  const { t } = useTranslation()
  const restore = useRestoreBackup()
  const navigate = useNavigate()
  const [file, setFile] = useState<File>()
  const close = () => setFile(undefined)

  return (
    <div className='grid gap-2 border-t pt-3'>
      <p className='text-xs text-muted-foreground'>
        {t('settings.restoreHint')}
      </p>
      <label className='flex cursor-pointer items-center gap-2 justify-self-start rounded-md border px-3 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-ring hover:bg-accent/40'>
        <History className='size-4' />
        {t('settings.restore')}
        <input
          type='file'
          accept='.zip,application/zip'
          className='sr-only'
          onChange={(e) => {
            setFile(e.target.files?.[0])
            // The same file can be picked again after a cancel.
            e.target.value = ''
          }}
        />
      </label>
      <ConfirmDialog
        open={file !== undefined}
        onOpenChange={(open) => !open && !restore.isPending && close()}
        destructive
        title={t('settings.restoreConfirm')}
        desc={t('settings.restoreConfirmHint', { name: file?.name ?? '' })}
        confirmText={
          restore.isPending ? t('settings.restoring') : t('settings.restore')
        }
        isLoading={restore.isPending}
        handleConfirm={() => {
          if (!file) return
          restore.mutate(file, {
            onSuccess: () => {
              toast.success(t('settings.restoreDone'))
              // The server signed everyone out.
              navigate({ to: '/sign-in', replace: true })
            },
            onSettled: close,
          })
        }}
      />
    </div>
  )
}
