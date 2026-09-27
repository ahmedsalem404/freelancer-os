import { useMutation } from '@tanstack/react-query'
import { Panel } from '@/shared/components/panel'
import { PendingButton } from '@/shared/components/pending-button'
import { Download, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { downloadBackup } from '../api/download-backup'

/** One click: the whole system (data, files, vault key) as a zip. */
export function BackupPanel() {
  const { t } = useTranslation()
  const backup = useMutation({
    mutationFn: downloadBackup,
    onSuccess: () => toast.success(t('settings.backupDone')),
  })
  return (
    <Panel title={t('settings.backup')} bodyClassName='grid gap-3'>
      <p className='text-xs text-muted-foreground'>
        {t('settings.backupHint')}
      </p>
      <p className='flex items-start gap-2 rounded-lg bg-billable-soft p-3 text-xs text-billable-foreground dark:text-billable'>
        <ShieldAlert className='mt-0.5 size-4 shrink-0' />
        {t('settings.backupPrivate')}
      </p>
      <PendingButton
        variant='outline'
        className='justify-self-start'
        isPending={backup.isPending}
        pendingText={t('settings.backupPreparing')}
        onClick={() => backup.mutate()}
      >
        <Download /> {t('settings.export')}
      </PendingButton>
    </Panel>
  )
}
