import { useState } from 'react'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { Task } from '@/features/today/model/today.schema'
import { useAddTask, useToggleTask } from '../api/use-today-actions'

export function TasksPanel({
  doneCount,
  tasks,
}: {
  doneCount: number
  tasks: Task[]
}) {
  const { t } = useTranslation()
  const toggleTask = useToggleTask()
  const addTask = useAddTask()
  const [draft, setDraft] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || addTask.isPending) return
    addTask.mutate(
      { title },
      {
        onSuccess: () => {
          setDraft('')
          toast.success(title)
        },
      }
    )
  }

  return (
    <Panel
      title={t('today.tasks')}
      action={
        <span className='text-xs text-muted-foreground'>
          {t('today.tasksDone', { done: doneCount, total: tasks.length })}
        </span>
      }
      bodyClassName='grid gap-1 p-2'
    >
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.label
            key={task.id}
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-accent/40'
          >
            <Checkbox
              checked={!!task.completedAt}
              onCheckedChange={() => toggleTask.mutate(task.id)}
              className='mt-0.5'
            />
            <span
              className={cn(
                'text-sm transition-colors',
                task.completedAt && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </span>
          </motion.label>
        ))}
      </AnimatePresence>
      <form onSubmit={submit} className='flex items-center gap-2 px-2 pt-1'>
        <Plus className='size-4 text-muted-foreground' />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('today.addTask')}
          className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
        />
      </form>
    </Panel>
  )
}
