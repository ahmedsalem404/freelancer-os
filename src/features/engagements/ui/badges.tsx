import { pill } from '@/shared/components/pill'
import type { SubscriptionState } from '@/features/engagements/model/cycles'
import type { EngagementType } from '@/features/engagements/model/enums'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

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
