import { cn } from '@/shared/lib/utils'
import { useTranslation } from 'react-i18next'
import type {
  Deliverable,
  ReviewRound,
} from '@/features/engagements/model/work.schema'

/** Feedback rounds logged on one deliverable; rounds past the limit stand out. */
export function RoundList({
  rounds,
  deliverable,
}: {
  rounds: ReviewRound[]
  deliverable: Deliverable
}) {
  const { t } = useTranslation()
  if (rounds.length === 0) return null
  return (
    <ol className='grid gap-1.5 border-s-2 ps-3'>
      {rounds.map((r) => (
        <li key={r.id} className='text-sm'>
          <span
            className={cn(
              'me-2 text-xs font-medium',
              r.roundNo > deliverable.revisionLimit
                ? 'text-billable-foreground dark:text-billable'
                : 'text-muted-foreground'
            )}
          >
            {t('engagements.round', { n: r.roundNo })}
            {r.invoiceItemId && ` · ${t('engagements.billed')}`}
          </span>
          {r.note}
        </li>
      ))}
    </ol>
  )
}
