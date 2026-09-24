import type { Widen } from '@/shared/i18n/widen'
import type { pricingAr } from './ar'

export const pricingEn: Widen<typeof pricingAr> = {
  pricing: {
    title: 'Pricing',
    subtitle: 'Know your rate before you say “okay”.',
    baseline: 'Annual baseline',
    income: 'Target yearly take-home',
    hoursWeek: 'Billable hours per week',
    weeksOff: 'Weeks off',
    monthlyCosts: 'Monthly costs',
    tax: 'Tax reserve %',
    profit: 'Profit margin %',
    hourly: 'Reference hourly rate',
    daily: 'Day rate',
    monthlyTarget: 'Monthly income target',
    shouldAccept: 'Should I take this project?',
    offer: 'Offered amount',
    effort: 'Expected hours',
    effective: 'Your effective hourly rate',
    verdictGood: 'Take it — above your reference rate',
    verdictOk: 'Acceptable — close to your rate',
    verdictBad: 'Negotiate or decline — {{pct}}% below your rate',
    suggested: 'Suggested price for this effort',
  },
}
