import { addDays, differenceInCalendarWeeks, format, parseISO } from 'date-fns'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { currentCycle } from '@/features/engagements/model/cycles'
import {
  invoiceBalance,
  isOpenInvoice,
} from '@/features/invoices/model/invoice-status'

const FORECAST_WEEKS = 8

export type Week = { label: string; incoming: number; outgoing: number }

export function useFinance() {
  const db = useDb()
  const now = todayIso()
  const monthPrefix = now.slice(0, 7)

  const collected = db.payments
    .filter(
      (p) => p.status === 'confirmed' && p.receivedOn.startsWith(monthPrefix)
    )
    .reduce((s, p) => s + p.baseAmount, 0)
  const receivable = db.invoices
    .filter((i) => isOpenInvoice(db, i, now))
    .reduce((s, i) => s + Math.round(invoiceBalance(db, i) * i.rateToBase), 0)
  // Own-subscription charges are already written as expense rows.
  const spent = db.expenses
    .filter((x) => x.spentOn.startsWith(monthPrefix))
    .reduce((s, x) => s + x.baseAmount, 0)
  const burn = db.ownSubscriptions.reduce(
    (s, sub) =>
      s + (sub.period === 'yearly' ? sub.baseAmount / 12 : sub.baseAmount),
    0
  )

  const weeks: Week[] = Array.from({ length: FORECAST_WEEKS }, (_, i) => ({
    label: format(addDays(parseISO(now), i * 7), 'd/M'),
    incoming: 0,
    outgoing: 0,
  }))
  const add = (iso: string, key: 'incoming' | 'outgoing', base: number) => {
    const w = Math.max(
      0,
      differenceInCalendarWeeks(parseISO(iso), parseISO(now))
    )
    if (w < FORECAST_WEEKS) {
      weeks[w] = { ...weeks[w], [key]: weeks[w][key] + base }
    }
  }
  db.invoices
    .filter((i) => isOpenInvoice(db, i, now))
    .forEach((i) =>
      add(i.dueOn, 'incoming', invoiceBalance(db, i) * i.rateToBase)
    )
  db.engagements
    .filter((e) => e.status === 'active' && e.type !== 'project')
    .forEach((e) => {
      const cycle = currentCycle(db, e.id)
      if (cycle) add(cycle.endsOn, 'incoming', e.baseAmount)
    })
  db.ownSubscriptions.forEach((s) =>
    add(s.nextRenewalOn, 'outgoing', s.baseAmount)
  )

  return { collected, receivable, spent, net: collected - spent, burn, weeks }
}
