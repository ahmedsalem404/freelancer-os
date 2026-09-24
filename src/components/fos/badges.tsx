import type { ClientHealth } from '@/features/clients/model/client-health'
import type { SubscriptionState } from '@/features/engagements/model/cycles'
import type { EngagementType } from '@/features/engagements/model/enums'
import type { InvoiceStatus } from '@/features/invoices/model/invoice-status'
import type { LeadStage } from '@/features/leads/model/enums'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const pill =
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap'

const TYPE_STYLE: Record<EngagementType, string> = {
  project: 'bg-accent text-accent-foreground',
  retainer: 'bg-secondary text-secondary-foreground ring-1 ring-border',
  subscription: 'bg-primary/10 text-primary dark:bg-primary/15',
}

export function TypeBadge({ type }: { type: EngagementType }) {
  const { t } = useTranslation()
  return (
    <span className={cn(pill, TYPE_STYLE[type])}>{t(`types.${type}`)}</span>
  )
}

const INVOICE_STYLE: Record<InvoiceStatus, string> = {
  unpaid: 'bg-muted text-muted-foreground',
  partial: 'bg-billable-soft text-billable-foreground dark:text-billable',
  paid: 'bg-success-soft text-success',
  overdue: 'bg-overdue-soft text-overdue',
  draft: 'bg-muted text-muted-foreground ring-1 ring-dashed ring-border',
  void: 'bg-muted text-muted-foreground line-through',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  return (
    <span className={cn(pill, INVOICE_STYLE[status])}>
      {t(`invoiceStatus.${status}`)}
    </span>
  )
}

const HEALTH_DOT: Record<ClientHealth, string> = {
  good: 'bg-success',
  watch: 'bg-billable',
  risk: 'bg-overdue',
}

export function HealthBadge({ health }: { health: ClientHealth }) {
  const { t } = useTranslation()
  return (
    <span className={cn(pill, 'bg-muted/70 text-foreground')}>
      <span className={cn('size-1.5 rounded-full', HEALTH_DOT[health])} />
      {t(`health.${health}`)}
    </span>
  )
}

const SUB_STYLE: Record<SubscriptionState, string> = {
  active: 'bg-success-soft text-success',
  due: 'bg-billable-soft text-billable-foreground dark:text-billable',
  grace: 'bg-overdue-soft text-overdue',
  lapsed: 'bg-muted text-muted-foreground line-through',
  paused: 'bg-muted text-muted-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-muted text-muted-foreground line-through',
}

export function SubStateBadge({ state }: { state: SubscriptionState }) {
  const { t } = useTranslation()
  return (
    <span className={cn(pill, SUB_STYLE[state])}>{t(`subState.${state}`)}</span>
  )
}

export const LEAD_TONE: Record<LeadStage, string> = {
  lead: 'bg-muted-foreground/40',
  proposal: 'bg-chart-3',
  negotiation: 'bg-billable',
  won: 'bg-success',
  lost: 'bg-overdue',
}
