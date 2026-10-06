import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { PendingButton } from '@/shared/components/pending-button'
import { toMajor, toMinor } from '@/shared/money/money'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_UPLOAD_BYTES, useUploadFile } from '@/features/files'
import { useRecordPayment } from '@/features/invoices/api/use-record-payment'
import { invoiceBalance } from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { useCurrentRate, useLastRates } from '@/features/rates/api/use-rates'
import type { PaymentMethodKind } from '@/features/settings/model/enums'
import { PaymentMethodSelect, ProofPicker } from './payment-fields'

type Props = {
  invoice: Invoice | undefined
  onOpenChange: (open: boolean) => void
}

export function RecordPaymentDialog({ invoice, onOpenChange }: Props) {
  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        {invoice && (
          <PaymentForm
            key={invoice.id}
            invoice={invoice}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaymentForm({
  invoice,
  onDone,
}: {
  invoice: Invoice
  onDone: () => void
}) {
  const { t } = useTranslation()
  const db = useDb()
  const recordPayment = useRecordPayment()
  const uploadProof = useUploadFile()
  const currentRate = useCurrentRate()
  const lastRates = useLastRates()
  const balance = invoiceBalance(db, invoice)
  const [amount, setAmount] = useState(String(toMajor(balance)))
  // YER is typed the way the market quotes it (1 SAR = ? YER), then inverted.
  const isYer = invoice.currency === 'YER'
  const [rate, setRate] = useState(() =>
    String(
      isYer
        ? currentRate.sarInYer
        : Number(lastRates[invoice.currency].toFixed(4))
    )
  )
  const [method, setMethod] = useState<PaymentMethodKind>('bank')
  const [proof, setProof] = useState<File>()
  const isTooLarge = (proof?.size ?? 0) > MAX_UPLOAD_BYTES
  const isSaving = recordPayment.isPending || uploadProof.isPending

  const needsRate = invoice.currency !== 'SAR'
  const amountValue = Number(amount)
  const typedRate = Number(rate)
  const rateValue = isYer && typedRate > 0 ? 1 / typedRate : typedRate
  const isValid =
    amountValue > 0 &&
    toMinor(amountValue) <= balance &&
    (!needsRate || rateValue > 0)
  const amountError =
    amount.trim() === ''
      ? undefined
      : !(amountValue > 0)
        ? t('common.mustBePositive')
        : toMinor(amountValue) > balance
          ? t('finance.amountOverBalance', {
              balance: toMajor(balance),
              currency: invoice.currency,
            })
          : undefined

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isTooLarge || isSaving) return
    recordPayment.mutate(
      {
        invoiceId: invoice.id,
        amountMinor: toMinor(amountValue),
        rateToBase: needsRate ? rateValue : 1,
        method,
      },
      {
        onSuccess: ({ id }) => {
          toast.success(t('finance.paymentSaved'))
          if (!proof) return onDone()
          // The payment is saved either way; a failed proof shows its own error.
          uploadProof.mutate(
            { fields: { kind: 'payment_proof', paymentId: id }, file: proof },
            { onSettled: onDone }
          )
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className='grid gap-4'>
      <DialogHeader className='text-start'>
        <DialogTitle>
          {t('finance.recordPayment')} ·{' '}
          <span className='num text-muted-foreground'>{invoice.number}</span>
        </DialogTitle>
      </DialogHeader>

      <div className='grid gap-2'>
        <Label htmlFor='pay-amount'>
          {t('finance.paymentAmount')} ({invoice.currency})
        </Label>
        <Input
          id='pay-amount'
          inputMode='decimal'
          dir='ltr'
          className='num w-full'
          value={amount}
          aria-invalid={amountError ? true : undefined}
          aria-describedby={amountError ? 'pay-amount-error' : undefined}
          onChange={(e) => setAmount(e.target.value)}
        />
        {amountError && (
          <p id='pay-amount-error' className='text-xs text-destructive'>
            {amountError}
          </p>
        )}
      </div>

      {needsRate && (
        <div className='grid gap-2'>
          <Label htmlFor='pay-rate'>
            {isYer
              ? t('rates.yerPerSar')
              : t('settings.rate', { currency: invoice.currency })}
          </Label>
          <Input
            id='pay-rate'
            inputMode='decimal'
            dir='ltr'
            className='num w-full'
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      )}

      <PaymentMethodSelect value={method} onChange={setMethod} />

      <ProofPicker file={proof} onChange={setProof} />

      <DialogFooter>
        <Button type='button' variant='ghost' onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <PendingButton
          type='submit'
          disabled={!isValid || isTooLarge}
          isPending={isSaving}
        >
          {t('finance.recordPayment')}
        </PendingButton>
      </DialogFooter>
    </form>
  )
}
