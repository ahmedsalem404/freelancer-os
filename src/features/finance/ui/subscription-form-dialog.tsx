import { useState } from 'react'
import { ChoiceRow } from '@/shared/components/choice-row'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { addDaysIso, todayIso } from '@/shared/model/dates'
import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { toMajor, toMinor } from '@/shared/money/money'
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
import { SUBSCRIPTION_PERIODS, type SubscriptionPeriod } from '../model/enums'
import type { OwnSubscription } from '../model/finance.schema'
import { ownSubscriptionInput } from '../model/own-subscription.input'

/** A new subscription renews in a month by default. */
const DEFAULT_RENEWAL_DAYS = 30
const DEFAULT_REMIND_DAYS = '3'

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
  const { positive } = useFieldErrors()
  const save = useSaveOwnSubscription()
  const remove = useDeleteOwnSubscription()
  const [name, setName] = useState(s?.name ?? '')
  const [vendor, setVendor] = useState(s?.vendor ?? '')
  const [amount, setAmount] = useState(s ? String(toMajor(s.amount)) : '')
  const [currency, setCurrency] = useState<Currency>(s?.currency ?? 'USD')
  const [period, setPeriod] = useState<SubscriptionPeriod>(
    s?.period ?? 'monthly'
  )
  const [nextRenewalOn, setNextRenewalOn] = useState(
    s?.nextRenewalOn ?? addDaysIso(todayIso(), DEFAULT_RENEWAL_DAYS)
  )
  const [remindDays, setRemindDays] = useState(
    s ? String(s.remindDaysBefore) : DEFAULT_REMIND_DAYS
  )
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const body = {
    name,
    vendor,
    amountMinor: toMinor(Number(amount)),
    currency,
    period,
    nextRenewalOn,
    remindDaysBefore: Number(remindDays),
  }
  const isValid =
    amount.trim() !== '' && ownSubscriptionInput.safeParse(body).success
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
          <TextField
            id='sub-name'
            label={t('finance.subForm.name')}
            value={name}
            onChange={setName}
          />
          <TextField
            id='sub-vendor'
            label={t('finance.subForm.vendor')}
            value={vendor}
            onChange={setVendor}
          />
          <ChoiceRow
            label={t('finance.subForm.period')}
            options={SUBSCRIPTION_PERIODS}
            value={period}
            onChange={setPeriod}
            labelOf={(v) => t(`finance.subForm.${v}`)}
          />
          <div className='grid grid-cols-2 gap-3'>
            <TextField
              id='sub-amount'
              label={t('finance.subForm.amount')}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={amount}
              onChange={setAmount}
              error={positive(amount)}
            />
            <TextField
              id='sub-renewal'
              label={t('finance.subForm.nextRenewalOn')}
              type='date'
              dir='ltr'
              value={nextRenewalOn}
              onChange={setNextRenewalOn}
            />
          </div>
          <ChoiceRow
            label={t('finance.subForm.currency')}
            options={CURRENCIES}
            value={currency}
            onChange={setCurrency}
            labelOf={(c) => c}
          />
          <TextField
            id='sub-remind'
            label={t('finance.subForm.remindDays')}
            dir='ltr'
            inputMode='numeric'
            className='num'
            value={remindDays}
            onChange={setRemindDays}
          />
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
