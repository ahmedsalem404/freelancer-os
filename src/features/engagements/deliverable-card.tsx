import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, MessageSquarePlus, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/dates'
import {
  deliverableApproval,
  revisionGuard,
  roundsOf,
} from '@/domain/selectors'
import type { Deliverable, Engagement } from '@/domain/types'
import { useStore } from '@/mock/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { useMoneyText } from '@/components/fos/money'

type Props = { deliverable: Deliverable; engagement: Engagement }

export function DeliverableCard({ deliverable, engagement }: Props) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const moneyText = useMoneyText()
  const navigate = useNavigate()
  const db = useStore()
  const addFeedback = useStore((s) => s.addFeedback)
  const approve = useStore((s) => s.approveDeliverable)
  const billOverageRounds = useStore((s) => s.billOverageRounds)
  const [isLogging, setIsLogging] = useState(false)
  const [note, setNote] = useState('')

  const rounds = roundsOf(db, deliverable.id)
  const guard = revisionGuard(deliverable, rounds)
  const approval = deliverableApproval(db, deliverable.id)
  const price = moneyText(engagement.overageUnitPrice, engagement.currency)

  const billRounds = () => {
    const invoice = billOverageRounds(deliverable.id)
    if (!invoice) return
    toast.success(t('guard.invoiceCreated', { number: invoice.number }), {
      action: {
        label: t('common.open'),
        onClick: () =>
          navigate({ to: '/invoices/$id', params: { id: invoice.id } }),
      },
    })
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim()) return
    const roundNo = addFeedback(deliverable.id, note.trim())
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
          <Button
            size='sm'
            variant='ghost'
            onClick={() => approve(deliverable.id, 'owner')}
          >
            <Check /> {t('engagements.approve')}
          </Button>
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
          <motion.form
            key='form'
            onSubmit={save}
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
              {!guard.inScope && (
                <AlertTriangle className='mt-0.5 size-4 shrink-0' />
              )}
              <div>
                <div className='font-medium'>
                  {guard.inScope
                    ? t('guard.revisionIn', {
                        n: guard.nextRound,
                        limit: guard.limit,
                      })
                    : t('guard.revisionOver', {
                        n: guard.nextRound,
                        limit: guard.limit,
                      })}
                </div>
                {!guard.inScope && (
                  <div>{t('guard.revisionOverHint', { price })}</div>
                )}
              </div>
            </div>
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('engagements.feedbackPlaceholder')}
              rows={3}
            />
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setIsLogging(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' size='sm' disabled={!note.trim()}>
                {t('engagements.saveFeedback')}
              </Button>
            </div>
          </motion.form>
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
