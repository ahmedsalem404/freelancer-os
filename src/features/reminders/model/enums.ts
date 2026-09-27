export const REMINDER_KINDS = [
  'invoice_due',
  'subscription_renewal',
  'important_date',
  'lead_follow_up',
  'own_subscription',
] as const
export const REMINDER_ACTIONS = ['sent', 'dismissed'] as const

export type ReminderKind = (typeof REMINDER_KINDS)[number]
export type ReminderAction = (typeof REMINDER_ACTIONS)[number]
