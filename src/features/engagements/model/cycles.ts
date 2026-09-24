/** Retainer / subscription cycles: usage windows and renewal state. */
import { daysBetween } from '@/shared/model/dates'
import type {
  Invoice,
  InvoiceItem,
} from '@/features/invoices/model/invoice.schema'
import type { TimeEntry } from '@/features/time/model/time.schema'
import type { EngagementCycle } from './engagement.schema'
import type { EngagementStatus } from './enums'

type BilledDb = { invoiceItems: InvoiceItem[]; invoices: Invoice[] }

export function currentCycle(
  db: { cycles: EngagementCycle[] },
  engagementId: string
) {
  return db.cycles
    .filter(
      (c) =>
        c.engagementId === engagementId &&
        (c.decision === 'pending' || c.decision === 'grace')
    )
    .sort((a, b) => b.seq - a.seq)[0]
}

/** Retainer hours consumed inside a cycle window [startsOn, endsOn). */
export function cycleHoursUsed(
  db: { timeEntries: TimeEntry[] },
  engagementId: string,
  cycle: EngagementCycle
) {
  const minutes = db.timeEntries
    .filter(
      (t) =>
        t.engagementId === engagementId &&
        t.countsToAllowance &&
        t.workOn >= cycle.startsOn &&
        t.workOn < cycle.endsOn
    )
    .reduce((s, t) => s + t.minutes, 0)
  return Math.round((minutes / 60) * 10) / 10
}

export function cycleBilledOverage(db: BilledDb, cycleId: string) {
  return db.invoiceItems
    .filter((item) => {
      if (item.cycleId !== cycleId || item.sourceKind !== 'retainer_overage')
        return false
      const invoice = db.invoices.find((i) => i.id === item.invoiceId)
      return invoice?.state !== 'void'
    })
    .reduce((s, i) => s + i.quantity, 0)
}

/** Retainer hours over the cycle allowance, and how many are not invoiced. */
export function retainerOverage(
  db: BilledDb & { timeEntries: TimeEntry[] },
  engagementId: string,
  cycle: EngagementCycle
) {
  const used = cycleHoursUsed(db, engagementId, cycle)
  const overage = Math.max(
    0,
    Math.round((used - cycle.includedUnits) * 10) / 10
  )
  const unbilled = Math.max(0, overage - cycleBilledOverage(db, cycle.id))
  return { used, overage, unbilled }
}

export type SubscriptionState =
  'active' | 'due' | 'grace' | 'lapsed' | Exclude<EngagementStatus, 'active'>

export function subscriptionState(
  cycle: EngagementCycle,
  status: EngagementStatus,
  today: string,
  dueSoonDays: number
): { daysLeft: number; state: SubscriptionState } {
  const daysLeft = daysBetween(today, cycle.endsOn)
  if (status !== 'active') return { daysLeft, state: status }
  const grace = cycle.graceDays + cycle.graceExtendedDays
  if (daysLeft < -grace) return { daysLeft, state: 'lapsed' }
  if (daysLeft < 0) return { daysLeft, state: 'grace' }
  if (daysLeft <= dueSoonDays) return { daysLeft, state: 'due' }
  return { daysLeft, state: 'active' }
}
