import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { todayIso } from '@/shared/model/dates'
import { CalendarClock, Pause, Receipt, TimerReset } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  currentCycle,
  subscriptionState,
} from '@/features/engagements/model/cycles'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { SubStateBadge } from '@/features/engagements/ui/badges'
import { useInvoiceToast } from '@/features/invoices/ui/use-invoice-toast'
import { useMoneyText } from '@/features/rates/ui/money'
import {
  useExtendGrace,
  useRenewCycle,
  useStopCycle,
} from '../api/use-engagement-actions'

/** Days added by one "grant grace" decision. */
const GRACE_STEP_DAYS = 5

/** Subscription: the cycle and the grace / renew / stop decision. */
export function CyclePanel({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const db = useDb()
  const renew = useRenewCycle()
  const extendGrace = useExtendGrace()
  const stop = useStopCycle()
  const invoiceToast = useInvoiceToast()
  const isBusy = renew.isPending || extendGrace.isPending || stop.isPending
  // Renew issues an invoice and pause stops the plan: both ask first.
  const [asking, setAsking] = useState<'renew' | 'pause' | null>(null)
  const done = () => setAsking(null)

  const cycle = currentCycle(db, engagement.id)
  if (!cycle) return null
  const { state, daysLeft } = subscriptionState(
    cycle,
    engagement.status,
    todayIso(),
    db.settings.dueSoonDays
  )
  const meter = engagementMeter(db, engagement, todayIso())
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
          <Button disabled={isBusy} onClick={() => setAsking('renew')}>
            <Receipt /> {t('engagements.renew')}
          </Button>
          <Button
            variant='outline'
            disabled={isBusy}
            onClick={() =>
              extendGrace.mutate(
                { engagementId: engagement.id, days: GRACE_STEP_DAYS },
                {
                  onSuccess: () =>
                    toast.success(t('engagements.graceExtended')),
                }
              )
            }
          >
            <TimerReset /> {t('engagements.extendGrace')}
          </Button>
          <Button
            variant='outline'
            className='text-overdue hover:text-overdue'
            disabled={isBusy}
            onClick={() => setAsking('pause')}
          >
            <Pause /> {t('engagements.pause')}
          </Button>
          <p className='text-xs text-muted-foreground sm:col-span-3'>
            {moneyText(engagement.amount, engagement.currency)} ·{' '}
            {t('engagements.pauseHint')}
          </p>
        </div>
      )}
      <ConfirmDialog
        open={asking === 'renew'}
        onOpenChange={(open) => !open && done()}
        title={t('engagements.renewConfirm')}
        desc={t('engagements.renewConfirmHint', {
          amount: moneyText(engagement.amount, engagement.currency),
        })}
        confirmText={t('engagements.renew')}
        isLoading={renew.isPending}
        handleConfirm={() =>
          renew.mutate(engagement.id, {
            onSuccess: (invoice) => {
              done()
              invoiceToast(invoice, 'engagements.renewed')
            },
          })
        }
      />
      <ConfirmDialog
        open={asking === 'pause'}
        onOpenChange={(open) => !open && done()}
        destructive
        title={t('engagements.pauseConfirm')}
        desc={t('engagements.pauseHint')}
        confirmText={t('engagements.pause')}
        isLoading={stop.isPending}
        handleConfirm={() =>
          stop.mutate(engagement.id, {
            onSuccess: () => {
              done()
              toast.success(t('engagements.paused'))
            },
          })
        }
      />
    </Panel>
  )
}
