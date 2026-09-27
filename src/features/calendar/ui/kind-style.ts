import type { ItemKind } from '../model/calendar-items'

/** Chip colours per calendar entry kind. */
export const KIND_STYLE: Record<ItemKind, string> = {
  event: 'bg-chart-2/15 text-chart-2',
  deliverable: 'bg-primary/15 text-primary',
  renewal: 'bg-billable-soft text-billable-foreground dark:text-billable',
  invoice: 'bg-overdue-soft text-overdue',
  domain: 'bg-chart-3/15 text-chart-3',
  ssl: 'bg-chart-3/15 text-chart-3',
  hosting: 'bg-chart-3/15 text-chart-3',
  license: 'bg-muted text-muted-foreground',
  other: 'bg-muted text-muted-foreground',
}
