import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { Ban, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Money } from '@/features/rates/ui/money'
import { useCancelOwnSubscription } from '../api/use-own-subscriptions'
import type { OwnSubscription } from '../model/finance.schema'
import { SubscriptionFormDialog } from './subscription-form-dialog'

/** Which dialog is open: add, edit, or stop one subscription. */
type Open =
  | { kind: 'add' }
  | { kind: 'edit'; subscription: OwnSubscription }
  | { kind: 'cancel'; subscription: OwnSubscription }

/** The owner's own tools, with add, edit and stop. */
export function SubscriptionsPanel() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const subs = useDb().ownSubscriptions
  const cancel = useCancelOwnSubscription()
  const [open, setOpen] = useState<Open>()
  const close = () => setOpen(undefined)

  const confirmCancel = (s: OwnSubscription) =>
    cancel.mutate(s.id, {
      onSuccess: () => {
        toast.success(t('finance.subForm.cancelled'))
        close()
      },
    })

  return (
    <Panel
      title={t('finance.tabs.subscriptions')}
      action={
        <Button size='sm' onClick={() => setOpen({ kind: 'add' })}>
          <Plus /> {t('finance.addSubscription')}
        </Button>
      }
      bodyClassName='p-0'
    >
      {subs.length === 0 ? (
        <EmptyState>{t('common.empty')}</EmptyState>
      ) : (
        <ul className='divide-y'>
          {subs.map((s) => (
            <li
              key={s.id}
              className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
            >
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate font-medium'>{s.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {t(
                    s.period === 'monthly'
                      ? 'finance.perMonth'
                      : 'finance.perYear'
                  )}{' '}
                  · {t('finance.renews')} {fmt(s.nextRenewalOn)}
                  {s.vendor && ` · ${s.vendor}`}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Money
                  amount={s.amount}
                  currency={s.currency}
                  rateToBase={s.rateToBase}
                  showBase
                />
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('finance.subForm.edit')}
                  onClick={() => setOpen({ kind: 'edit', subscription: s })}
                >
                  <Pencil />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('finance.subForm.cancel')}
                  onClick={() => setOpen({ kind: 'cancel', subscription: s })}
                >
                  <Ban />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open?.kind === 'add' && <SubscriptionFormDialog onClose={close} />}
      {open?.kind === 'edit' && (
        <SubscriptionFormDialog
          subscription={open.subscription}
          onClose={close}
        />
      )}
      {open?.kind === 'cancel' && (
        <ConfirmDialog
          open
          onOpenChange={(isOpen) => !isOpen && close()}
          destructive
          title={t('finance.subForm.cancelTitle', {
            name: open.subscription.name,
          })}
          desc={t('finance.subForm.cancelHint')}
          confirmText={t('finance.subForm.cancel')}
          cancelBtnText={t('common.cancel')}
          isLoading={cancel.isPending}
          handleConfirm={() => confirmCancel(open.subscription)}
        />
      )}
    </Panel>
  )
}
