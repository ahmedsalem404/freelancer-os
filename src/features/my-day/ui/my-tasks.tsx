import { useState } from 'react'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAddMyTask, useToggleMyTask } from '../api/use-my-day-actions'
import type { Workspace } from '../model/workspace.schema'

type Props = { workspace: Workspace }

/** Open tasks up to today first, then the ones finished today. */
function splitTasks({ tasks, today }: Workspace) {
  const open = tasks.filter(
    (task) => !task.completedAt && (task.dueOn ?? today) <= today
  )
  const later = tasks.filter(
    (task) => !task.completedAt && (task.dueOn ?? today) > today
  )
  const doneToday = tasks.filter((task) => task.completedAt?.startsWith(today))
  return { open, later, doneToday }
}

export function MyTasks({ workspace }: Props) {
  const { t } = useTranslation()
  const toggle = useToggleMyTask()
  const add = useAddMyTask()
  const [draft, setDraft] = useState('')
  const { open, later, doneToday } = splitTasks(workspace)
  const titleOf = (id?: string) =>
    workspace.engagements.find((e) => e.id === id)?.title

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || add.isPending) return
    add.mutate({ title }, { onSuccess: () => setDraft('') })
  }

  const row = (task: Workspace['tasks'][number]) => {
    const isFlipping = toggle.isPending && toggle.variables === task.id
    return (
      <label
        key={task.id}
        className='flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-accent/40'
      >
        <Checkbox
          // Flip at once while saving; the refetch confirms it.
          checked={isFlipping ? !task.completedAt : !!task.completedAt}
          disabled={isFlipping}
          onCheckedChange={() => toggle.mutate(task.id)}
          className='mt-0.5'
        />
        <span className='grid gap-0.5'>
          <span
            className={cn(
              'text-sm',
              task.completedAt && 'text-muted-foreground line-through'
            )}
          >
            {task.title}
          </span>
          {task.engagementId && (
            <span className='text-xs text-muted-foreground'>
              {titleOf(task.engagementId)}
            </span>
          )}
        </span>
      </label>
    )
  }

  return (
    <Panel
      title={t('myDay.tasks')}
      action={
        <span className='num text-xs text-muted-foreground'>
          {t('today.tasksDone', {
            done: doneToday.length,
            total: open.length + doneToday.length,
          })}
        </span>
      }
      bodyClassName='grid gap-1 p-2'
    >
      {open.length + doneToday.length === 0 && (
        <p className='px-2 py-3 text-sm text-muted-foreground'>
          {t('myDay.noTasks')}
        </p>
      )}
      {open.map(row)}
      {doneToday.map(row)}
      {later.length > 0 && (
        <p className='px-2 pt-2 text-xs text-muted-foreground'>
          {t('myDay.later', { count: later.length })}
        </p>
      )}
      <form onSubmit={submit} className='flex items-center gap-2 px-2 pt-1'>
        <Plus className='size-4 text-muted-foreground' />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('today.addTask')}
          aria-label={t('today.addTask')}
          className='h-8 border-none shadow-none focus-visible:ring-0'
        />
      </form>
    </Panel>
  )
}
