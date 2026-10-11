import { addDaysIso, todayIso } from '@/shared/model/dates'
import { type Currency } from '@/shared/money/currency'
import { toMajor } from '@/shared/money/money'
import { type SubscriptionPeriod } from '../model/enums'
import type { OwnSubscription } from '../model/finance.schema'

/** A new subscription renews in a month by default. */
const DEFAULT_RENEWAL_DAYS = 30
const DEFAULT_REMIND_DAYS = '3'

/** The dialog's field state: amount and reminder days stay strings until validated. */
export type SubscriptionFormValues = {
  name: string
  vendor: string
  amount: string
  currency: Currency
  period: SubscriptionPeriod
  nextRenewalOn: string
  remindDays: string
}

export type SetSubscriptionField = <K extends keyof SubscriptionFormValues>(
  key: K
) => (value: SubscriptionFormValues[K]) => void

export function initialSubscriptionForm(
  s?: OwnSubscription
): SubscriptionFormValues {
  return {
    name: s?.name ?? '',
    vendor: s?.vendor ?? '',
    amount: s ? String(toMajor(s.amount)) : '',
    currency: s?.currency ?? 'USD',
    period: s?.period ?? 'monthly',
    nextRenewalOn:
      s?.nextRenewalOn ?? addDaysIso(todayIso(), DEFAULT_RENEWAL_DAYS),
    remindDays: s ? String(s.remindDaysBefore) : DEFAULT_REMIND_DAYS,
  }
}
