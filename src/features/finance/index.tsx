import { InvoiceTable } from '@/features/invoices/ui/invoice-table'
import { BaseMoney, Money } from '@/features/rates/ui/money'
import { PageShell } from '@/app/client/layout/page-shell'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { formatAmount, fromBase, toMajor } from '@/shared/money/money'
import { currentCycle } from '@/features/engagements/model/cycles'
import { invoiceBalance, isOpenInvoice } from '@/features/invoices/model/invoice-status'
import { useUiPrefs } from '@/app/client/ui-prefs'
import { useLastRates } from '@/features/rates/api/use-rates'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { addDays, differenceInCalendarWeeks, format, parseISO } from 'date-fns'
import { Paperclip } from 'lucide-react'
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
import { useDateFormat, useLang } from '@/lib/dates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FORECAST_WEEKS = 8
const TABS = [
  'overview',
  'invoices',
  'payments',
  'expenses',
  'subscriptions',
] as const

type Week = { label: string; incoming: number; outgoing: number }

function useFinance() {
  const db = useDb()
  const now = todayIso()
  const monthPrefix = now.slice(0, 7)

  const collected = db.payments
    .filter(
      (p) => p.status === 'confirmed' && p.receivedOn.startsWith(monthPrefix)
    )
    .reduce((s, p) => s + p.baseAmount, 0)
  const receivable = db.invoices
    .filter((i) => isOpenInvoice(db, i, now))
    .reduce((s, i) => s + Math.round(invoiceBalance(db, i) * i.rateToBase), 0)
  // Own-subscription charges are already written as expense rows.
  const spent = db.expenses
    .filter((x) => x.spentOn.startsWith(monthPrefix))
    .reduce((s, x) => s + x.baseAmount, 0)
  const burn = db.ownSubscriptions.reduce(
    (s, sub) =>
      s + (sub.period === 'yearly' ? sub.baseAmount / 12 : sub.baseAmount),
    0
  )

  const weeks: Week[] = Array.from({ length: FORECAST_WEEKS }, (_, i) => ({
    label: format(addDays(parseISO(now), i * 7), 'd/M'),
    incoming: 0,
    outgoing: 0,
  }))
  const add = (iso: string, key: 'incoming' | 'outgoing', base: number) => {
    const w = Math.max(
      0,
      differenceInCalendarWeeks(parseISO(iso), parseISO(now))
    )
    if (w < FORECAST_WEEKS) {
      weeks[w] = { ...weeks[w], [key]: weeks[w][key] + base }
    }
  }
  db.invoices
    .filter((i) => isOpenInvoice(db, i, now))
    .forEach((i) =>
      add(i.dueOn, 'incoming', invoiceBalance(db, i) * i.rateToBase)
    )
  db.engagements
    .filter((e) => e.status === 'active' && e.type !== 'project')
    .forEach((e) => {
      const cycle = currentCycle(db, e.id)
      if (cycle) add(cycle.endsOn, 'incoming', e.baseAmount)
    })
  db.ownSubscriptions.forEach((s) =>
    add(s.nextRenewalOn, 'outgoing', s.baseAmount)
  )

  return { collected, receivable, spent, net: collected - spent, burn, weeks }
}

export function Finance() {
  const { t } = useTranslation()
  const invoices = useDb().invoices
  const f = useFinance()

  return (
    <PageShell title={t('finance.title')}>
      <Tabs defaultValue='overview' className='gap-4'>
        <div className='overflow-x-auto pb-1'>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {t(`finance.tabs.${tab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value='overview' className='grid gap-4'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <StatTile
              label={t('finance.collected')}
              value={<BaseMoney base={f.collected} />}
            />
            <StatTile
              label={t('finance.receivable')}
              value={<BaseMoney base={f.receivable} />}
            />
            <StatTile
              label={t('finance.expenses')}
              value={<BaseMoney base={f.spent} />}
            />
            <StatTile
              label={t('finance.net')}
              value={
                <BaseMoney
                  base={f.net}
                  className={f.net < 0 ? 'text-overdue' : ''}
                />
              }
              hint={t('finance.netHint')}
            />
          </div>
          <ForecastChart weeks={f.weeks} />
          <p className='text-sm text-muted-foreground'>
            {t('finance.subscriptionBurn')}:{' '}
            <BaseMoney base={f.burn} className='font-medium text-foreground' />
          </p>
        </TabsContent>

        <TabsContent value='invoices'>
          <Panel bodyClassName='p-0'>
            <InvoiceTable invoices={invoices} />
          </Panel>
        </TabsContent>
        <TabsContent value='payments'>
          <PaymentsList />
        </TabsContent>
        <TabsContent value='expenses'>
          <ExpensesList />
        </TabsContent>
        <TabsContent value='subscriptions'>
          <SubscriptionsList />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function ForecastChart({ weeks }: { weeks: Week[] }) {
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

function PaymentsList() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {db.payments.map((p) => {
          const invoice = db.invoices.find((i) => i.id === p.invoiceId)
          const client = db.clients.find((c) => c.id === invoice?.clientId)
          const hasProof = db.attachments.some((a) => a.paymentId === p.id)
          return (
            <li
              key={p.id}
              className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm'
            >
              <div className='grid gap-0.5'>
                <span className='font-medium'>
                  {client?.company ?? client?.name}
                </span>
                <span className='text-xs text-muted-foreground'>
                  <span className='num'>{invoice?.number}</span> ·{' '}
                  {fmt(p.receivedOn)} · {t(`payMethod.${p.method}`)}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <span
                  className={
                    hasProof
                      ? 'inline-flex items-center gap-1 text-xs text-success'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {hasProof && <Paperclip className='size-3.5' />}
                  {hasProof ? t('finance.proofAttached') : t('finance.noProof')}
                </span>
                <Money
                  amount={p.amount}
                  currency={p.currency}
                  rateToBase={p.rateToBase}
                  showBase
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function ExpensesList() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const expenses = useDb().expenses
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {expenses.map((x) => (
          <li
            key={x.id}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
          >
            <div className='grid gap-0.5'>
              <span>{x.title}</span>
              <span className='text-xs text-muted-foreground'>
                {t(`finance.category.${x.category}`)} · {fmt(x.spentOn)}
              </span>
            </div>
            <Money
              amount={x.amount}
              currency={x.currency}
              rateToBase={x.rateToBase}
              showBase
            />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function SubscriptionsList() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const subs = useDb().ownSubscriptions
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {subs.map((s) => (
          <li
            key={s.id}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
          >
            <div className='grid gap-0.5'>
              <span className='font-medium'>{s.name}</span>
              <span className='text-xs text-muted-foreground'>
                {t(
                  s.period === 'monthly'
                    ? 'finance.perMonth'
                    : 'finance.perYear'
                )}{' '}
                · {t('finance.renews')} {fmt(s.nextRenewalOn)}
              </span>
            </div>
            <Money
              amount={s.amount}
              currency={s.currency}
              rateToBase={s.rateToBase}
              showBase
            />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
