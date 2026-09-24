import { addDays, format, parseISO } from 'date-fns'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import { BellRing, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Invoice } from '@/features/invoices/model/invoice.schema'

type RemindersProps = { invoice: Invoice; message: string; whatsapp: string }

export function RemindersPanel({ invoice, message, whatsapp }: RemindersProps) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const offsets = useDb().settings.reminderOffsets
  const now = todayIso()
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
      {offsets.map((offset) => {
        const on = format(
          addDays(parseISO(invoice.dueOn), offset),
          'yyyy-MM-dd'
        )
        const isDue = on <= now
        return (
          <div
            key={offset}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border p-2 text-sm',
              isDue && 'border-billable/50 bg-billable-soft/40'
            )}
          >
            <span className='grid'>
              <span>{t('invoice.reminderAt', { count: offset })}</span>
              <span className='text-xs text-muted-foreground'>{fmt(on)}</span>
            </span>
            {isDue && (
              <Button asChild size='sm' variant='ghost'>
                <a
                  href={waLink(whatsapp, message)}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t('common.whatsapp')}
                >
                  <MessageCircle />
                </a>
              </Button>
            )}
          </div>
        )
      })}
    </Panel>
  )
}
