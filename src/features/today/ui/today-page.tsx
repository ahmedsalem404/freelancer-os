import { useState } from 'react'
import { format } from 'date-fns'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { useCurrentMember } from '@/app/client/use-current-member'
import { StatTile } from '@/shared/components/stat-tile'
import { daysFrom, useLang } from '@/shared/lib/dates'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  currentCycle,
  subscriptionState,
} from '@/features/engagements/model/cycles'
import { engagementMeter } from '@/features/engagements/model/meter'
import {
  invoiceBalance,
  invoiceStatus,
} from '@/features/invoices/model/invoice-status'
import { BaseMoney } from '@/features/rates/ui/money'
import { RemindersCenter } from '@/features/reminders'
import { AlertsPanel } from './alerts-panel'
import { NextActionsPanel } from './next-actions-panel'
import { ReflectionDialog } from './reflection-dialog'
import { TasksPanel } from './tasks-panel'
import { TeamTasksPanel } from './team-tasks-panel'
import { UpcomingPanel } from './upcoming-panel'

export function Today() {
  const { t } = useTranslation()
  const lang = useLang()
  const db = useDb()
  const [reflectOpen, setReflectOpen] = useState(false)
  const now = todayIso()
  const owner = useCurrentMember()

  const active = db.engagements.filter(
    (e) => e.status === 'active' && !isArchived(e)
  )
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
          <AlertsPanel
            billable={billable}
            decisions={decisions}
            overdue={overdue}
          />

          <NextActionsPanel meters={meters} />
        </div>

        <div className='grid content-start gap-4'>
          <RemindersCenter />
          <TasksPanel doneCount={doneCount} tasks={myTasks} />
          <TeamTasksPanel />
          <UpcomingPanel upcoming={upcoming} />
        </div>
      </div>

      <ReflectionDialog open={reflectOpen} onOpenChange={setReflectOpen} />
    </PageShell>
  )
}
