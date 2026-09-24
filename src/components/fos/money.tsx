import { currencySymbol, formatAmount, fromBase } from '@/domain/money'
import type { Currency } from '@/domain/types'
import { useStore } from '@/mock/store'
import { useLang } from '@/lib/dates'
import { cn } from '@/lib/utils'

type MoneyProps = {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Snapshot rate of the record; used for the base-currency hint. */
  rateToBase?: number
  showBase?: boolean
  className?: string
}

/** An amount in its own transaction currency. */
export function Money({
  amount,
  currency,
  rateToBase,
  showBase,
  className,
}: MoneyProps) {
  const lang = useLang()
  const display = useStore((s) => s.displayCurrency)
  const rates = useStore((s) => s.lastRates)
  const base = amount * (rateToBase ?? rates[currency])
  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className='whitespace-nowrap'>
        <span className='num'>{formatAmount(amount)}</span>{' '}
        <span className='text-[0.8em] text-muted-foreground'>
          {currencySymbol(currency, lang)}
        </span>
      </span>
      {showBase && currency !== display && (
        <span className='text-xs text-muted-foreground'>
          ≈{' '}
          <span className='num'>
            {formatAmount(fromBase(base, rates[display]))}
          </span>{' '}
          {currencySymbol(display, lang)}
        </span>
      )}
    </span>
  )
}

/** A base (SAR minor) amount shown in the viewer's report currency. */
export function BaseMoney({
  base,
  className,
}: {
  base: number
  className?: string
}) {
  const lang = useLang()
  const display = useStore((s) => s.displayCurrency)
  const rates = useStore((s) => s.lastRates)
  return (
    <span className={cn('whitespace-nowrap', className)}>
      <span className='num'>
        {formatAmount(fromBase(base, rates[display]))}
      </span>{' '}
      <span className='text-[0.55em] font-normal text-muted-foreground'>
        {currencySymbol(display, lang)}
      </span>
    </span>
  )
}

export function useMoneyText() {
  const lang = useLang()
  return (minor: number, currency: Currency) =>
    `${formatAmount(minor)} ${currencySymbol(currency, lang)}`
}
