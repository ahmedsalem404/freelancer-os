import { useState } from 'react'
import { toMajor, toMinor } from '@/domain/money'
import { invoiceBalance } from '@/domain/selectors'
import type { Invoice, PaymentMethodKind } from '@/domain/types'
import { useStore } from '@/mock/store'
import { Upload } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const METHODS: PaymentMethodKind[] = ['bank', 'kuraimi', 'usdt', 'cash']

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
  const db = useStore()
  const recordPayment = useStore((s) => s.recordPayment)
  const balance = invoiceBalance(db, invoice)
  const [amount, setAmount] = useState(String(toMajor(balance)))
  // YER is typed the way the market quotes it (1 SAR = ? YER), then inverted.
  const isYer = invoice.currency === 'YER'
  const [rate, setRate] = useState(() =>
    String(
      isYer
        ? db.dailyRates[0].sarInYer
        : Number(db.lastRates[invoice.currency].toFixed(4))
    )
  )
  const [method, setMethod] = useState<PaymentMethodKind>('bank')
  const [proofName, setProofName] = useState<string>()

  const needsRate = invoice.currency !== 'SAR'
  const amountValue = Number(amount)
  const typedRate = Number(rate)
  const rateValue = isYer && typedRate > 0 ? 1 / typedRate : typedRate
  const isValid =
    amountValue > 0 &&
    toMinor(amountValue) <= balance &&
    (!needsRate || rateValue > 0)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    recordPayment(invoice.id, {
      amountMinor: toMinor(amountValue),
      rateToBase: needsRate ? rateValue : 1,
      method,
      proofName,
    })
    toast.success(t('finance.paymentSaved'))
    onDone()
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
          onChange={(e) => setAmount(e.target.value)}
        />
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

      <div className='grid gap-2'>
        <Label>{t('finance.paymentMethod')}</Label>
        <Select
          value={method}
          onValueChange={(v) => setMethod(v as PaymentMethodKind)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`payMethod.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className='flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm hover:bg-accent/40'>
        <Upload className='size-4 text-muted-foreground' />
        <span className='flex-1'>{proofName ?? t('finance.proof')}</span>
        <input
          type='file'
          accept='image/*,application/pdf'
          className='sr-only'
          onChange={(e) => setProofName(e.target.files?.[0]?.name)}
        />
      </label>

      <DialogFooter>
        <Button type='button' variant='ghost' onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' disabled={!isValid}>
          {t('finance.recordPayment')}
        </Button>
      </DialogFooter>
    </form>
  )
}
