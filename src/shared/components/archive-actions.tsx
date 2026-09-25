import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Archive, ArchiveRestore, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  /** Shown in the delete confirmation. */
  name: string
  isArchived: boolean
  isPending: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

/**
 * "More" menu of a client or engagement page: archive / restore, and a
 * permanent delete behind a confirmation (the server refuses it for any
 * record with history, so it only ever removes mistakes).
 */
export function ArchiveActions({
  name,
  isArchived,
  isPending,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label={t('common.more')}
            disabled={isPending}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {isArchived ? (
            <DropdownMenuItem onSelect={onUnarchive}>
              <ArchiveRestore /> {t('common.unarchive')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={onArchive}>
              <Archive /> {t('common.archive')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onSelect={() => setIsConfirming(true)}
          >
            <Trash2 /> {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        destructive
        title={t('common.deleteTitle', { name })}
        desc={t('common.deleteHint')}
        confirmText={t('common.delete')}
        cancelBtnText={t('common.cancel')}
        isLoading={isPending}
        handleConfirm={() => {
          setIsConfirming(false)
          onDelete()
        }}
      />
    </>
  )
}
