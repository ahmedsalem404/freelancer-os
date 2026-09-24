import type { Widen } from '@/shared/i18n/widen'
import type { calendarAr } from './ar'

export const calendarEn: Widen<typeof calendarAr> = {
  calendar: {
    title: 'Calendar',
    subtitle: 'Deliverables, renewals and domains in one place.',
    kinds: {
      deliverable: 'Delivery',
      renewal: 'Subscription renewal',
      invoice: 'Invoice due',
      domain: 'Domain',
      ssl: 'SSL',
      license: 'License',
      hosting: 'Hosting',
      other: 'Date',
    },
    nothing: 'Nothing scheduled this day',
    prev: 'Previous month',
    next: 'Next month',
  },
}
