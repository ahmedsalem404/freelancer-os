import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { useDateFormat } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { Check, MessageSquarePlus, Receipt } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import {
  deliverableApproval,
  revisionGuard,
  roundsOf,
} from '@/features/engagements/model/guard'
import type { Deliverable } from '@/features/engagements/model/work.schema'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { ApproveButton } from '@/features/engagements/ui/approve-button'
import { useMoneyText } from '@/features/rates/ui/money'
import {
  useAddFeedback,
  useBillOverageRounds,
} from '../api/use-deliverable-actions'
import { FeedbackForm } from './feedback-form'

type Props = { deliverable: Deliverable; engagement: Engagement }

export function DeliverableCard({ deliverable, engagement }: Props) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const navigate = useNavigate()
  const db = useDb()
  const addFeedback = useAddFeedback()
  const billOverageRounds = useBillOverageRounds()
  const [isLogging, setIsLogging] = useState(false)
  const [note, setNote] = useState('')

  const rounds = roundsOf(db, deliverable.id)
  const guard = revisionGuard(deliverable, rounds)
  const approval = deliverableApproval(db, deliverable.id)
  const price = moneyText(engagement.overageUnitPrice, engagement.currency)

  const billRounds = () =>
    billOverageRounds.mutate(deliverable.id, {
      onSuccess: (invoice) =>
        toast.success(t('guard.invoiceCreated', { number: invoice.number }), {
          action: {
            label: t('common.open'),
            onClick: () =>
              navigate({ to: '/invoices/$id', params: { id: invoice.id } }),
          },
        }),
    })

  const onSaved = ({ roundNo }: { roundNo: number }) => {
    setNote('')
    setIsLogging(false)
    if (roundNo > deliverable.revisionLimit) {
      toast.warning(
        t('guard.revisionOver', {
          n: roundNo,
          limit: deliverable.revisionLimit,
        }),
        { action: { label: t('guard.billRound'), onClick: billRounds } }
      )
    } else {
      toast.success(t('engagements.feedbackSaved', { n: roundNo }))
    }
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim() || addFeedback.isPending) return
    addFeedback.mutate(
      { deliverableId: deliverable.id, note: note.trim() },
      { onSuccess: onSaved }
    )
  }

  return (
    <article
      className={cn(
        'grid gap-3 rounded-xl border bg-card p-4',
        guard.unbilledOver > 0 && 'border-billable/60'
      )}
    >
      <header className='flex flex-wrap items-start justify-between gap-2'>
        <div className='grid gap-0.5'>
          <h3 className='font-medium'>
            {deliverable.title}
            {deliverable.origin === 'change_scope' && (
              <span className='ms-2 rounded-full bg-billable-soft px-2 py-0.5 text-[11px] text-billable-foreground dark:text-billable'>
                {t('invoiceKind.scope')}
              </span>
            )}
          </h3>
          {deliverable.dueOn && (
            <span className='text-xs text-muted-foreground'>
              {t('engagements.dueOn', { date: fmt(deliverable.dueOn) })}
            </span>
          )}
        </div>
        {approval ? (
          <span className='inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success'>
            <Check className='size-3.5' /> {t('engagements.approved')}
          </span>
        ) : (
          <ApproveButton
            deliverableId={deliverable.id}
            name={deliverable.title}
          />
        )}
      </header>

      <AllowanceMeter
        size='sm'
        meter={{
          unit: 'revisions',
          used: guard.used,
          included: guard.limit,
          overage: guard.overCount,
          unbilled: guard.unbilledOver,
          state:
            guard.overCount > 0
              ? 'over'
              : guard.used >= guard.limit
                ? 'near'
                : 'ok',
        }}
      />

      {rounds.length > 0 && (
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
      )}

      {guard.unbilledOver > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-billable-soft p-3 text-sm'>
          <span className='text-billable-foreground dark:text-billable'>
            {t('meter.overage', { count: guard.unbilledOver })}
          </span>
          <Button
            size='sm'
            onClick={billRounds}
            disabled={billOverageRounds.isPending}
            className='bg-billable text-[#241a00] hover:bg-billable/90'
          >
            <Receipt /> {t('guard.billRound')} ·{' '}
            {moneyText(
              guard.unbilledOver * engagement.overageUnitPrice,
              engagement.currency
            )}
          </Button>
        </div>
      )}

      <AnimatePresence initial={false} mode='wait'>
        {isLogging ? (
          <FeedbackForm
            key='form'
            guard={guard}
            price={price}
            note={note}
            onNoteChange={setNote}
            isPending={addFeedback.isPending}
            onSubmit={save}
            onCancel={() => setIsLogging(false)}
          />
        ) : (
          <motion.div
            key='button'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsLogging(true)}
            >
              <MessageSquarePlus /> {t('engagements.logFeedback')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
