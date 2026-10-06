import { Link } from '@tanstack/react-router'
import { Panel } from '@/shared/components/panel'
import { ArrowUpLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { subscriptionState } from '@/features/engagements/model/cycles'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import type { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { SubStateBadge } from '@/features/engagements/ui/badges'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { useMoneyText } from '@/features/rates/ui/money'
import { OverdueAlert } from './overdue-alert'

type Billable = { e: Engagement; meter: ReturnType<typeof engagementMeter> }
type Decision = { e: Engagement } & ReturnType<typeof subscriptionState>

type Props = {
  billable: Billable[]
  decisions: Decision[]
  overdue: Invoice[]
}

/** What needs the owner now: work to bill, renewals to decide, late invoices. */
export function AlertsPanel({ billable, decisions, overdue }: Props) {
  const { t } = useTranslation()
  const moneyText = useMoneyText()
  const hasAlerts = billable.length + decisions.length + overdue.length > 0

  return (
    <Panel title={t('today.alerts')} bodyClassName='p-0'>
      {!hasAlerts ? (
        <p className='p-4 text-sm text-muted-foreground'>
          {t('today.noAlerts')}
        </p>
      ) : (
        <ul className='divide-y'>
          {billable.map(({ e, meter }) => (
            <li
              key={e.id}
              className='grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center'
            >
              <div className='grid gap-1.5'>
                <Link
                  to='/engagements/$id'
                  params={{ id: e.id }}
                  className='font-medium hover:underline'
                >
                  {e.title}
                </Link>
                <AllowanceMeter meter={meter} size='sm' />
              </div>
              <Button
                asChild
                size='sm'
                className='bg-billable text-[#241a00] hover:bg-billable/90'
              >
                <Link to='/engagements/$id' params={{ id: e.id }}>
                  {moneyText(meter.unbilled * e.overageUnitPrice, e.currency)}
                  <ArrowUpLeft className='ltr:-scale-x-100' />
                </Link>
              </Button>
            </li>
          ))}
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
