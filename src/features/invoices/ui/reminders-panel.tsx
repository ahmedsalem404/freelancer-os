import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { waLink } from '@/shared/lib/whatsapp'
import { addDaysIso, todayIso } from '@/shared/model/dates'
import { BellRing, Check, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { useLogReminder } from '@/features/reminders'
import { useInvoiceMessage } from './use-invoice-message'

type RemindersProps = { invoice: Invoice; whatsapp: string }

/** The invoice's reminder steps; sending one opens WhatsApp and logs it. */
export function RemindersPanel({ invoice, whatsapp }: RemindersProps) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  const invoiceMessage = useInvoiceMessage()
  const logReminder = useLogReminder()
  const now = todayIso()
  const sentOffsets = new Set(
    db.reminderLog
      .filter(
        (r) =>
          r.kind === 'invoice_due' &&
          r.targetId === invoice.id &&
          r.occurrenceOn === invoice.dueOn
      )
      .map((r) => r.offsetDays)
  )

  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <BellRing className='size-4' /> {t('invoice.reminders')}
        </span>
      }
      bodyClassName='grid gap-2'
    >
      <p className='text-xs text-muted-foreground'>
        {t('invoice.remindersHint')}
      </p>
      {db.settings.reminderOffsets.map((offset) => {
        const on = addDaysIso(invoice.dueOn, offset)
        const isDue = on <= now
        const isDone = sentOffsets.has(offset)
        const message = invoiceMessage(
          invoice,
          offset > 0 ? 'reminder_overdue' : 'reminder_due'
        )
        return (
          <div
            key={offset}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border p-2 text-sm',
              isDue && !isDone && 'border-billable/50 bg-billable-soft/40'
            )}
          >
            <span className='grid'>
              <span>{t('invoice.reminderAt', { count: offset })}</span>
              <span className='text-xs text-muted-foreground'>{fmt(on)}</span>
            </span>
            {isDone ? (
              <span className='inline-flex items-center gap-1 text-xs text-success'>
                <Check className='size-3.5' /> {t('reminders.sent')}
              </span>
            ) : (
              isDue &&
              whatsapp && (
                <Button asChild size='sm' variant='ghost'>
                  <a
                    href={waLink(whatsapp, message)}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={t('common.whatsapp')}
                    onClick={() =>
                      logReminder.mutate({
                        kind: 'invoice_due',
                        targetId: invoice.id,
                        occurrenceOn: invoice.dueOn,
                        offsetDays: offset,
                        action: 'sent',
                        messageBody: message,
                      })
                    }
                  >
                    <MessageCircle />
                  </a>
                </Button>
              )
            )}
          </div>
        )
      })}
    </Panel>
  )
}
