import { useState } from 'react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { useCurrentMember } from '@/app/client/use-current-member'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { daysFrom, useLang } from '@/shared/lib/dates'
import { todayIso } from '@/shared/model/dates'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { ArrowUpLeft, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  currentCycle,
  subscriptionState,
} from '@/features/engagements/model/cycles'
import { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { SubStateBadge } from '@/features/engagements/ui/badges'
import {
  invoiceBalance,
  invoiceStatus,
} from '@/features/invoices/model/invoice-status'
import { BaseMoney, useMoneyText } from '@/features/rates/ui/money'
import { NextActionsPanel } from './next-actions-panel'
import { OverdueAlert } from './overdue-alert'
import { ReflectionDialog } from './reflection-dialog'
import { TasksPanel } from './tasks-panel'
import { UpcomingPanel } from './upcoming-panel'

export function Today() {
  const { t } = useTranslation()
  const lang = useLang()
  const moneyText = useMoneyText()
  const db = useDb()
  const [reflectOpen, setReflectOpen] = useState(false)
  const now = todayIso()
  const owner = useCurrentMember()

  const active = db.engagements.filter((e) => e.status === 'active')
  const meters = active.map((e) => ({ e, meter: engagementMeter(db, e, now) }))

  const openInvoices = db.invoices.filter((i) =>
    ['unpaid', 'partial', 'overdue'].includes(invoiceStatus(db, i, now))
  )
  const receivableBase = openInvoices.reduce(
    (s, i) => s + Math.round(invoiceBalance(db, i) * i.rateToBase),
    0
  )
  const overdue = openInvoices.filter(
    (i) => invoiceStatus(db, i, now) === 'overdue'
  )

  const billable = meters.filter(
    ({ e, meter }) => e.type !== 'subscription' && meter.unbilled > 0
  )
  const billableBase = billable.reduce(
    (s, { e, meter }) =>
      s + Math.round(meter.unbilled * e.overageUnitPrice * e.rateToBase),
    0
  )

  const decisions = active
    .filter((e) => e.type === 'subscription')
    .flatMap((e) => {
      const cycle = currentCycle(db, e.id)
      if (!cycle) return []
      const s = subscriptionState(cycle, e.status, now, db.settings.dueSoonDays)
      return s.state === 'active' ? [] : [{ e, ...s }]
    })

  const myTasks = db.tasks.filter(
    (task) =>
      task.assigneeId === owner.id &&
      task.dueOn !== undefined &&
      task.dueOn <= now
  )
  const doneCount = myTasks.filter((task) => task.completedAt).length

  const upcoming = db.importantDates
    .map((dt) => ({ ...dt, days: daysFrom(now, dt.dueOn) }))
    .filter((dt) => dt.days >= 0 && dt.days <= 14)
    .sort((a, b) => a.days - b.days)

  const dateLine = format(new Date(), 'EEEE d MMMM', {
    locale: lang === 'ar' ? arLocale : enUS,
  })
  const hasAlerts = billable.length + decisions.length + overdue.length > 0

  return (
    <PageShell
      eyebrow={dateLine}
      title={t('today.greeting', { name: owner.name })}
      subtitle={t('today.subtitle')}
      actions={
        <Button variant='outline' onClick={() => setReflectOpen(true)}>
          <Moon /> {t('today.wrapUp')}
        </Button>
      }
    >
      <div className='grid gap-3 sm:grid-cols-3'>
        <StatTile
          tone='billable'
          label={t('today.billable')}
          value={<BaseMoney base={billableBase} />}
          hint={t('today.billableHint')}
        />
        <StatTile
          tone={overdue.length > 0 ? 'overdue' : 'default'}
          label={t('today.unpaid')}
          value={<BaseMoney base={receivableBase} />}
          hint={t('today.unpaidCount', { count: openInvoices.length })}
        />
        <StatTile
          label={t('today.renewals')}
          value={<span className='num'>{decisions.length}</span>}
          hint={decisions.map((d) => d.e.title).join(' · ')}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
        <div className='grid content-start gap-4'>
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
                        {moneyText(
                          meter.unbilled * e.overageUnitPrice,
                          e.currency
                        )}
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

          <NextActionsPanel meters={meters} />
        </div>

        <div className='grid content-start gap-4'>
          <TasksPanel doneCount={doneCount} tasks={myTasks} />
          <UpcomingPanel upcoming={upcoming} />
        </div>
      </div>

      <ReflectionDialog open={reflectOpen} onOpenChange={setReflectOpen} />
    </PageShell>
  )
}
