import { ChoiceRow } from '@/shared/components/choice-row'
import { TextField } from '@/shared/components/text-field'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { CURRENCIES } from '@/shared/money/currency'
import { useTranslation } from 'react-i18next'
import { SUBSCRIPTION_PERIODS } from '../model/enums'
import type {
  SetSubscriptionField,
  SubscriptionFormValues,
} from './subscription-form-state'

export function SubscriptionFormFields({
  form,
  set,
}: {
  form: SubscriptionFormValues
  set: SetSubscriptionField
}) {
  const { t } = useTranslation()
  const { positive } = useFieldErrors()
  return (
    <>
      <TextField
        id='sub-name'
        label={t('finance.subForm.name')}
        value={form.name}
        onChange={set('name')}
      />
      <TextField
        id='sub-vendor'
        label={t('finance.subForm.vendor')}
        value={form.vendor}
        onChange={set('vendor')}
      />
      <ChoiceRow
        label={t('finance.subForm.period')}
        options={SUBSCRIPTION_PERIODS}
        value={form.period}
        onChange={set('period')}
        labelOf={(v) => t(`finance.subForm.${v}`)}
      />
      <div className='grid grid-cols-2 gap-3'>
        <TextField
          id='sub-amount'
          label={t('finance.subForm.amount')}
          dir='ltr'
          inputMode='decimal'
          className='num'
          value={form.amount}
          onChange={set('amount')}
          error={positive(form.amount)}
        />
        <TextField
          id='sub-renewal'
          label={t('finance.subForm.nextRenewalOn')}
          type='date'
          dir='ltr'
          value={form.nextRenewalOn}
          onChange={set('nextRenewalOn')}
        />
      </div>
      <ChoiceRow
        label={t('finance.subForm.currency')}
        options={CURRENCIES}
        value={form.currency}
        onChange={set('currency')}
        labelOf={(c) => c}
      />
      <TextField
        id='sub-remind'
        label={t('finance.subForm.remindDays')}
        dir='ltr'
        inputMode='numeric'
        className='num'
        value={form.remindDays}
        onChange={set('remindDays')}
      />
    </>
  )
}
