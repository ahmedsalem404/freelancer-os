import { useState } from 'react'
import { today, useStore } from '@/mock/store'
import { Check, CircleDashed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function ReflectionDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const tasks = useStore((s) => s.tasks)
  const memberId = useStore((s) => s.currentMemberId)
  const carryOverTasks = useStore((s) => s.carryOverTasks)
  const saveReflection = useStore((s) => s.saveReflection)
  const [note, setNote] = useState('')
  const now = today()

  const mine = tasks.filter((task) => task.assigneeId === memberId)
  const done = mine.filter((task) => task.completedAt?.startsWith(now))
  const pending = mine.filter(
    (task) =>
      !task.completedAt && task.dueOn !== undefined && task.dueOn <= now
  )

  const complete = () => {
    saveReflection(note.trim())
    carryOverTasks()
    toast.success(t('reflection.saved'))
    setNote('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='font-display text-xl'>
            {t('reflection.title')}
          </DialogTitle>
          <DialogDescription>{t('reflection.subtitle')}</DialogDescription>
        </DialogHeader>

        <section className='grid gap-2'>
          <h3 className='text-xs font-semibold text-success'>
            {t('reflection.done')} · <span className='num'>{done.length}</span>
          </h3>
          <ul className='grid gap-1 text-sm'>
            {done.map((task) => (
              <li key={task.id} className='flex items-center gap-2'>
                <Check className='size-4 text-success' /> {task.title}
              </li>
            ))}
          </ul>
        </section>

        {pending.length > 0 && (
          <section className='grid gap-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-muted-foreground'>
                {t('reflection.open')} ·{' '}
                <span className='num'>{pending.length}</span>
              </h3>
              <span className='text-xs text-muted-foreground'>
                {t('reflection.carry')}
              </span>
            </div>
            <ul className='grid gap-1 text-sm'>
              {pending.map((task) => (
                <li
                  key={task.id}
                  className='flex items-center gap-2 text-muted-foreground'
                >
                  <CircleDashed className='size-4' /> {task.title}
                </li>
              ))}
            </ul>
          </section>
        )}

        <label className='grid gap-2'>
          <span className='text-xs font-semibold'>{t('reflection.notes')}</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('reflection.notesPlaceholder')}
            rows={3}
          />
        </label>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={complete}>{t('reflection.complete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
