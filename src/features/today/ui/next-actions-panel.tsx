import { Link } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useTranslation } from 'react-i18next'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import type { Meter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { TypeBadge } from '@/features/engagements/ui/badges'

type Row = { e: Engagement; meter: Meter }

/** Every active engagement: its next action and its allowance meter. */
export function NextActionsPanel({ meters }: { meters: Row[] }) {
  const { t } = useTranslation()
  const db = useDb()
  const clientOf = (id: string) => db.clients.find((c) => c.id === id)
  return (
    <Panel title={t('today.nextActions')} bodyClassName='p-0'>
      <ul className='divide-y'>
        {meters.map(({ e, meter }) => (
          <li key={e.id}>
            <Link
              to='/engagements/$id'
              params={{ id: e.id }}
              className='grid gap-2 p-4 transition-colors hover:bg-accent/40 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center sm:gap-6'
            >
              <div className='grid gap-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span
                    className='size-2 rounded-full'
                    style={{
                      backgroundColor: clientOf(e.clientId)?.color,
                    }}
                  />
                  <span className='text-sm font-medium'>{e.title}</span>
                  <TypeBadge type={e.type} />
                </div>
                <p className='text-sm text-muted-foreground'>{e.nextAction}</p>
              </div>
              <AllowanceMeter meter={meter} size='sm' />
            </Link>
          </li>
        ))}
      </ul>
      {meters.length === 0 && (
        <div className='p-4'>
          <EmptyState>{t('common.empty')}</EmptyState>
        </div>
      )}
    </Panel>
  )
}
