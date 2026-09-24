import { EmptyState } from '@/shared/components/empty-state'
import { PageShell } from '@/app/client/layout/page-shell'
import { Panel } from '@/shared/components/panel'
import { currentCycle } from '@/features/engagements/model/cycles'
import { isOpenInvoice } from '@/features/invoices/model/invoice-status'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Link } from '@tanstack/react-router'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/components/ui/button'

type Kind =
  'deliverable' | 'renewal' | 'invoice' | 'domain' | 'ssl' | 'license' | 'other'

type CalendarEvent = {
  id: string
  date: string
  kind: Kind
  title: string
  engagementId?: string
  invoiceId?: string
}

const KIND_STYLE: Record<Kind, string> = {
  deliverable: 'bg-primary/15 text-primary',
  renewal: 'bg-billable-soft text-billable-foreground dark:text-billable',
  invoice: 'bg-overdue-soft text-overdue',
  domain: 'bg-chart-3/15 text-chart-3',
  ssl: 'bg-chart-3/15 text-chart-3',
  license: 'bg-muted text-muted-foreground',
  other: 'bg-muted text-muted-foreground',
}

/** The calendar is a derived view — no events table of its own. */
function useEvents(): CalendarEvent[] {
  const db = useDb()
  const now = todayIso()
  const deliverables = db.deliverables.flatMap((d) =>
    d.dueOn
      ? [
          {
            id: d.id,
            date: d.dueOn,
            kind: 'deliverable' as const,
            title: d.title,
            engagementId: d.engagementId,
          },
        ]
      : []
  )
  const renewals = db.engagements.flatMap((e) => {
    const cycle = e.type === 'subscription' ? currentCycle(db, e.id) : undefined
    return cycle
      ? [
          {
            id: cycle.id,
            date: cycle.endsOn,
            kind: 'renewal' as const,
            title: e.title,
            engagementId: e.id,
          },
        ]
      : []
  })
  const invoices = db.invoices
    .filter((i) => isOpenInvoice(db, i, now))
    .map((i) => ({
      id: i.id,
      date: i.dueOn,
      kind: 'invoice' as const,
      title: i.number,
      invoiceId: i.id,
    }))
  const dates = db.importantDates.map((d) => ({
    id: d.id,
    date: d.dueOn,
    kind: (d.kind === 'hosting' ? 'other' : d.kind) as Kind,
    title: d.title,
  }))
  return [...deliverables, ...renewals, ...invoices, ...dates]
}

export function CalendarPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const locale = lang === 'ar' ? arLocale : enUS
  const events = useEvents()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayIso())
  const weekStartsOn = lang === 'ar' ? 6 : 1

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn }),
  })
  const byDate = (iso: string) => events.filter((e) => e.date === iso)
  const selectedEvents = byDate(selected)

  return (
    <PageShell
      title={t('calendar.title')}
      subtitle={t('calendar.subtitle')}
      actions={
        <div className='flex items-center gap-2'>
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
        <div className='overflow-hidden rounded-xl border bg-card'>
          <div className='grid grid-cols-7 border-b text-center text-xs text-muted-foreground'>
            {days.slice(0, 7).map((day) => (
              <div key={day.toISOString()} className='py-2'>
                {format(day, 'EEE', { locale })}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7'>
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd')
              const dayEvents = byDate(iso)
              return (
                <button
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    'grid min-h-20 content-start gap-1 border-e border-b p-1.5 text-start transition-colors hover:bg-accent/40 sm:min-h-24 [&:nth-child(7n)]:border-e-0',
                    !isSameMonth(day, month) &&
                      'bg-muted/30 text-muted-foreground',
                    selected === iso && 'bg-accent/60'
                  )}
                >
                  <span
                    className={cn(
                      'num grid size-6 place-items-center rounded-full text-xs',
                      iso === todayIso() && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      className={cn(
                        'hidden truncate rounded px-1 py-0.5 text-[10px] font-medium sm:block',
                        KIND_STYLE[ev.kind]
                      )}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 0 && (
                    <span className='flex gap-0.5 sm:hidden'>
                      {dayEvents.map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            'size-1.5 rounded-full',
                            KIND_STYLE[ev.kind]
                          )}
                        />
                      ))}
                    </span>
                  )}
                  {dayEvents.length > 2 && (
                    <span className='num hidden text-[10px] text-muted-foreground sm:block'>
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <Panel
          title={format(parseISO(selected), 'EEEE d MMMM', { locale })}
          className='h-fit'
        >
          {selectedEvents.length === 0 ? (
            <EmptyState>{t('calendar.nothing')}</EmptyState>
          ) : (
            <ul className='grid gap-2'>
              {selectedEvents.map((ev) => (
                <li
                  key={ev.id}
                  className='grid gap-1 rounded-lg border p-3 text-sm'
                >
                  <span
                    className={cn(
                      'w-fit rounded px-1.5 py-0.5 text-[11px] font-medium',
                      KIND_STYLE[ev.kind]
                    )}
                  >
                    {t(`calendar.kinds.${ev.kind}`)}
                  </span>
                  {ev.engagementId ? (
                    <Link
                      to='/engagements/$id'
                      params={{ id: ev.engagementId }}
                      className='hover:underline'
                    >
                      {ev.title}
                    </Link>
                  ) : ev.invoiceId ? (
                    <Link
                      to='/invoices/$id'
                      params={{ id: ev.invoiceId }}
                      className='num hover:underline'
                    >
                      {ev.title}
                    </Link>
                  ) : (
                    <span>{ev.title}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageShell>
  )
}
