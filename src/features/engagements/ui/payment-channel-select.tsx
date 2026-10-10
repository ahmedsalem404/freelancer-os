import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_CHANNELS, type PaymentChannel } from '../model/enums'

/** "Not set" in the select (Radix needs a non-empty value). */
const NONE = 'none'

type Props = {
  id: string
  value: PaymentChannel | undefined
  onChange: (value: PaymentChannel | undefined) => void
}

/** How the client agreed to pay: cash or a transfer through one of the banks. */
export function PaymentChannelSelect({ id, value, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{t('engagements.form.paymentChannel')}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(v) =>
          onChange(v === NONE ? undefined : (v as PaymentChannel))
        }
      >
        <SelectTrigger id={id} className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            {t('engagements.form.noChannel')}
          </SelectItem>
          {PAYMENT_CHANNELS.map((c) => (
            <SelectItem key={c} value={c}>
              {t(`channels.${c}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
