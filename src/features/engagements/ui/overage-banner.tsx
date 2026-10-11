import { Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { useMoneyText } from '@/features/rates/ui/money'

/** Unbilled revision rounds past the limit, with a one-click invoice. */
export function OverageBanner({
  unbilled,
  engagement,
  isPending,
  onBill,
}: {
  unbilled: number
  engagement: Engagement
  isPending: boolean
  onBill: () => void
}) {
  const { t } = useTranslation()
  const moneyText = useMoneyText()
  if (unbilled <= 0) return null
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-billable-soft p-3 text-sm'>
      <span className='text-billable-foreground dark:text-billable'>
        {t('meter.overage', { count: unbilled })}
      </span>
      <Button
        size='sm'
        onClick={onBill}
        disabled={isPending}
        className='bg-billable text-[#241a00] hover:bg-billable/90'
      >
        <Receipt /> {t('guard.billRound')} ·{' '}
        {moneyText(unbilled * engagement.overageUnitPrice, engagement.currency)}
      </Button>
    </div>
  )
}
