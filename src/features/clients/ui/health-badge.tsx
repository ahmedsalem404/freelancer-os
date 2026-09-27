import { pill } from '@/shared/components/pill'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from 'react-i18next'
import type { ClientHealth } from '@/features/clients/model/client-health'

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
