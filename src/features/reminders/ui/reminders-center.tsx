import { Link } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import { BellRing, Check, MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useHandleImportantDate } from '@/features/calendar'
import { useRenewOwnSubscription } from '@/features/finance'
import { useLogReminder } from '../api/use-log-reminder'
import { pendingReminders, type PendingReminder } from '../model/schedule'
import { useReminderView } from './use-reminder-view'

/** Everything due for a reminder today: send it on WhatsApp or dismiss it. */
export function RemindersCenter() {
  const { t } = useTranslation()
  const db = useDb()
  const viewOf = useReminderView()
  const log = useLogReminder()
  const handleDate = useHandleImportantDate()
  const renewOwn = useRenewOwnSubscription()
  const pending = pendingReminders(db, todayIso()).flatMap((r) => {
    const view = viewOf(r)
    return view ? [{ r, view }] : []
  })

  const decide = (
    r: PendingReminder,
    action: 'sent' | 'dismissed',
    messageBody?: string
  ) =>
    log.mutate(
      { ...r, action, messageBody },
      {
        onSuccess: () =>
          action === 'dismissed' && toast(t('reminders.dismissed')),
      }
    )

  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <BellRing className='size-4' /> {t('reminders.title')}
        </span>
      }
      action={
        pending.length > 0 && (
          <span className='num rounded-full bg-billable-soft px-2 py-0.5 text-xs text-billable-foreground dark:text-billable'>
            {pending.length}
          </span>
        )
      }
      bodyClassName='p-0'
    >
      {pending.length === 0 ? (
        <p className='p-4 text-sm text-muted-foreground'>
          {t('reminders.none')}
        </p>
      ) : (
        <ul className='divide-y'>
          {pending.map(({ r, view }) => (
            <li
              key={`${r.kind}:${r.targetId}:${r.offsetDays}`}
              className='grid gap-2 p-4 text-sm'
            >
              <div className='grid gap-0.5'>
                {view.link ? (
                  <Link
                    to={view.link.to}
                    params={{ id: view.link.id }}
                    className='font-medium hover:underline'
                  >
                    {view.title}
                  </Link>
                ) : (
                  <span className='font-medium'>{view.title}</span>
                )}
                <span className='text-xs text-muted-foreground'>
                  {t(`reminders.kinds.${r.kind}`)} · {view.detail}
                </span>
              </div>
              <div className='flex flex-wrap gap-2'>
                {view.whatsapp && view.message && (
                  <Button asChild size='sm'>
                    <a
                      href={waLink(view.whatsapp, view.message)}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={() => decide(r, 'sent', view.message)}
                    >
                      <MessageCircle /> {t('reminders.send')}
                    </a>
                  </Button>
                )}
                {view.ownSubscriptionId && (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={renewOwn.isPending}
                    onClick={() =>
                      view.ownSubscriptionId &&
                      renewOwn.mutate(view.ownSubscriptionId, {
                        onSuccess: () =>
                          toast.success(t('finance.subForm.renewed')),
                      })
                    }
                  >
                    <Check /> {t('finance.subForm.renew')}
                  </Button>
                )}
                {view.importantDateId && (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={handleDate.isPending}
                    onClick={() =>
                      view.importantDateId &&
                      handleDate.mutate(view.importantDateId, {
                        onSuccess: () => toast.success(t('calendar.handled')),
                      })
                    }
                  >
                    <Check /> {t('reminders.renewed')}
                  </Button>
                )}
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-muted-foreground'
                  disabled={log.isPending}
                  onClick={() => decide(r, 'dismissed')}
                >
                  <X /> {t('reminders.dismiss')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
