import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from 'react-i18next'

/** Days within which an upcoming date turns red. */
const URGENT_DAYS = 3

type Upcoming = { id: string; title: string; days: number }

export function UpcomingPanel({ upcoming }: { upcoming: Upcoming[] }) {
  const { t } = useTranslation()
  return (
    <Panel title={t('today.upcoming')} bodyClassName='p-0'>
      <ul className='divide-y'>
        {upcoming.map((dt) => (
          <li
            key={dt.id}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
          >
            <span>{dt.title}</span>
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                dt.days <= URGENT_DAYS
                  ? 'font-medium text-overdue'
                  : 'text-muted-foreground'
              )}
            >
              {t('common.daysLeft', { count: dt.days })}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
