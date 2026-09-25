import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvoiceTable } from '@/features/invoices/ui/invoice-table'
import { BaseMoney } from '@/features/rates/ui/money'
import { ExpensesPanel } from './expenses-panel'
import { PaymentsList, SubscriptionsList } from './finance-lists'
import { ForecastChart } from './forecast-chart'
import { useFinance } from './use-finance'

const TABS = [
  'overview',
  'invoices',
  'payments',
  'expenses',
  'subscriptions',
] as const

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
          <ExpensesPanel />
        </TabsContent>
        <TabsContent value='subscriptions'>
          <SubscriptionsList />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
