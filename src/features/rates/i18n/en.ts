import type { Widen } from '@/shared/i18n/widen'
import type { ratesAr } from './ar'

export const ratesEn: Widen<typeof ratesAr> = {
  rates: {
    title: "Today's rate",
    hint: "Type today's market rate. It prefills every new invoice and payment; older records keep the rate of their day.",
    sar: '1 SAR =',
    usd: '1 USD =',
    derived: '1 USD in SAR =',
    save: "Save today's rate",
    saved: "Today's rate saved",
    invalid: 'Enter numbers greater than zero',
    stale: 'Not updated today',
    history: 'Recent rates (in YER)',
    day: 'Day',
    converter: 'Convert an amount',
    amount: 'Amount',
    yerPerSar: '1 SAR in YER',
  },
}
