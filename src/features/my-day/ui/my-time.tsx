import { useState } from 'react'
import { Panel } from '@/shared/components/panel'
import { TextField } from '@/shared/components/text-field'
import { useDateFormat } from '@/shared/lib/dates'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { logTimeInput } from '@/features/time/model/time.schema'
import { useLogMyTime } from '../api/use-my-day-actions'
import type { Workspace } from '../model/workspace.schema'

const GENERAL = 'general'
const MINUTES_PER_HOUR = 60
const RECENT_ROWS = 6

type Props = { workspace: Workspace }

/** Log today's work (hours) and see what was logged lately. */
export function MyTime({ workspace }: Props) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const log = useLogMyTime()
  const [form, setForm] = useState({
    engagementId: GENERAL,
    hours: '',
    note: '',
  })
  const minutes = Math.round(Number(form.hours) * MINUTES_PER_HOUR)
  const parsed = logTimeInput.safeParse({
    engagementId: form.engagementId === GENERAL ? undefined : form.engagementId,
    minutes,
    description: form.note,
    billable: form.engagementId !== GENERAL,
  })
  const titleOf = (id?: string) =>
    workspace.engagements.find((e) => e.id === id)?.title ?? t('time.general')
  const todayMinutes = workspace.timeEntries
    .filter((e) => e.workOn === workspace.today)
    .reduce((sum, e) => sum + e.minutes, 0)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success || log.isPending) return
    log.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('myDay.logged'))
        setForm((prev) => ({ ...prev, hours: '', note: '' }))
      },
    })
  }

  return (
    <Panel
      title={t('myDay.time')}
      action={
        <span className='num text-xs text-muted-foreground'>
          {t('myDay.todayHours', {
            h: Math.round((todayMinutes / MINUTES_PER_HOUR) * 10) / 10,
          })}
        </span>
      }
      bodyClassName='grid gap-4'
    >
      <form onSubmit={submit} className='grid gap-3 sm:grid-cols-2'>
        <div className='grid gap-2 sm:col-span-2'>
          <Label htmlFor='my-time-engagement'>{t('common.engagement')}</Label>
          <Select
            value={form.engagementId}
            onValueChange={(engagementId) =>
              setForm((prev) => ({ ...prev, engagementId }))
            }
          >
            <SelectTrigger id='my-time-engagement' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GENERAL}>{t('time.general')}</SelectItem>
              {workspace.engagements.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TextField
          id='my-time-hours'
          label={t('myDay.hours')}
          type='number'
          inputMode='decimal'
          min='0.25'
          step='0.25'
          dir='ltr'
          value={form.hours}
          onChange={(hours) => setForm((prev) => ({ ...prev, hours }))}
        />
        <TextField
          id='my-time-note'
          label={t('myDay.what')}
          value={form.note}
          onChange={(note) => setForm((prev) => ({ ...prev, note }))}
        />
        <Button
          type='submit'
          className='sm:col-span-2'
          disabled={!parsed.success || log.isPending}
        >
          {t('myDay.log')}
        </Button>
      </form>
      {workspace.timeEntries.length > 0 && (
        <ul className='grid gap-1 border-t pt-3 text-sm'>
          {workspace.timeEntries.slice(0, RECENT_ROWS).map((entry) => (
            <li key={entry.id} className='flex justify-between gap-3'>
              <span className='min-w-0 truncate'>
                {entry.description || titleOf(entry.engagementId)}
              </span>
              <span className='num shrink-0 text-xs text-muted-foreground'>
                {fmt(entry.workOn)} ·{' '}
                {t('time.hoursShort', {
                  h: Math.round((entry.minutes / MINUTES_PER_HOUR) * 10) / 10,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
