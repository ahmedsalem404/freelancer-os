import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  type Locale,
  startOfWeek,
} from 'date-fns'
import { cn } from '@/shared/lib/utils'
import { todayIso } from '@/shared/model/dates'
import type { CalendarItem } from '../model/calendar-items'
import { KIND_STYLE } from './kind-style'

type Props = {
  month: Date
  locale: Locale
  weekStartsOn: 0 | 1 | 6
  selected: string
  onSelect: (iso: string) => void
  itemsOn: (iso: string) => CalendarItem[]
}

/** A month of days; each shows its first entries (dots on phones). */
export function MonthGrid({
  month,
  locale,
  weekStartsOn,
  selected,
  onSelect,
  itemsOn,
}: Props) {
  const today = todayIso()
  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn }),
  })
  return (
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
          const items = itemsOn(iso)
          return (
            <button
              key={iso}
              type='button'
              aria-pressed={selected === iso}
              onClick={() => onSelect(iso)}
              className={cn(
                'grid min-h-20 content-start gap-1 border-e border-b p-1.5 text-start transition-colors hover:bg-accent/40 sm:min-h-24 [&:nth-child(7n)]:border-e-0',
                !isSameMonth(day, month) && 'bg-muted/30 text-muted-foreground',
                selected === iso && 'bg-accent/60'
              )}
            >
              <span
                className={cn(
                  'num grid size-6 place-items-center rounded-full text-xs',
                  iso === today && 'bg-primary text-primary-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
              {items.slice(0, 2).map((item) => (
                <span
                  key={item.id}
                  className={cn(
                    'hidden truncate rounded px-1 py-0.5 text-[10px] font-medium sm:block',
                    KIND_STYLE[item.kind]
                  )}
                >
                  {item.title}
                </span>
              ))}
              {items.length > 0 && (
                <span className='flex flex-wrap gap-0.5 sm:hidden'>
                  {items.slice(0, 6).map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        'size-1.5 rounded-full',
                        KIND_STYLE[item.kind]
                      )}
                    />
                  ))}
                </span>
              )}
              {items.length > 2 && (
                <span className='num hidden text-[10px] text-muted-foreground sm:block'>
                  +{items.length - 2}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
