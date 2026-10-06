import { PendingButton } from '@/shared/components/pending-button'
import { cn } from '@/shared/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { revisionGuard } from '@/features/engagements/model/guard'

type Props = {
  guard: ReturnType<typeof revisionGuard>
  /** The price of one extra round, already formatted. */
  price: string
  note: string
  onNoteChange: (note: string) => void
  isPending: boolean
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
}

/** Logs a client feedback round; warns first when it goes over the limit. */
export function FeedbackForm({
  guard,
  price,
  note,
  onNoteChange,
  isPending,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const round = { n: guard.nextRound, limit: guard.limit }
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className='grid gap-2 overflow-hidden'
    >
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
          guard.inScope
            ? 'bg-muted text-muted-foreground'
            : 'bg-billable-soft text-billable-foreground ring-1 ring-billable/50 dark:text-billable'
        )}
      >
        {!guard.inScope && <AlertTriangle className='mt-0.5 size-4 shrink-0' />}
        <div>
          <div className='font-medium'>
            {guard.inScope
              ? t('guard.revisionIn', round)
              : t('guard.revisionOver', round)}
          </div>
          {!guard.inScope && (
            <div>{t('guard.revisionOverHint', { price })}</div>
          )}
        </div>
      </div>
      <Textarea
        autoFocus
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder={t('engagements.feedbackPlaceholder')}
        rows={3}
      />
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <PendingButton
          type='submit'
          size='sm'
          disabled={!note.trim()}
          isPending={isPending}
        >
          {t('engagements.saveFeedback')}
        </PendingButton>
      </div>
    </motion.form>
  )
}
