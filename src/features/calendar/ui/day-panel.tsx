import { useState } from 'react'
import { format, type Locale, parseISO } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { Check, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useArchiveImportantDate,
  useHandleImportantDate,
} from '../api/use-calendar'
import type { CalendarItem } from '../model/calendar-items'
import type { CalendarEvent, ImportantDate } from '../model/calendar.schema'
import { KIND_STYLE } from './kind-style'

type Props = {
  day: string
  locale: Locale
  items: CalendarItem[]
  onAddEvent: () => void
  onEditEvent: (event: CalendarEvent) => void
  onEditDate: (date: ImportantDate) => void
}

/** The selected day: its entries, with actions for the owner's own ones. */
export function DayPanel({
  day,
  locale,
  items,
  onAddEvent,
  onEditEvent,
  onEditDate,
}: Props) {
  const { t } = useTranslation()
  const handle = useHandleImportantDate()
  const archive = useArchiveImportantDate()
  const [archiving, setArchiving] = useState<ImportantDate>()

  return (
    <Panel
      title={format(parseISO(day), 'EEEE d MMMM', { locale })}
      className='h-fit'
      action={
        <Button size='sm' variant='outline' onClick={onAddEvent}>
          <Plus /> {t('calendar.addEvent')}
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState>{t('calendar.nothing')}</EmptyState>
      ) : (
        <ul className='grid gap-2'>
          {items.map((item) => (
            <li
              key={item.id}
              className='grid gap-1.5 rounded-lg border p-3 text-sm'
            >
              <div className='flex items-center justify-between gap-2'>
                <span
                  className={cn(
                    'w-fit rounded px-1.5 py-0.5 text-[11px] font-medium',
                    KIND_STYLE[item.kind]
                  )}
                >
                  {t(`calendar.kinds.${item.kind}`)}
                  {item.time && <span className='ms-1 num'>{item.time}</span>}
                </span>
                {(item.event ?? item.importantDate) && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    aria-label={t('common.edit')}
                    onClick={() =>
                      item.event
                        ? onEditEvent(item.event)
                        : item.importantDate && onEditDate(item.importantDate)
                    }
                  >
                    <Pencil />
                  </Button>
                )}
              </div>
              <ItemTitle item={item} />
              {item.event?.notes && (
                <p className='text-xs text-muted-foreground'>
                  {item.event.notes}
                </p>
              )}
              {item.importantDate && (
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={handle.isPending}
                    onClick={() =>
                      item.importantDate &&
                      handle.mutate(item.importantDate.id, {
                        onSuccess: () => toast.success(t('calendar.handled')),
                      })
                    }
                  >
                    <Check />{' '}
                    {t(`calendar.handle.${item.importantDate.recurrence}`)}
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='text-muted-foreground'
                    onClick={() => setArchiving(item.importantDate)}
                  >
                    {t('common.archive')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={archiving !== undefined}
        onOpenChange={(open) => !open && setArchiving(undefined)}
        title={t('calendar.archiveTitle', { name: archiving?.title })}
        desc={t('calendar.archiveHint')}
        confirmText={t('common.archive')}
        isLoading={archive.isPending}
        handleConfirm={() =>
          archiving &&
          archive.mutate(archiving.id, {
            onSuccess: () => {
              setArchiving(undefined)
              toast.success(t('common.archivedDone'))
            },
          })
        }
      />
    </Panel>
  )
}

function ItemTitle({ item }: { item: CalendarItem }) {
  if (item.engagementId) {
    return (
      <Link
        to='/engagements/$id'
        params={{ id: item.engagementId }}
        className='hover:underline'
      >
        {item.title}
      </Link>
    )
  }
  if (item.invoiceId) {
    return (
      <Link
        to='/invoices/$id'
        params={{ id: item.invoiceId }}
        className='num hover:underline'
      >
        {item.title}
      </Link>
    )
  }
  return <span>{item.title}</span>
}
