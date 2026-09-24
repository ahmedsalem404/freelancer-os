import { deliverableApproval, deliverablesOf, roundsOf } from '@/features/engagements/model/guard'
import type { Deliverable } from '@/features/engagements/model/work.schema'
import {
  useAddFeedback,
  useApproveDeliverable,
} from '@/features/engagements/api/use-deliverable-actions'
import { useDb } from '@/app/client/snapshot-query'
import { useState } from 'react'
import { Check, Languages, MessageSquare } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useDateFormat } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useLocale } from '@/context/direction-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/** Public status + approval page. The token maps to an engagement (mock). */
export function Portal({ token }: { token: string }) {
  const { t } = useTranslation()
  const { lang, toggleLang } = useLocale()
  const db = useDb()
  const engagement = db.engagements.find((e) => e.id === token)

  if (!engagement) {
    return (
      <div className='grid min-h-svh place-items-center text-muted-foreground'>
        404
      </div>
    )
  }

  const client = db.clients.find((c) => c.id === engagement.clientId)!
  const identity = db.identities.find((i) => i.id === client.billingIdentityId)!
  const stages = db.stages
    .filter((s) => s.engagementId === engagement.id)
    .sort((a, b) => a.position - b.position)
  const doneStages = stages.filter((s) => s.completedAt).length

  return (
    <div className='min-h-svh bg-background'>
      <div className='h-1.5' style={{ backgroundColor: identity.color }} />
      <main className='mx-auto grid max-w-3xl gap-8 px-4 py-10'>
        <header className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span
              className='grid size-11 shrink-0 place-items-center rounded-lg font-bold text-white'
              style={{ backgroundColor: identity.color }}
            >
              {identity.initials}
            </span>
            <div className='grid'>
              <span className='text-xs text-muted-foreground'>
                {t('portal.preparedBy', { name: identity.name })}
              </span>
              <h1 className='font-display text-2xl font-semibold'>
                {engagement.title}
              </h1>
            </div>
          </div>
          <Button variant='ghost' size='sm' onClick={toggleLang}>
            <Languages /> {lang === 'ar' ? 'EN' : 'ع'}
          </Button>
        </header>

        <p className='rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground'>
          {t('portal.notice')}
        </p>

        {stages.length > 0 && (
          <section className='grid gap-3'>
            <h2 className='text-sm font-semibold'>{t('portal.progress')}</h2>
            <ol className='flex gap-1'>
              {stages.map((stage, index) => (
                <li key={stage.id} className='grid flex-1 gap-1.5'>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'h-2 origin-right rounded-full ltr:origin-left',
                      index < doneStages
                        ? 'bg-primary'
                        : index === doneStages
                          ? 'bg-primary/40'
                          : 'bg-muted'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs',
                      index <= doneStages
                        ? 'font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {stage.title}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className='grid gap-3'>
          <h2 className='text-sm font-semibold'>{t('portal.deliverables')}</h2>
          {deliverablesOf(db, engagement.id).map((d) => (
            <PortalDeliverable key={d.id} deliverable={d} />
          ))}
        </section>
      </main>
    </div>
  )
}

function PortalDeliverable({ deliverable }: { deliverable: Deliverable }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  const approve = useApproveDeliverable()
  const addFeedback = useAddFeedback()
  const [isRequesting, setIsRequesting] = useState(false)
  const [note, setNote] = useState('')
  const approval = deliverableApproval(db, deliverable.id)
  const rounds = roundsOf(db, deliverable.id)

  const requestChanges = (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim() || addFeedback.isPending) return
    // Owner decision: a client change request is a real revision round.
    addFeedback.mutate(
      { deliverableId: deliverable.id, note: note.trim(), source: 'client_link' },
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
            {rounds.length > 0 &&
              ` · ${t('engagements.round', { n: rounds.length })}`}
          </span>
        </div>
        {approval ? (
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
                  { deliverableId: deliverable.id, source: 'client_link' },
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
            disabled={!note.trim()}
          >
            {t('engagements.saveFeedback')}
          </Button>
        </form>
      )}
    </article>
  )
}
