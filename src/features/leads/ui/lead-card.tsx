import { daysFrom } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { todayIso } from '@/shared/model/dates'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/features/leads/model/lead.schema'
import { Money } from '@/features/rates/ui/money'

const STALE_DAYS = 7

export function LeadCard({
  lead,
  onEdit,
}: {
  lead: Lead
  onEdit: (lead: Lead) => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id })
  const idle = lead.lastContactOn
    ? -daysFrom(todayIso(), lead.lastContactOn)
    : 0
  const isStale = idle >= STALE_DAYS && !['won', 'lost'].includes(lead.stage)

  return (
    <article
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...attributes}
      {...listeners}
      className={cn(
        'grid cursor-grab touch-none gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm active:cursor-grabbing',
        isDragging && 'relative z-10 shadow-lg ring-2 ring-primary',
        isStale && 'border-billable/60'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='grid gap-0.5'>
          <span className='font-medium'>{lead.company ?? lead.name}</span>
          <span className='text-xs text-muted-foreground'>{lead.service}</span>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          {lead.stage !== 'won' && (
            <Button
              size='icon'
              variant='ghost'
              className='size-7'
              aria-label={t('leads.form.editTitle')}
              // Keep a click on the pencil from starting a drag.
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit(lead)}
            >
              <Pencil />
            </Button>
          )}
          <GripVertical className='size-4 text-muted-foreground' />
        </div>
      </div>
      <div className='flex items-center justify-between gap-2 text-xs'>
        <Money
          amount={lead.amount}
          currency={lead.currency}
          className='font-medium'
        />
        <span className='text-muted-foreground'>{lead.source}</span>
      </div>
      {isStale && (
        <span className='text-xs text-billable-foreground dark:text-billable'>
          {t('leads.stale', { count: idle })}
        </span>
      )}
    </article>
  )
}
