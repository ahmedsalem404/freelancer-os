import type { LeadStage } from '@/features/leads/model/enums'

export const LEAD_TONE: Record<LeadStage, string> = {
  lead: 'bg-muted-foreground/40',
  proposal: 'bg-chart-3',
  negotiation: 'bg-billable',
  won: 'bg-success',
  lost: 'bg-overdue',
}
