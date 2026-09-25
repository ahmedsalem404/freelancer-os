import { useState } from 'react'
import { useDateFormat } from '@/shared/lib/dates'
import { Check, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalApprove, usePortalFeedback } from '../api/use-portal-actions'
import type { PortalView } from '../model/portal.schema'

type Props = {
  token: string
  deliverable: PortalView['deliverables'][number]
}

/** One deliverable: approve it, or send a change request (a new round). */
export function PortalDeliverable({ token, deliverable }: Props) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const approve = usePortalApprove(token)
  const feedback = usePortalFeedback(token)
  const [isRequesting, setIsRequesting] = useState(false)
  const [note, setNote] = useState('')

  const requestChanges = (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim() || feedback.isPending) return
    // Owner decision: a client change request is a real revision round.
    feedback.mutate(
      { deliverableId: deliverable.id, note: note.trim() },
      {
        onSuccess: ({ roundNo }) => {
          toast.success(t('engagements.feedbackSaved', { n: roundNo }))
          setNote('')
          setIsRequesting(false)
        },
      }
    )
  }

  return (
    <article className='grid gap-3 rounded-xl border bg-card p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='grid gap-0.5'>
          <span className='font-medium'>{deliverable.title}</span>
          <span className='text-xs text-muted-foreground'>
            {deliverable.dueOn &&
              t('engagements.dueOn', { date: fmt(deliverable.dueOn) })}
            {deliverable.rounds > 0 &&
              ` · ${t('engagements.round', { n: deliverable.rounds })}`}
          </span>
        </div>
        {deliverable.isApproved ? (
          <span className='inline-flex items-center gap-1 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success'>
            <Check className='size-4' /> {t('portal.approved')}
          </span>
        ) : (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsRequesting((v) => !v)}
            >
              <MessageSquare /> {t('engagements.logFeedback')}
            </Button>
            <Button
              size='sm'
              disabled={approve.isPending}
              onClick={() =>
                approve.mutate(
                  { deliverableId: deliverable.id },
                  { onSuccess: () => toast.success(t('portal.approvedToast')) }
                )
              }
            >
              <Check /> {t('portal.approve')}
            </Button>
          </div>
        )}
      </div>
      {isRequesting && (
        <form onSubmit={requestChanges} className='grid gap-2'>
          <Textarea
            autoFocus
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('engagements.feedbackPlaceholder')}
          />
          <Button
            type='submit'
            size='sm'
            className='justify-self-end'
            disabled={!note.trim() || feedback.isPending}
          >
            {t('engagements.saveFeedback')}
          </Button>
        </form>
      )}
    </article>
  )
}
