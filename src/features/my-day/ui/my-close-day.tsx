import { useState } from 'react'
import { Panel } from '@/shared/components/panel'
import { PendingButton } from '@/shared/components/pending-button'
import { Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { useCloseMyDay } from '../api/use-my-day-actions'
import type { Workspace } from '../model/workspace.schema'

type Props = { workspace: Workspace }

/** End of day: a note for the owner and tomorrow; open tasks move on. */
export function MyCloseDay({ workspace }: Props) {
  const { t } = useTranslation()
  const closeDay = useCloseMyDay()
  const [note, setNote] = useState(workspace.reflection)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (closeDay.isPending) return
    closeDay.mutate(
      { note: note.trim() },
      {
        onSuccess: ({ moved }) =>
          toast.success(t('myDay.closed', { count: moved })),
      }
    )
  }

  return (
    <Panel title={t('reflection.title')}>
      <form onSubmit={submit} className='grid gap-3'>
        <Textarea
          rows={3}
          value={note}
          aria-label={t('reflection.notes')}
          placeholder={t('reflection.notesPlaceholder')}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className='text-xs text-muted-foreground'>{t('myDay.closeHint')}</p>
        <PendingButton
          type='submit'
          variant='outline'
          isPending={closeDay.isPending}
        >
          <Moon /> {t('reflection.complete')}
        </PendingButton>
      </form>
    </Panel>
  )
}
