import { useDb } from '@/app/client/snapshot-query'
import { MissingFields } from '@/shared/components/missing-fields'
import { TextField } from '@/shared/components/text-field'
import { isArchived } from '@/shared/model/archive'
import type { Currency } from '@/shared/money/currency'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Money } from '@/features/rates/ui/money'
import { InvoiceLinesEditor } from './invoice-lines-editor'
import type { LineDraft } from './line-draft'

/** "No engagement" in the select (Radix needs a non-empty value). */
export const NO_ENGAGEMENT = 'none'

export type InvoiceDraft = {
  clientId: string
  engagementId: string
  lines: LineDraft[]
  dueOn: string
  note: string
}

type Props = {
  draft: InvoiceDraft
  onChange: (patch: Partial<InvoiceDraft>) => void
  currency: Currency | undefined
  total: number
}

/** The editable part of a new manual invoice. */
export function InvoiceFormFields({ draft, onChange, currency, total }: Props) {
  const { t } = useTranslation()
  const db = useDb()
  const engagements = db.engagements.filter(
    (e) => e.clientId === draft.clientId && !isArchived(e)
  )

  return (
    <>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='grid gap-2'>
          <Label htmlFor='invoice-client'>{t('common.client')}</Label>
          <Select
            value={draft.clientId}
            onValueChange={(clientId) =>
              onChange({ clientId, engagementId: NO_ENGAGEMENT })
            }
          >
            <SelectTrigger id='invoice-client' className='w-full'>
              <SelectValue placeholder={t('engagements.form.pickClient')} />
            </SelectTrigger>
            <SelectContent>
              {db.clients
                .filter((c) => !isArchived(c))
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company ?? c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='invoice-engagement'>
            {t('invoice.form.engagement')}
          </Label>
          <Select
            value={draft.engagementId}
            onValueChange={(engagementId) => onChange({ engagementId })}
            disabled={engagements.length === 0}
          >
            <SelectTrigger id='invoice-engagement' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ENGAGEMENT}>
                {t('invoice.form.noEngagement')}
              </SelectItem>
              {engagements.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <InvoiceLinesEditor
        lines={draft.lines}
        currency={currency ?? '—'}
        onChange={(lines) => onChange({ lines })}
      />
      <div className='grid gap-3 sm:grid-cols-2'>
        <TextField
          id='invoice-due'
          label={t('invoice.dueDate')}
          type='date'
          dir='ltr'
          value={draft.dueOn}
          onChange={(dueOn) => onChange({ dueOn })}
          hint={t('invoice.form.dueHint')}
        />
        <div className='grid content-start gap-1 sm:text-end'>
          <span className='text-sm text-muted-foreground'>
            {t('invoice.total')}
          </span>
          {currency ? (
            <Money
              amount={total}
              currency={currency}
              className='text-xl font-semibold'
            />
          ) : (
            <span className='text-xl font-semibold'>—</span>
          )}
        </div>
      </div>
      <TextField
        id='invoice-note'
        label={t('invoice.form.note')}
        value={draft.note}
        onChange={(note) => onChange({ note })}
        isMultiline
      />
      <MissingFields
        fields={[
          !draft.clientId && t('common.client'),
          total <= 0 && t('invoice.form.lines'),
        ]}
      />
    </>
  )
}
