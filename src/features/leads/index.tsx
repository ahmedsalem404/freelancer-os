import type { Lead, LeadStage } from '@/domain/types'
import { today, useStore } from '@/mock/store'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { daysFrom } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { LEAD_TONE } from '@/components/fos/badges'
import { BaseMoney, Money } from '@/components/fos/money'
import { PageShell } from '@/components/fos/page'

const STAGES: LeadStage[] = ['lead', 'proposal', 'negotiation', 'won', 'lost']
const STALE_DAYS = 7

export function Leads() {
  const { t } = useTranslation()
  const leads = useStore((s) => s.leads)
  const moveLead = useStore((s) => s.moveLead)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const stage = over.id as LeadStage
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.stage === stage) return
    moveLead(lead.id, stage)
    toast.success(t('leads.moved', { stage: t(`leadStage.${stage}`) }))
  }

  return (
    <PageShell title={t('leads.title')} subtitle={t('leads.subtitle')}>
      <p className='-mt-3 text-xs text-muted-foreground'>
        {t('leads.dragHint')}
      </p>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className='grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4'>
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              leads={leads.filter((l) => l.stage === stage)}
            />
          ))}
        </div>
      </DndContext>
    </PageShell>
  )
}

function Column({ stage, leads }: { stage: LeadStage; leads: Lead[] }) {
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
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </section>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id })
  const idle = lead.lastContactOn ? -daysFrom(today(), lead.lastContactOn) : 0
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
        <GripVertical className='size-4 shrink-0 text-muted-foreground' />
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
