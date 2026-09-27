import { useState } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { useLang } from '@/shared/lib/dates'
import { todayIso } from '@/shared/model/dates'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { calendarItems } from '../model/calendar-items'
import type { CalendarEvent, ImportantDate } from '../model/calendar.schema'
import { DateDialog } from './date-dialog'
import { DayPanel } from './day-panel'
import { EventDialog } from './event-dialog'
import { MonthGrid } from './month-grid'

type Editing =
  | { kind: 'event'; event?: CalendarEvent }
  | { kind: 'date'; date?: ImportantDate }

export function CalendarPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const locale = lang === 'ar' ? arLocale : enUS
  const items = calendarItems(useDb(), todayIso())
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayIso())
  const [editing, setEditing] = useState<Editing>()
  const itemsOn = (iso: string) => items.filter((item) => item.date === iso)
  const close = () => setEditing(undefined)

  return (
    <PageShell
      title={t('calendar.title')}
      subtitle={t('calendar.subtitle')}
      actions={
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setEditing({ kind: 'date' })}
          >
            <CalendarPlus /> {t('calendar.addDate')}
          </Button>
          <Button
            size='icon'
            variant='outline'
            aria-label={t('calendar.prev')}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronRight className='ltr:rotate-180' />
          </Button>
          <span className='min-w-32 text-center font-display font-semibold'>
            {format(month, 'MMMM yyyy', { locale })}
          </span>
          <Button
            size='icon'
            variant='outline'
            aria-label={t('calendar.next')}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronLeft className='ltr:rotate-180' />
          </Button>
        </div>
      }
    >
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <MonthGrid
          month={month}
          locale={locale}
          weekStartsOn={lang === 'ar' ? 6 : 1}
          selected={selected}
          onSelect={setSelected}
          itemsOn={itemsOn}
        />
        <DayPanel
          day={selected}
          locale={locale}
          items={itemsOn(selected)}
          onAddEvent={() => setEditing({ kind: 'event' })}
          onEditEvent={(event) => setEditing({ kind: 'event', event })}
          onEditDate={(date) => setEditing({ kind: 'date', date })}
        />
      </div>
      {editing?.kind === 'event' && (
        <EventDialog event={editing.event} day={selected} onClose={close} />
      )}
      {editing?.kind === 'date' && (
        <DateDialog date={editing.date} day={selected} onClose={close} />
      )}
    </PageShell>
  )
}
