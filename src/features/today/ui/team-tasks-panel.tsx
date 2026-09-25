import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { useCurrentMember } from '@/app/client/use-current-member'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
import { Check, CircleDashed, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddTask } from '../api/use-today-actions'

const NO_ENGAGEMENT = 'none'

/**
 * The owner hands tasks to assistants and watches today's progress. The
 * assistant sees them on "My day" (and only the engagement's title).
 */
export function TeamTasksPanel() {
  const { t } = useTranslation()
  const db = useDb()
  const me = useCurrentMember()
  const addTask = useAddTask()
  const now = todayIso()
  const team = db.team.filter((m) => m.id !== me.id)
  const [form, setForm] = useState({
    title: '',
    assigneeId: team[0]?.id ?? '',
    engagementId: NO_ENGAGEMENT,
  })
  if (team.length === 0) return null

  const nameOf = (id: string) => team.find((m) => m.id === id)?.name
  const tasks = db.tasks.filter(
    (task) =>
      task.assigneeId !== me.id &&
      (task.completedAt?.startsWith(now) ||
        (!task.completedAt && (task.dueOn ?? now) <= now))
  )
  const engagements = db.engagements.filter(
    (e) => e.status === 'active' && !isArchived(e)
  )

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const title = form.title.trim()
    if (!title || !form.assigneeId || addTask.isPending) return
    addTask.mutate(
      {
        title,
        assigneeId: form.assigneeId,
        engagementId:
          form.engagementId === NO_ENGAGEMENT ? undefined : form.engagementId,
      },
      {
        onSuccess: () => {
          toast.success(
            t('today.team.assigned', { name: nameOf(form.assigneeId) })
          )
          setForm((prev) => ({ ...prev, title: '' }))
        },
      }
    )
  }

  return (
    <Panel title={t('today.team.title')} bodyClassName='grid gap-3'>
      {tasks.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('today.team.empty')}</p>
      ) : (
        <ul className='grid gap-1.5 text-sm'>
          {tasks.map((task) => (
            <li key={task.id} className='flex items-start gap-2'>
              {task.completedAt ? (
                <Check className='mt-0.5 size-4 shrink-0 text-success' />
              ) : (
                <CircleDashed className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
              )}
              <span
                className={cn(
                  'min-w-0 flex-1',
                  task.completedAt && 'text-muted-foreground line-through'
                )}
              >
                {task.title}
              </span>
              <span className='shrink-0 text-xs text-muted-foreground'>
                {nameOf(task.assigneeId)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className='grid gap-2 border-t pt-3'>
        <Input
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder={t('today.team.placeholder')}
          aria-label={t('today.team.placeholder')}
        />
        <div className='grid grid-cols-[1fr_1fr_auto] gap-2'>
          <Select
            value={form.assigneeId}
            onValueChange={(assigneeId) =>
              setForm((prev) => ({ ...prev, assigneeId }))
            }
          >
            <SelectTrigger aria-label={t('today.team.to')} className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {team.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.engagementId}
            onValueChange={(engagementId) =>
              setForm((prev) => ({ ...prev, engagementId }))
            }
          >
            <SelectTrigger
              aria-label={t('common.engagement')}
              className='w-full'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ENGAGEMENT}>
                {t('today.team.noEngagement')}
              </SelectItem>
              {engagements.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='submit'
            size='icon'
            aria-label={t('today.team.assign')}
            disabled={!form.title.trim() || addTask.isPending}
          >
            <Send className='rtl:-scale-x-100' />
          </Button>
        </div>
      </form>
    </Panel>
  )
}
