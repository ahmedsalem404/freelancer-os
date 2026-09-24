import { toMinor } from '@/shared/money/money'
import { useState } from 'react'
import {
  annualBaseline,
  shouldAccept,
  type BaselineInput,
} from './model/pricing'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMoneyText } from '@/components/fos/money'
import { PageShell, Panel, StatTile } from '@/components/fos/page'

const FIELDS: { key: keyof BaselineInput; label: string }[] = [
  { key: 'income', label: 'pricing.income' },
  { key: 'hoursPerWeek', label: 'pricing.hoursWeek' },
  { key: 'weeksOff', label: 'pricing.weeksOff' },
  { key: 'monthlyCosts', label: 'pricing.monthlyCosts' },
  { key: 'taxPct', label: 'pricing.tax' },
  { key: 'profitPct', label: 'pricing.profit' },
]

const VERDICT_STYLE = {
  good: 'bg-success-soft text-success ring-success/40',
  ok: 'bg-billable-soft text-billable-foreground ring-billable/40 dark:text-billable',
  bad: 'bg-overdue-soft text-overdue ring-overdue/40',
}

type FieldProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function NumberField({ id, label, value, onChange }: FieldProps) {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={id} className='text-xs text-muted-foreground'>
        {label}
      </Label>
      <Input
        id={id}
        dir='ltr'
        inputMode='decimal'
        className='num w-full'
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  )
}

export function Pricing() {
  const { t } = useTranslation()
  const money = useMoneyText()
  const sar = (major: number) => money(toMinor(major), 'SAR')
  const [input, setInput] = useState<BaselineInput>({
    income: 120000,
    hoursPerWeek: 25,
    weeksOff: 4,
    monthlyCosts: 1000,
    taxPct: 0,
    profitPct: 15,
  })
  const [offer, setOffer] = useState(3500)
  const [effort, setEffort] = useState(40)

  const baseline = annualBaseline(input)
  const decision = shouldAccept(offer, effort, baseline.hourly)
  const verdictText =
    decision.verdict === 'good'
      ? t('pricing.verdictGood')
      : decision.verdict === 'ok'
        ? t('pricing.verdictOk')
        : t('pricing.verdictBad', { pct: decision.gapPct })

  return (
    <PageShell title={t('pricing.title')} subtitle={t('pricing.subtitle')}>
      <div className='grid gap-3 sm:grid-cols-3'>
        <StatTile
          label={t('pricing.hourly')}
          value={<span className='num'>{sar(baseline.hourly)}</span>}
        />
        <StatTile
          label={t('pricing.daily')}
          value={<span className='num'>{sar(baseline.daily)}</span>}
        />
        <StatTile
          label={t('pricing.monthlyTarget')}
          value={<span className='num'>{sar(baseline.monthlyTarget)}</span>}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Panel
          title={t('pricing.baseline')}
          bodyClassName='grid gap-3 sm:grid-cols-2'
        >
          {FIELDS.map((field) => (
            <NumberField
              key={field.key}
              id={field.key}
              label={t(field.label)}
              value={input[field.key]}
              onChange={(value) =>
                setInput((prev) => ({ ...prev, [field.key]: value }))
              }
            />
          ))}
        </Panel>

        <Panel title={t('pricing.shouldAccept')} bodyClassName='grid gap-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <NumberField
              id='offer'
              label={t('pricing.offer')}
              value={offer}
              onChange={setOffer}
            />
            <NumberField
              id='effort'
              label={t('pricing.effort')}
              value={effort}
              onChange={setEffort}
            />
          </div>
          <AnimatePresence mode='wait'>
            <motion.div
              key={decision.verdict}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'grid gap-1 rounded-xl p-4 ring-1',
                VERDICT_STYLE[decision.verdict]
              )}
            >
              <span className='font-display text-lg font-semibold'>
                {verdictText}
              </span>
              <span className='text-sm'>
                {t('pricing.effective')}:{' '}
                <span className='num font-medium'>
                  {sar(decision.effective)}
                </span>
              </span>
            </motion.div>
          </AnimatePresence>
          <p className='text-sm text-muted-foreground'>
            {t('pricing.suggested')}:{' '}
            <span className='num font-medium text-foreground'>
              {sar(decision.suggested)}
            </span>
          </p>
        </Panel>
      </div>
    </PageShell>
  )
}
