import { useState } from 'react'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { daysFrom } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { todayIso } from '@/shared/model/dates'
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
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { LeadStage } from '@/features/leads/model/enums'
import type { Lead } from '@/features/leads/model/lead.schema'
import { LEAD_TONE } from '@/features/leads/ui/lead-tone'
import { BaseMoney, Money } from '@/features/rates/ui/money'
import { useMoveLead } from './api/use-move-lead'
import { ConvertLeadDialog } from './ui/convert-lead-dialog'
import { LeadFormDialog } from './ui/lead-form-dialog'

const STAGES: LeadStage[] = ['lead', 'proposal', 'negotiation', 'won', 'lost']
const STALE_DAYS = 7

export function Leads() {
  const { t } = useTranslation()
  const leads = useDb().leads
  const moveLead = useMoveLead()
  const [converting, setConverting] = useState<Lead>()
  // `null` = adding a new lead; a lead = editing it; undefined = closed.
  const [editing, setEditing] = useState<Lead | null>()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const stage = over.id as LeadStage
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.stage === stage) return
    // Winning opens a client and an engagement — ask for them first.
    if (stage === 'won') {
      setConverting(lead)
      return
    }
    moveLead.mutate(
      { leadId: lead.id, stage },
      {
        onSuccess: () =>
          toast.success(t('leads.moved', { stage: t(`leadStage.${stage}`) })),
      }
    )
  }

  return (
    <PageShell
      title={t('leads.title')}
      subtitle={t('leads.subtitle')}
      actions={
        <Button size='sm' onClick={() => setEditing(null)}>
          <Plus /> {t('leads.form.add')}
        </Button>
      }
    >
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
              onEdit={setEditing}
            />
          ))}
        </div>
      </DndContext>
      {editing !== undefined && (
        <LeadFormDialog
          lead={editing ?? undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
      {converting && (
        <ConvertLeadDialog
          lead={converting}
          onClose={() => setConverting(undefined)}
        />
      )}
    </PageShell>
  )
}

type ColumnProps = {
  stage: LeadStage
  leads: Lead[]
  onEdit: (lead: Lead) => void
}

function Column({ stage, leads, onEdit }: ColumnProps) {
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

function LeadCard({
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
