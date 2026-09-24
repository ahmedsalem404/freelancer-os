import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { convert, currencySymbol, formatAmount, toMinor } from '@/shared/money/money'
import { useLastRates } from '@/features/rates/api/use-rates'
import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/components/ui/input'

export function QuickConverter() {
  const { t } = useTranslation()
  const lang = useLang()
  const rates = useLastRates()
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState<Currency>('USD')
  const value = Number(amount)
  const minor = value > 0 ? toMinor(value) : 0

  return (
    <div className='grid gap-2 border-t pt-3'>
      <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
        <ArrowLeftRight className='size-3.5' />
        {t('rates.converter')}
      </div>
      <div className='flex gap-2'>
        <Input
          dir='ltr'
          inputMode='decimal'
          aria-label={t('rates.amount')}
          className='num min-w-0 flex-1'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <CurrencyPicker value={from} onChange={setFrom} />
      </div>
      <ul className='grid gap-1 text-sm'>
        {CURRENCIES.filter((c) => c !== from).map((to) => (
          <li key={to} className='flex justify-between gap-2'>
            <span className='text-muted-foreground'>=</span>
            <span>
              <span className='num'>
                {formatAmount(convert(minor, from, to, rates))}
              </span>{' '}
              <span className='text-xs text-muted-foreground'>
                {currencySymbol(to, lang)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CurrencyPicker({
  value,
  onChange,
}: {
  value: Currency
  onChange: (currency: Currency) => void
}) {
  return (
    <div className='flex h-9 items-center rounded-md border p-0.5 text-xs'>
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type='button'
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={cn(
            'num h-full rounded-[5px] px-2 transition-colors',
            value === c
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
