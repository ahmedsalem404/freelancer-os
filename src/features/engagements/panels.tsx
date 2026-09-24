import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  CalendarClock,
  Pause,
  Receipt,
  TimerReset,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/dates'
import { toMinor } from '@/domain/money'
import {
  currentCycle,
  engagementMeter,
  subscriptionState,
} from '@/domain/selectors'
import type { Engagement } from '@/domain/types'
import { dayOffset, today, useStore } from '@/mock/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { SubStateBadge } from '@/components/fos/badges'
import { useMoneyText } from '@/components/fos/money'
import { Panel } from '@/components/fos/page'

type InvoiceRef = { id: string; number: string } | undefined

function useInvoiceToast() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (invoice: InvoiceRef, key = 'guard.invoiceCreated') => {
    if (!invoice) return
    toast.success(t(key, { number: invoice.number }), {
      action: {
        label: t('common.open'),
        onClick: () =>
          navigate({ to: '/invoices/$id', params: { id: invoice.id } }),
      },
    })
  }
}

/** Retainer: log hours with the guard inline, bill the overage. */
export function RetainerPanel({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const moneyText = useMoneyText()
  const db = useStore()
  const logTime = useStore((s) => s.logTime)
  const billRetainerOverage = useStore((s) => s.billRetainerOverage)
  const invoiceToast = useInvoiceToast()
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  const meter = engagementMeter(db, engagement, today())
  const added = Number(hours) || 0
  const projected = Math.round((meter.used + added) * 10) / 10
  const willExceed = projected > meter.included

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (added <= 0 || !description.trim()) return
    logTime({
      engagementId: engagement.id,
      minutes: Math.round(added * 60),
      description: description.trim(),
      billable: true,
    })
    toast.success(t('engagements.hoursLogged', { hours: added }))
    setHours('')
    setDescription('')
  }

  return (
    <Panel title={t('engagements.tabs.usage')} bodyClassName='grid gap-4'>
      <AllowanceMeter meter={meter} />

      {meter.unbilled > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg bg-billable-soft p-3 text-sm ring-1 ring-billable/50'>
          <span className='text-billable-foreground dark:text-billable'>
            {t('guard.retainerOver', {
              used: meter.used,
              included: meter.included,
              over: meter.unbilled,
            })}
          </span>
          <Button
            size='sm'
            className='bg-billable text-[#241a00] hover:bg-billable/90'
            onClick={() => invoiceToast(billRetainerOverage(engagement.id))}
          >
            <Receipt />
            {t('guard.billHours', {
              amount: moneyText(
                meter.unbilled * engagement.overageUnitPrice,
                engagement.currency
              ),
            })}
          </Button>
        </div>
      )}

      <form onSubmit={submit} className='grid gap-2 rounded-lg border p-3'>
        <div className='grid gap-2 sm:grid-cols-[1fr_110px_auto]'>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('engagements.hoursPlaceholder')}
          />
          <Input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode='decimal'
            dir='ltr'
            placeholder='0.0'
            className='num w-full'
            aria-label={t('units.hours')}
          />
          <Button type='submit' disabled={added <= 0 || !description.trim()}>
            {t('engagements.logHours')}
          </Button>
        </div>
        {added > 0 && (
          <p
            className={cn(
              'flex items-center gap-2 text-xs',
              willExceed
                ? 'text-billable-foreground dark:text-billable'
                : 'text-muted-foreground'
            )}
          >
            {willExceed && <AlertTriangle className='size-3.5' />}
            <span className='num'>
              {projected}/{meter.included}
            </span>
            {willExceed
              ? t('meter.overage', {
                  count: Math.round((projected - meter.included) * 10) / 10,
                })
              : t('meter.ok')}
          </p>
        )}
      </form>
    </Panel>
  )
}

/** Subscription: the cycle and the grace / renew / stop decision. */
export function CyclePanel({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const db = useStore()
  const renew = useStore((s) => s.renewSubscription)
  const extendGrace = useStore((s) => s.extendGrace)
  const stop = useStore((s) => s.stopSubscription)
  const invoiceToast = useInvoiceToast()

  const cycle = currentCycle(db, engagement.id)
  if (!cycle) return null
  const { state, daysLeft } = subscriptionState(
    cycle,
    engagement.status,
    today(),
    db.settings.dueSoonDays
  )
  const meter = engagementMeter(db, engagement, today())
  const needsDecision = state !== 'active'

  return (
    <Panel
      title={t('engagements.tabs.cycle')}
      action={<SubStateBadge state={state} />}
      bodyClassName='grid gap-4'
    >
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <div className='flex items-center gap-2 text-sm'>
          <CalendarClock className='size-4 text-muted-foreground' />
          {t('engagements.renewsOn', { date: fmt(cycle.endsOn, 'd MMMM') })}
        </div>
        <span className='text-sm text-muted-foreground'>
          {daysLeft >= 0
            ? t('common.daysLeft', { count: daysLeft })
            : t('common.daysAgo', { count: -daysLeft })}{' '}
          ·{' '}
          {t('engagements.graceDays', {
            count: cycle.graceDays + cycle.graceExtendedDays,
          })}
        </span>
      </div>
      <AllowanceMeter meter={meter} />

      {engagement.status === 'active' && (
        <div
          className={cn(
            'grid gap-2 rounded-lg p-3 sm:grid-cols-3',
            needsDecision
              ? 'bg-billable-soft/70 ring-1 ring-billable/40'
              : 'bg-muted/60'
          )}
        >
          <Button
            onClick={() =>
              invoiceToast(renew(engagement.id), 'engagements.renewed')
            }
          >
            <Receipt /> {t('engagements.renew')}
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              extendGrace(engagement.id, 5)
              toast.success(t('engagements.graceExtended'))
            }}
          >
            <TimerReset /> {t('engagements.extendGrace')}
          </Button>
          <Button
            variant='outline'
            className='text-overdue hover:text-overdue'
            onClick={() => {
              stop(engagement.id)
              toast(t('engagements.paused'))
            }}
          >
            <Pause /> {t('engagements.pause')}
          </Button>
          <p className='text-xs text-muted-foreground sm:col-span-3'>
            {moneyText(engagement.amount, engagement.currency)} ·{' '}
            {t('engagements.pauseHint')}
          </p>
        </div>
      )}
    </Panel>
  )
}

/** Change scope: raise value + add deliverable + issue invoice, in one step. */
export function ChangeScopeDialog({
  engagement,
  open,
  onOpenChange,
}: {
  engagement: Engagement
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const changeScope = useStore((s) => s.changeScope)
  const invoiceToast = useInvoiceToast()
  const [title, setTitle] = useState('')
  const [fee, setFee] = useState('500')
  const [dueOn, setDueOn] = useState(dayOffset(10))
  const isValid = title.trim().length > 0 && Number(fee) > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    invoiceToast(
      changeScope(engagement.id, {
        title: title.trim(),
        feeMinor: toMinor(Number(fee)),
        dueOn,
      })
    )
    setTitle('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('engagements.changeScope')}</DialogTitle>
            <DialogDescription>
              {t('engagements.changeScopeHint')}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor='scope-title'>{t('engagements.scopeTitle')}</Label>
            <Input
              id='scope-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='grid gap-2'>
              <Label htmlFor='scope-fee'>
                {t('engagements.scopeFee')} ({engagement.currency})
              </Label>
              <Input
                id='scope-fee'
                dir='ltr'
                inputMode='decimal'
                className='num w-full'
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='scope-due'>{t('engagements.scopeDue')}</Label>
              <Input
                id='scope-due'
                type='date'
                dir='ltr'
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={!isValid}>
              {t('guard.billScope')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
