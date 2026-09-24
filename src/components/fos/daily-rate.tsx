import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { convert, currencySymbol, formatAmount, toMinor } from '@/shared/money/money'
import {
  useCurrentRate,
  useLastRates,
  useSaveDailyRate,
} from '@/features/rates/api/use-rates'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLang } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const HISTORY_SHOWN = 4

const quoteFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

/** Today's rate form (both quotes in YER) + history + quick converter. */
export function DailyRateEditor({ onSaved }: { onSaved?: () => void }) {
  const { t } = useTranslation()
  const current = useCurrentRate()
  const saveRate = useSaveDailyRate()
  const [sar, setSar] = useState(String(current.sarInYer))
  const [usd, setUsd] = useState(String(current.usdInYer))

  const sarValue = Number(sar)
  const usdValue = Number(usd)
  const isValid = sarValue > 0 && usdValue > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) {
      toast.error(t('rates.invalid'))
      return
    }
    saveRate.mutate(
      { sarInYer: sarValue, usdInYer: usdValue },
      {
        onSuccess: () => {
          toast.success(t('rates.saved'))
          onSaved?.()
        },
      }
    )
  }

  return (
    <div className='grid gap-4'>
      <form onSubmit={submit} className='grid gap-3'>
        <p className='text-xs text-muted-foreground'>{t('rates.hint')}</p>
        <RateInput
          id='rate-sar'
          label={t('rates.sar')}
          value={sar}
          onChange={setSar}
        />
        <RateInput
          id='rate-usd'
          label={t('rates.usd')}
          value={usd}
          onChange={setUsd}
        />
        {isValid && (
          <p className='text-xs text-muted-foreground'>
            {t('rates.derived')}{' '}
            <span className='num text-foreground'>
              {(usdValue / sarValue).toFixed(4)}
            </span>
          </p>
        )}
        <Button type='submit' size='sm' disabled={!isValid}>
          {t('rates.save')}
        </Button>
      </form>

      <RateHistory />
      <QuickConverter />
    </div>
  )
}

type RateInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function RateInput({ id, label, value, onChange }: RateInputProps) {
  const lang = useLang()
  return (
    <div className='flex items-center justify-between gap-3'>
      <Label htmlFor={id} className='text-sm font-normal'>
        {label}
      </Label>
      <div className='flex items-center gap-2'>
        <Input
          id={id}
          dir='ltr'
          inputMode='decimal'
          className='num w-28'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className='w-7 text-xs text-muted-foreground'>
          {currencySymbol('YER', lang)}
        </span>
      </div>
    </div>
  )
}

function RateHistory() {
  const { t } = useTranslation()
  const dailyRates = useDb().dailyRates
  return (
    <div className='grid gap-1.5 border-t pt-3'>
      <div className='text-xs font-medium text-muted-foreground'>
        {t('rates.history')}
      </div>
      <table className='w-full text-xs'>
        <thead className='text-muted-foreground'>
          <tr>
            <th className='py-1 text-start font-normal'>{t('rates.day')}</th>
            <th className='py-1 text-end font-normal'>SAR</th>
            <th className='py-1 text-end font-normal'>USD</th>
          </tr>
        </thead>
        <tbody>
          {dailyRates.slice(0, HISTORY_SHOWN).map((r) => (
            <tr key={r.day} className='border-t border-dashed'>
              <td className='py-1 text-start'>
                <span className='num'>{r.day}</span>
              </td>
              <td className='py-1 text-end'>
                <span className='num'>{quoteFormat.format(r.sarInYer)}</span>
              </td>
              <td className='py-1 text-end'>
                <span className='num'>{quoteFormat.format(r.usdInYer)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuickConverter() {
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
