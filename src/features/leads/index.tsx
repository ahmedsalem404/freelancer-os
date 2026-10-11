import { useState } from 'react'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { LeadStage } from '@/features/leads/model/enums'
import type { Lead } from '@/features/leads/model/lead.schema'
import { useMoveLead } from './api/use-move-lead'
import { ConvertLeadDialog } from './ui/convert-lead-dialog'
import { LeadColumn } from './ui/lead-column'
import { LeadFormDialog } from './ui/lead-form-dialog'

const STAGES: LeadStage[] = ['lead', 'proposal', 'negotiation', 'won', 'lost']

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
            <LeadColumn
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
