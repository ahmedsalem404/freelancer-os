import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { useTranslation } from 'react-i18next'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { deliverablesOf } from '@/features/engagements/model/guard'
import { ClientLinkPanel } from '@/features/portal'
import { DeliverableCard } from './deliverable-card'
import { StagesPanel } from './stages-panel'

/** A project's work: its stages, deliverables and the client link. */
export function WorkTab({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const deliverables = deliverablesOf(useDb(), engagement.id)
  return (
    <div className='grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]'>
      <StagesPanel engagementId={engagement.id} />
      <div className='grid content-start gap-3'>
        {deliverables.map((d) => (
          <DeliverableCard key={d.id} deliverable={d} engagement={engagement} />
        ))}
        {deliverables.length === 0 && (
          <EmptyState>{t('common.empty')}</EmptyState>
        )}
        <ClientLinkPanel engagementId={engagement.id} />
      </div>
    </div>
  )
}
