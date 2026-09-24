import { QuickConverter } from './quick-converter'
import { RateHistory } from './rate-history'
import { currencySymbol } from '@/shared/money/money'
import { useCurrentRate, useSaveDailyRate } from '@/features/rates/api/use-rates'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLang } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
