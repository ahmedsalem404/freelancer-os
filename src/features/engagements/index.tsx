import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { SubStateBadge, TypeBadge } from '@/features/engagements/ui/badges'
import { Money } from '@/features/rates/ui/money'
import { PageShell } from '@/app/client/layout/page-shell'
import { currentCycle, subscriptionState } from '@/features/engagements/model/cycles'
import { engagementCurrentValue } from '@/features/engagements/model/guard'
import { engagementMeter } from '@/features/engagements/model/meter'
import type { EngagementType } from '@/features/engagements/model/enums'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/components/ui/button'
import { NewEngagementDialog } from './ui/new-engagement-dialog'

type Filter = 'all' | EngagementType

const FILTERS: Filter[] = ['all', 'project', 'retainer', 'subscription']

export function Engagements() {
  const { t } = useTranslation()
  const db = useDb()
  const [filter, setFilter] = useState<Filter>('all')
  const [isAdding, setIsAdding] = useState(false)
  const now = todayIso()

  const rows = db.engagements
    .filter((e) => filter === 'all' || e.type === filter)
    .map((e) => ({
      e,
      client: db.clients.find((c) => c.id === e.clientId)!,
      meter: engagementMeter(db, e, now),
      cycle: currentCycle(db, e.id),
    }))
    .sort((a, b) => b.meter.unbilled - a.meter.unbilled)

  const count = (f: Filter) =>
    db.engagements.filter((e) => f === 'all' || e.type === f).length

  return (
    <PageShell
      title={t('engagements.title')}
      subtitle={t('engagements.subtitle')}
      actions={
        <Button size='sm' onClick={() => setIsAdding(true)}>
          <Plus /> {t('engagements.add')}
        </Button>
      }
    >
      {isAdding && <NewEngagementDialog onClose={() => setIsAdding(false)} />}
      <div role='tablist' className='flex flex-wrap gap-1.5'>
        {FILTERS.map((f) => (
          <button
            key={f}
            role='tab'
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              filter === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? t('common.all') : t(`types.${f}`)}{' '}
            <span className='num text-xs opacity-70'>{count(f)}</span>
          </button>
        ))}
      </div>

      <motion.ul layout className='grid gap-3 md:grid-cols-2'>
        {rows.map(({ e, client, meter, cycle }, index) => {
          const sub =
            e.type === 'subscription' && cycle
              ? subscriptionState(cycle, e.status, now, db.settings.dueSoonDays)
              : undefined
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                to='/engagements/$id'
                params={{ id: e.id }}
                className={cn(
                  'group grid h-full gap-4 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
                  meter.unbilled > 0 &&
                    e.type !== 'subscription' &&
                    'border-billable/60'
                )}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='grid gap-1'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span
                        className='size-2 rounded-full'
                        style={{ backgroundColor: client.color }}
                      />
                      {client.company ?? client.name}
                    </div>
                    <h2 className='font-display text-base font-semibold group-hover:underline'>
                      {e.title}
                    </h2>
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-1'>
                    <TypeBadge type={e.type} />
                    {sub && <SubStateBadge state={sub.state} />}
                  </div>
                </div>
                <AllowanceMeter meter={meter} />
                <div className='flex items-end justify-between gap-3 border-t pt-3 text-sm'>
                  <p className='line-clamp-2 text-muted-foreground'>
                    {e.nextAction}
                  </p>
                  <Money
                    amount={engagementCurrentValue(db, e)}
                    currency={e.currency}
                    className='shrink-0 text-end font-medium'
                  />
                </div>
              </Link>
            </motion.li>
          )
        })}
      </motion.ul>
    </PageShell>
  )
}
