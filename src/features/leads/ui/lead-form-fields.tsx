import { ChoiceRow } from '@/shared/components/choice-row'
import { TextField } from '@/shared/components/text-field'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { CURRENCIES } from '@/shared/money/currency'
import { useTranslation } from 'react-i18next'
import type { LeadFormValues, SetLeadField } from './lead-form-state'

export function LeadFormFields({
  form,
  set,
}: {
  form: LeadFormValues
  set: SetLeadField
}) {
  const { t } = useTranslation()
  const { positive } = useFieldErrors()
  return (
    <>
      <TextField
        id='lead-name'
        label={t('leads.form.name')}
        value={form.name}
        onChange={set('name')}
        autoFocus
      />
      <TextField
        id='lead-company'
        label={t('leads.form.company')}
        value={form.company}
        onChange={set('company')}
      />
      <TextField
        id='lead-whatsapp'
        label='WhatsApp'
        dir='ltr'
        inputMode='numeric'
        className='num'
        placeholder='967771234567'
        value={form.whatsapp}
        onChange={set('whatsapp')}
      />
      <TextField
        id='lead-service'
        label={t('leads.form.service')}
        value={form.service}
        onChange={set('service')}
      />
      <ChoiceRow
        label={t('leads.form.currency')}
        options={CURRENCIES}
        value={form.currency}
        onChange={set('currency')}
        labelOf={(c) => c}
      />
      <div className='grid grid-cols-2 gap-3'>
        <TextField
          id='lead-amount'
          label={`${t('leads.estimate')} (${form.currency})`}
          dir='ltr'
          inputMode='decimal'
          className='num'
          value={form.amount}
          onChange={set('amount')}
          error={form.amount ? positive(form.amount) : undefined}
        />
        <TextField
          id='lead-follow-up'
          label={t('leads.form.followUp')}
          type='date'
          dir='ltr'
          value={form.nextFollowUpOn}
          onChange={set('nextFollowUpOn')}
        />
      </div>
      <TextField
        id='lead-source'
        label={t('leads.source')}
        value={form.source}
        onChange={set('source')}
        placeholder={t('leads.form.sourcePlaceholder')}
      />
      <TextField
        id='lead-notes'
        label={t('leads.form.notes')}
        value={form.notes}
        onChange={set('notes')}
        isMultiline
      />
    </>
  )
}
