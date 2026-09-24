import { currentCycle, subscriptionState } from '@/features/engagements/model/cycles'
import { engagementMeter } from '@/features/engagements/model/meter'
import { invoiceBalance, invoiceStatus } from '@/features/invoices/model/invoice-status'
import type { Task } from '@/features/today/model/today.schema'
import { useCurrentMember } from '@/app/client/use-current-member'
import { useAddTask, useToggleTask } from './api/use-today-actions'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { ArrowUpLeft, Moon, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { daysFrom, useDateFormat, useLang } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { SubStateBadge, TypeBadge } from '@/components/fos/badges'
import { BaseMoney, useMoneyText } from '@/components/fos/money'
import { PageShell, Panel, StatTile } from '@/components/fos/page'
import { ReflectionDialog } from './reflection-dialog'

export function Today() {
  const { t } = useTranslation()
  const lang = useLang()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const db = useDb()
  const [reflectOpen, setReflectOpen] = useState(false)
  const now = todayIso()
  const owner = useCurrentMember()
  const clientOf = (id: string) => db.clients.find((c) => c.id === id)!

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
                {overdue.map((inv) => {
                  const client = clientOf(inv.clientId)
                  const balance = invoiceBalance(db, inv)
                  const text = t('invoice.whatsappMessage', {
                    name: client.name,
                    number: inv.number,
                    amount: moneyText(balance, inv.currency),
                    due: fmt(inv.dueOn),
                  })
                  return (
                    <li
                      key={inv.id}
                      className='flex flex-wrap items-center justify-between gap-3 p-4'
                    >
                      <div className='grid gap-0.5'>
                        <Link
                          to='/invoices/$id'
                          params={{ id: inv.id }}
                          className='font-medium hover:underline'
                        >
                          <span className='num'>{inv.number}</span> ·{' '}
                          {client.company ?? client.name}
                        </Link>
                        <span className='text-xs text-overdue'>
                          {t('invoiceStatus.overdue')} ·{' '}
                          {t('common.daysAgo', {
                            count: -daysFrom(now, inv.dueOn),
                          })}{' '}
                          · {moneyText(balance, inv.currency)}
                        </span>
                      </div>
                      <Button asChild size='sm' variant='outline'>
                        <a
                          href={waLink(client.whatsapp, text)}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {t('common.whatsapp')}
                        </a>
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel title={t('today.nextActions')} bodyClassName='p-0'>
            <ul className='divide-y'>
              {meters.map(({ e, meter }) => (
                <li key={e.id}>
                  <Link
                    to='/engagements/$id'
                    params={{ id: e.id }}
                    className='grid gap-2 p-4 transition-colors hover:bg-accent/40 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center sm:gap-6'
                  >
                    <div className='grid gap-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className='size-2 rounded-full'
                          style={{
                            backgroundColor: clientOf(e.clientId).color,
                          }}
                        />
                        <span className='text-sm font-medium'>{e.title}</span>
                        <TypeBadge type={e.type} />
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {e.nextAction}
                      </p>
                    </div>
                    <AllowanceMeter meter={meter} size='sm' />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className='grid content-start gap-4'>
          <TasksPanel doneCount={doneCount} tasks={myTasks} />
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
                      dt.days <= 3
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
        </div>
      </div>

      <ReflectionDialog open={reflectOpen} onOpenChange={setReflectOpen} />
    </PageShell>
  )
}

function TasksPanel({
  doneCount,
  tasks,
}: {
  doneCount: number
  tasks: Task[]
}) {
  const { t } = useTranslation()
  const toggleTask = useToggleTask()
  const addTask = useAddTask()
  const [draft, setDraft] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || addTask.isPending) return
    addTask.mutate(
      { title },
      {
        onSuccess: () => {
          setDraft('')
          toast.success(title)
        },
      }
    )
  }

  return (
    <Panel
      title={t('today.tasks')}
      action={
        <span className='text-xs text-muted-foreground'>
          {t('today.tasksDone', { done: doneCount, total: tasks.length })}
        </span>
      }
      bodyClassName='grid gap-1 p-2'
    >
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.label
            key={task.id}
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-accent/40'
          >
            <Checkbox
              checked={!!task.completedAt}
              onCheckedChange={() => toggleTask.mutate(task.id)}
              className='mt-0.5'
            />
            <span
              className={cn(
                'text-sm transition-colors',
                task.completedAt && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </span>
          </motion.label>
        ))}
      </AnimatePresence>
      <form onSubmit={submit} className='flex items-center gap-2 px-2 pt-1'>
        <Plus className='size-4 text-muted-foreground' />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('today.addTask')}
          className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
        />
      </form>
    </Panel>
  )
}
