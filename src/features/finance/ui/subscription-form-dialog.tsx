import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { PendingButton } from '@/shared/components/pending-button'
import { toMinor } from '@/shared/money/money'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useDeleteOwnSubscription,
  useSaveOwnSubscription,
} from '../api/use-own-subscriptions'
import type { OwnSubscription } from '../model/finance.schema'
import { ownSubscriptionInput } from '../model/own-subscription.input'
import { SubscriptionFormFields } from './subscription-form-fields'
import {
  initialSubscriptionForm,
  type SetSubscriptionField,
} from './subscription-form-state'

type Props = {
  /** The subscription to edit; omitted to add a new one. */
  subscription?: OwnSubscription
  onClose: () => void
}

/**
 * Add one of the owner's tools, or correct one. Deleting (for mistakes
 * only — the server refuses one with recorded charges) asks first.
 */
export function SubscriptionFormDialog({ subscription: s, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveOwnSubscription()
  const remove = useDeleteOwnSubscription()
  const [form, setForm] = useState(() => initialSubscriptionForm(s))
  const set: SetSubscriptionField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }))
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const body = {
    name: form.name,
    vendor: form.vendor,
    amountMinor: toMinor(Number(form.amount)),
    currency: form.currency,
    period: form.period,
    nextRenewalOn: form.nextRenewalOn,
    remindDaysBefore: Number(form.remindDays),
  }
  const isValid =
    form.amount.trim() !== '' && ownSubscriptionInput.safeParse(body).success
  const isBusy = save.isPending || remove.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isBusy) return
    save.mutate(
      { ...body, id: s?.id },
      {
        onSuccess: () => {
          toast.success(t('finance.subForm.saved'))
          onClose()
        },
      }
    )
  }

  const deleteIt = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(t('finance.subForm.deleted'))
        onClose()
      },
      onError: () => setIsConfirmingDelete(false),
    })

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(s ? 'finance.subForm.edit' : 'finance.addSubscription')}
            </DialogTitle>
            <DialogDescription>{t('finance.subForm.hint')}</DialogDescription>
          </DialogHeader>
          <SubscriptionFormFields form={form} set={set} />
          <DialogFooter className='sm:justify-between'>
            {s ? (
              <Button
                type='button'
                variant='ghost'
                className='text-destructive'
                disabled={isBusy}
                onClick={() => setIsConfirmingDelete(true)}
              >
                {t('finance.subForm.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className='flex flex-col-reverse gap-2 sm:flex-row'>
              <Button type='button' variant='ghost' onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <PendingButton
                type='submit'
                disabled={!isValid || remove.isPending}
                isPending={save.isPending}
              >
                {t('common.save')}
              </PendingButton>
            </div>
          </DialogFooter>
        </form>
        {s && (
          <ConfirmDialog
            open={isConfirmingDelete}
            onOpenChange={setIsConfirmingDelete}
            destructive
            title={t('common.deleteTitle', { name: s.name })}
            desc={t('common.deleteHint')}
            confirmText={t('finance.subForm.delete')}
            isLoading={remove.isPending}
            handleConfirm={() => deleteIt(s.id)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
