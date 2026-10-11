import { cn } from '@/shared/lib/utils'
import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { LeadStage } from '@/features/leads/model/enums'
import type { Lead } from '@/features/leads/model/lead.schema'
import { LEAD_TONE } from '@/features/leads/ui/lead-tone'
import { BaseMoney } from '@/features/rates/ui/money'
import { LeadCard } from './lead-card'

type Props = {
  stage: LeadStage
  leads: Lead[]
  onEdit: (lead: Lead) => void
}

export function LeadColumn({ stage, leads, onEdit }: Props) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = leads.reduce((s, l) => s + l.baseAmount, 0)

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'grid min-h-[320px] content-start gap-2 rounded-xl border bg-muted/40 p-2 transition-colors',
        isOver && 'border-primary bg-accent/60'
      )}
    >
      <header className='flex items-center justify-between px-2 py-1'>
        <span className='flex items-center gap-2 text-sm font-semibold'>
          <span className={cn('size-2 rounded-full', LEAD_TONE[stage])} />
          {t(`leadStage.${stage}`)}
          <span className='num text-xs text-muted-foreground'>
            {leads.length}
          </span>
        </span>
        <BaseMoney base={total} className='text-xs text-muted-foreground' />
      </header>
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onEdit={onEdit} />
      ))}
    </section>
  )
}
