/**
 * Signature element of Freelancer OS: the agreement drawn as ticks.
 * Solid ticks = consumed within the agreement. A hard boundary marks the
 * limit. Anything beyond it is drawn in hatched saffron — billable work.
 */
import { cn } from '@/shared/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { Meter } from '@/features/engagements/model/meter'

const MAX_DISCRETE = 40

type Props = {
  meter: Meter
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function AllowanceMeter({
  meter,
  size = 'md',
  showLabel = true,
  className,
}: Props) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  // Units consumed inside the agreement (overage is drawn separately).
  const within = Math.min(meter.used - meter.overage, meter.included)
  const discrete = meter.included + meter.overage <= MAX_DISCRETE
  const height = size === 'sm' ? 'h-2' : 'h-3'
  const fillTone = meter.state === 'near' ? 'bg-billable/70' : 'bg-primary'
  const total = meter.included + meter.overage || 1

  return (
    <div className={cn('grid gap-1.5', className)}>
      {showLabel && (
        <div className='flex items-baseline justify-between gap-3 text-xs'>
          <span className='text-muted-foreground'>
            <span className='num font-medium text-foreground'>
              {meter.used}/{meter.included}
            </span>{' '}
            {t(`units.${meter.unit}`)}
          </span>
          {meter.overage > 0 ? (
            <span className='font-medium text-billable-foreground dark:text-billable'>
              {t('meter.overage', { count: meter.overage })}
            </span>
          ) : (
            <span
              className={cn(
                meter.state === 'near'
                  ? 'text-billable-foreground dark:text-billable'
                  : 'text-muted-foreground'
              )}
            >
              {t(`meter.${meter.state}`)}
            </span>
          )}
        </div>
      )}

      {discrete ? (
        <div
          className={cn('flex items-stretch gap-[3px]', height)}
          role='meter'
          aria-valuemin={0}
          aria-valuemax={meter.included}
          aria-valuenow={meter.used}
        >
          {Array.from({ length: meter.included }, (_, i) => (
            <motion.span
              key={`in-${i}`}
              initial={reduce ? false : { scaleY: 0.2, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: i * 0.025, duration: 0.25 }}
              className={cn(
                'min-w-[3px] flex-1 origin-bottom rounded-[2px]',
                i < within ? fillTone : 'bg-muted-foreground/15'
              )}
            />
          ))}
          {meter.overage > 0 && (
            <>
              <span className='mx-[2px] w-[2px] rounded-full bg-foreground/70' />
              {Array.from({ length: meter.overage }, (_, i) => (
                <motion.span
                  key={`over-${i}`}
                  initial={reduce ? false : { scaleY: 0.2, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    delay: (meter.included + i) * 0.025 + 0.1,
                    duration: 0.3,
                  }}
                  className='min-w-[3px] flex-1 origin-bottom rounded-[2px] bg-billable-soft hatch-billable ring-1 ring-billable/60 ring-inset'
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex overflow-hidden rounded-full bg-muted-foreground/15',
            height
          )}
          role='meter'
          aria-valuemin={0}
          aria-valuemax={meter.included}
          aria-valuenow={meter.used}
        >
          <span
            className={cn('transition-[width] duration-500', fillTone)}
            style={{ width: `${(within / total) * 100}%` }}
          />
          {meter.overage > 0 && (
            <span
              className='bg-billable-soft hatch-billable'
              style={{ width: `${(meter.overage / total) * 100}%` }}
            />
          )}
        </div>
      )}
    </div>
  )
}
