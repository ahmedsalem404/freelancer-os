import { useUiPrefs } from '@/app/client/ui-prefs'
import { Panel } from '@/shared/components/panel'
import { useLang } from '@/shared/lib/dates'
import { formatAmount, fromBase, toMajor } from '@/shared/money/money'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLastRates } from '@/features/rates/api/use-rates'
import type { Week } from './use-finance'

export function ForecastChart({ weeks }: { weeks: Week[] }) {
  const { t } = useTranslation()
  const lang = useLang()
  const rates = useLastRates()
  const display = useUiPrefs((s) => s.displayCurrency)
  const data = weeks.map((w) => ({
    ...w,
    incoming: toMajor(fromBase(w.incoming, rates[display])),
    outgoing: -toMajor(fromBase(w.outgoing, rates[display])),
  }))

  return (
    <Panel title={t('finance.forecast')}>
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('finance.forecastHint')}
      </p>
      <div className='h-64' dir='ltr'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={data}
            stackOffset='sign'
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} stroke='var(--border)' />
            <XAxis
              dataKey='label'
              reversed={lang === 'ar'}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              orientation={lang === 'ar' ? 'right' : 'left'}
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{
                fontSize: 11,
                fill: 'var(--muted-foreground)',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <Tooltip
              cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => formatAmount(Math.abs(Number(value)) * 100)}
            />
            <Bar
              dataKey='incoming'
              name={t('finance.receivable')}
              stackId='cash'
              fill='var(--chart-1)'
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey='outgoing'
              name={t('finance.tabs.subscriptions')}
              stackId='cash'
              fill='var(--chart-5)'
              radius={[0, 0, 4, 4]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
