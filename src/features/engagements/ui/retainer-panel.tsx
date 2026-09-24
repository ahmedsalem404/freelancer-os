import { engagementMeter } from '@/features/engagements/model/meter'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { useState } from 'react'
import { AlertTriangle, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useDb } from '@/app/client/snapshot-query'
import { cn } from '@/lib/utils'
import { useInvoiceToast } from '@/features/invoices/ui/use-invoice-toast'
import {
  useBillExtraHours,
  useLogTime,
} from '@/features/time/api/use-time-actions'
import { todayIso } from '@/shared/model/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { useMoneyText } from '@/components/fos/money'
import { Panel } from '@/components/fos/page'

const MINUTES_PER_HOUR = 60

/** Retainer: log hours with the guard inline, bill the overage. */
export function RetainerPanel({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const moneyText = useMoneyText()
  const db = useDb()
  const logTime = useLogTime()
  const billHours = useBillExtraHours()
  const invoiceToast = useInvoiceToast()
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  const meter = engagementMeter(db, engagement, todayIso())
  const added = Number(hours) || 0
  const projected = Math.round((meter.used + added) * 10) / 10
  const willExceed = projected > meter.included
  const canSubmit = added > 0 && !!description.trim() && !logTime.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    logTime.mutate(
      {
        engagementId: engagement.id,
        minutes: Math.round(added * MINUTES_PER_HOUR),
        description: description.trim(),
        billable: true,
      },
      {
        onSuccess: () => {
          toast.success(t('engagements.hoursLogged', { hours: added }))
          setHours('')
          setDescription('')
        },
      }
    )
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
            disabled={billHours.isPending}
            onClick={() =>
              billHours.mutate(engagement.id, { onSuccess: invoiceToast })
            }
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
          <Button type='submit' disabled={!canSubmit}>
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
