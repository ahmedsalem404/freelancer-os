import { Link } from '@tanstack/react-router'
import { Panel } from '@/shared/components/panel'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { subscriptionState } from '@/features/engagements/model/cycles'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { SubStateBadge } from '@/features/engagements/ui/badges'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { OverdueAlert } from './overdue-alert'

type Decision = { e: Engagement } & ReturnType<typeof subscriptionState>

type Props = {
  decisions: Decision[]
  overdue: Invoice[]
}

/** What needs the owner now: renewals to decide, late invoices. */
export function AlertsPanel({ decisions, overdue }: Props) {
  const { t } = useTranslation()
  const hasAlerts = decisions.length + overdue.length > 0

  return (
    <Panel title={t('today.alerts')} bodyClassName='p-0'>
      {!hasAlerts ? (
        <p className='p-4 text-sm text-muted-foreground'>
          {t('today.noAlerts')}
        </p>
      ) : (
        <ul className='divide-y'>
          {decisions.map(({ e, state, daysLeft }) => (
            <li
              key={e.id}
              className='flex flex-wrap items-center justify-between gap-3 p-4'
            >
              <div className='grid gap-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Link
                    to='/engagements/$id'
                    params={{ id: e.id }}
                    className='font-medium hover:underline'
                  >
                    {e.title}
                  </Link>
                  <SubStateBadge state={state} />
                </div>
                <span className='text-xs text-muted-foreground'>
                  {daysLeft >= 0
                    ? t('common.daysLeft', { count: daysLeft })
                    : t('common.daysAgo', { count: -daysLeft })}
                </span>
              </div>
              <Button asChild size='sm' variant='outline'>
                <Link to='/engagements/$id' params={{ id: e.id }}>
                  {t('engagements.tabs.cycle')}
                </Link>
              </Button>
            </li>
          ))}
          {overdue.map((inv) => (
            <OverdueAlert key={inv.id} invoice={inv} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
