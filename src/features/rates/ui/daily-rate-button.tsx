import { DailyRateEditor } from './daily-rate-editor'
import { quoteFormat } from './quote-format'
import { useCurrentRate } from '@/features/rates/api/use-rates'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Header chip: today's rate at a glance; opens the editor. */
export function DailyRateButton() {
  const { t } = useTranslation()
  const current = useCurrentRate()
  const [open, setOpen] = useState(false)
  const isStale = current.day !== todayIso()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          aria-label={t('rates.title')}
          className={cn(
            'h-8 gap-1.5 px-2 text-xs',
            isStale && 'border-billable/60 bg-billable-soft/60'
          )}
        >
          <ArrowLeftRight className='size-3.5' />
          <span className='hidden sm:inline'>{t('rates.title')}</span>
          <span className='num hidden md:inline'>
            {quoteFormat.format(current.sarInYer)} ·{' '}
            {quoteFormat.format(current.usdInYer)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80'>
        <div className='mb-3 flex items-baseline justify-between gap-2'>
          <h2 className='text-sm font-semibold'>{t('rates.title')}</h2>
          <span
            className={cn(
              'text-xs',
              isStale ? 'text-billable' : 'text-muted-foreground'
            )}
          >
            {isStale ? (
              t('rates.stale')
            ) : (
              <span className='num'>{current.day}</span>
            )}
          </span>
        </div>
        <DailyRateEditor onSaved={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
