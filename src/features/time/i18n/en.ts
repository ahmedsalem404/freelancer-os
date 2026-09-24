import type { Widen } from '@/shared/i18n/widen'
import type { timeAr } from './ar'

export const timeEn: Widen<typeof timeAr> = {
  time: {
    title: 'Time',
    subtitle: 'What does each client really cost you?',
    week: 'Last 7 days',
    billableShare: 'Billable share',
    byEngagement: 'By engagement',
    entries: 'Logged sessions',
    general: 'General work',
    hoursShort: '{{h}}h',
  },
}
