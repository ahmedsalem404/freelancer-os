import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type StatTileProps = {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'billable' | 'overdue'
}

const TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: '',
  billable: 'border-billable/50 bg-billable-soft/60',
  overdue: 'border-overdue/40 bg-overdue-soft/50',
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
}: StatTileProps) {
  return (
    <div className={cn('grid gap-1 rounded-xl border bg-card p-4', TONE[tone])}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-2xl leading-tight font-semibold'>{value}</div>
      {hint && <div className='text-xs text-muted-foreground'>{hint}</div>}
    </div>
  )
}
