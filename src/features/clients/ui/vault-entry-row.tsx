import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDeleteVaultEntry, useRevealSecret } from '../api/use-vault'
import type { VaultEntry } from '../model/clients.schema'
import type { Revealed } from './vault-panel'

type Props = {
  entry: VaultEntry
  revealed?: Revealed
  onReveal: (revealed: Revealed) => void
  onHide: () => void
  onEdit: () => void
}

/** One saved login: show / copy the secret, edit, delete. */
export function VaultEntryRow({
  entry,
  revealed,
  onReveal,
  onHide,
  onEdit,
}: Props) {
  const { t } = useTranslation()
  const reveal = useRevealSecret()
  const remove = useDeleteVaultEntry()
  const [isDeleting, setIsDeleting] = useState(false)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  return (
    <li className='grid gap-1 rounded-lg border p-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='font-medium'>{entry.label}</span>
        <div className='flex gap-1'>
          <Button
            size='sm'
            variant='ghost'
            disabled={reveal.isPending}
            aria-busy={reveal.isPending}
            onClick={() =>
              revealed
                ? onHide()
                : reveal.mutate(entry.id, {
                    onSuccess: (data) => onReveal({ id: entry.id, ...data }),
                  })
            }
          >
            {revealed ? <EyeOff /> : <Eye />}
            {revealed ? t('common.hide') : t('common.show')}
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='size-8'
            aria-label={t('clients.vaultEdit')}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='size-8 text-destructive'
            aria-label={t('common.delete')}
            onClick={() => setIsDeleting(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {entry.url && (
        <div dir='ltr' className='truncate text-xs text-muted-foreground'>
          {entry.url}
        </div>
      )}
      <div dir='ltr' className='num text-xs text-muted-foreground'>
        {entry.username}
      </div>
      <div className='flex items-center gap-2'>
        <span dir='ltr' className='num min-w-0 flex-1 truncate'>
          {revealed ? revealed.secret : '••••••••••'}
        </span>
        {revealed && (
          <Button
            size='sm'
            variant='outline'
            onClick={() => void copy(revealed.secret)}
          >
            <Copy /> {t('common.copy')}
          </Button>
        )}
      </div>
      {revealed?.notes && (
        <p className='rounded-md bg-muted/60 p-2 text-xs whitespace-pre-wrap'>
          {revealed.notes}
        </p>
      )}
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        destructive
        title={t('common.deleteTitle', { name: entry.label })}
        desc={t('clients.vaultDeleteHint')}
        confirmText={t('common.delete')}
        isLoading={remove.isPending}
        handleConfirm={() =>
          remove.mutate(entry.id, {
            onSuccess: () => {
              setIsDeleting(false)
              toast.success(t('common.deletedDone'))
            },
          })
        }
      />
    </li>
  )
}
