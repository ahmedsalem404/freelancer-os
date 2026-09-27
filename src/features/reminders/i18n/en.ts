import type { Widen } from '@/shared/i18n/widen'
import type { remindersAr } from './ar'

export const remindersEn: Widen<typeof remindersAr> = {
  reminders: {
    title: 'Reminders',
    none: 'No reminders today.',
    send: 'Send on WhatsApp',
    dismiss: 'Dismiss',
    dismissed: 'Reminder dismissed',
    renewed: 'Renewed',
    sent: 'Sent',
    invoice: 'Invoice {{number}}',
    renewal: 'Renew {{name}}',
    lead: 'Follow up {{name}}',
    own: 'Your tool: {{name}}',
    kinds: {
      invoice_due: 'Payment due',
      subscription_renewal: 'Client subscription renewal',
      important_date: 'Key date',
      lead_follow_up: 'Lead follow-up',
      own_subscription: 'Your tool renews',
    },
  },
}
