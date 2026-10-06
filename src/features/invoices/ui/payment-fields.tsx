import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from '@/features/files'
import type { PaymentMethodKind } from '@/features/settings/model/enums'

const METHODS: PaymentMethodKind[] = ['bank', 'kuraimi', 'usdt', 'cash']

type MethodProps = {
  value: PaymentMethodKind
  onChange: (method: PaymentMethodKind) => void
}

/** How the money arrived. */
export function PaymentMethodSelect({ value, onChange }: MethodProps) {
  const { t } = useTranslation()
  return (
    <div className='grid gap-2'>
      <Label>{t('finance.paymentMethod')}</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as PaymentMethodKind)}
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
  )
}

type ProofProps = {
  file: File | undefined
  onChange: (file: File | undefined) => void
}

/** An optional receipt or transfer screenshot for the payment. */
export function ProofPicker({ file, onChange }: ProofProps) {
  const { t } = useTranslation()
  return (
    <>
      <label className='flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm hover:bg-accent/40'>
        <Upload className='size-4 text-muted-foreground' />
        <span className='min-w-0 flex-1 truncate'>
          {file?.name ?? t('finance.proof')}
        </span>
        <input
          type='file'
          accept={UPLOAD_ACCEPT}
          className='sr-only'
          onChange={(e) => onChange(e.target.files?.[0])}
        />
      </label>
      {(file?.size ?? 0) > MAX_UPLOAD_BYTES && (
        <p className='text-xs text-destructive'>{t('files.tooLarge')}</p>
      )}
    </>
  )
}
