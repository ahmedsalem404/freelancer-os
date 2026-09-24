export const EXPENSE_CATEGORIES = [
  'software',
  'equipment',
  'contractors',
  'marketing',
  'subscription',
  'other',
] as const
export const SUBSCRIPTION_PERIODS = ['monthly', 'yearly'] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type SubscriptionPeriod = (typeof SUBSCRIPTION_PERIODS)[number]
