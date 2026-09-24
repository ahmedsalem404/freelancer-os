/**
 * Derived values — the allowance guard and everything else that is computed,
 * never stored (docs/database.md §4–§5). Pure functions over a Db snapshot,
 * so the backend can run the same logic or its SQL equivalent.
 */
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  AllowanceUnit,
  Approval,
  Attachment,
  BillingIdentity,
  Client,
  DailyReflection,
  Deliverable,
  Engagement,
  EngagementCycle,
  EngagementStatus,
  Expense,
  ImportantDate,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Lead,
  OwnSubscription,
  Payment,
  PaymentMethod,
  ReviewRound,
  Settings,
  Stage,
  Task,
  TeamMember,
  TimeEntry,
  VaultEntry,
} from './types'

export type Db = {
  identities: BillingIdentity[]
  paymentMethods: PaymentMethod[]
  clients: Client[]
  vault: VaultEntry[]
  leads: Lead[]
  engagements: Engagement[]
  cycles: EngagementCycle[]
  stages: Stage[]
  deliverables: Deliverable[]
  rounds: ReviewRound[]
  approvals: Approval[]
  attachments: Attachment[]
  invoices: Invoice[]
  invoiceItems: InvoiceItem[]
  payments: Payment[]
  expenses: Expense[]
  ownSubscriptions: OwnSubscription[]
  timeEntries: TimeEntry[]
  importantDates: ImportantDate[]
  tasks: Task[]
  team: TeamMember[]
  reflections: DailyReflection[]
  settings: Settings
}

const days = (from: string, to: string) =>
  differenceInCalendarDays(parseISO(to), parseISO(from))

// ─── Invoices ───────────────────────────────────────────────

export const itemsOf = (db: Db, invoiceId: string) =>
  db.invoiceItems.filter((i) => i.invoiceId === invoiceId)

export const invoicePaid = (db: Db, invoiceId: string) =>
  db.payments
    .filter((p) => p.invoiceId === invoiceId && p.status === 'confirmed')
    .reduce((sum, p) => sum + p.appliedAmount, 0)

export const invoiceBalance = (db: Db, invoice: Invoice) =>
  Math.max(0, invoice.amount - invoicePaid(db, invoice.id))

export function invoiceStatus(
  db: Db,
  invoice: Invoice,
  today: string
): InvoiceStatus {
  if (invoice.state === 'void') return 'void'
  if (invoice.state === 'draft') return 'draft'
  const paid = invoicePaid(db, invoice.id)
  if (paid >= invoice.amount) return 'paid'
  if (today > invoice.dueOn) return 'overdue'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

/** Issued, not void, not fully paid. */
export const isOpenInvoice = (db: Db, invoice: Invoice, today: string) =>
  ['unpaid', 'partial', 'overdue'].includes(invoiceStatus(db, invoice, today))

// ─── Allowance guard ────────────────────────────────────────

export type MeterState = 'ok' | 'near' | 'over'

export function allowanceState(
  included: number,
  used: number,
  nearRatio: number
): MeterState {
  if (used > included) return 'over'
  if (included > 0 && used / included >= nearRatio) return 'near'
  return 'ok'
}

export const roundsOf = (db: Db, deliverableId: string) =>
  db.rounds
    .filter((r) => r.deliverableId === deliverableId)
    .sort((a, b) => a.roundNo - b.roundNo)

export function revisionGuard(deliverable: Deliverable, rounds: ReviewRound[]) {
  const used = rounds.length
  const nextRound = used + 1
  const limit = deliverable.revisionLimit
  return {
    used,
    limit,
    nextRound,
    inScope: nextRound <= limit,
    overCount: Math.max(0, used - limit),
    unbilledOver: rounds.filter((r) => r.roundNo > limit && !r.invoiceItemId)
      .length,
  }
}

export function deliverableApproval(db: Db, deliverableId: string) {
  const latest = db.approvals
    .filter((a) => a.deliverableId === deliverableId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return latest?.decision === 'approved' ? latest : undefined
}

export const deliverablesOf = (db: Db, engagementId: string) =>
  db.deliverables
    .filter((d) => d.engagementId === engagementId)
    .sort((a, b) => a.position - b.position)

export function scopeGuard(db: Db, engagement: Engagement) {
  const list = deliverablesOf(db, engagement.id)
  const tracked = list.filter((d) => d.origin === 'contract').length
  return {
    agreed: engagement.scopeAgreedDeliverables,
    tracked,
    changeScope: list.length - tracked,
    extras: Math.max(0, tracked - engagement.scopeAgreedDeliverables),
  }
}

/** Contract amount + every non-void scope-change line. */
export function engagementCurrentValue(db: Db, engagement: Engagement) {
  const scopeLines = db.invoiceItems.filter((item) => {
    if (item.sourceKind !== 'scope_change') return false
    const invoice = db.invoices.find((i) => i.id === item.invoiceId)
    return invoice?.engagementId === engagement.id && invoice.state !== 'void'
  })
  return engagement.amount + scopeLines.reduce((s, i) => s + i.amount, 0)
}

export function currentCycle(db: Db, engagementId: string) {
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
  db: Db,
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

export function cycleBilledOverage(db: Db, cycleId: string) {
  return db.invoiceItems
    .filter((item) => {
      if (item.cycleId !== cycleId || item.sourceKind !== 'retainer_overage')
        return false
      const invoice = db.invoices.find((i) => i.id === item.invoiceId)
      return invoice?.state !== 'void'
    })
    .reduce((s, i) => s + i.quantity, 0)
}

export type SubscriptionState =
  | 'active'
  | 'due'
  | 'grace'
  | 'lapsed'
  | Exclude<EngagementStatus, 'active'>

export function subscriptionState(
  cycle: EngagementCycle,
  status: EngagementStatus,
  today: string,
  dueSoonDays: number
): { daysLeft: number; state: SubscriptionState } {
  const daysLeft = days(today, cycle.endsOn)
  if (status !== 'active') return { daysLeft, state: status }
  const grace = cycle.graceDays + cycle.graceExtendedDays
  if (daysLeft < -grace) return { daysLeft, state: 'lapsed' }
  if (daysLeft < 0) return { daysLeft, state: 'grace' }
  if (daysLeft <= dueSoonDays) return { daysLeft, state: 'due' }
  return { daysLeft, state: 'active' }
}

export type Meter = {
  unit: AllowanceUnit
  used: number
  included: number
  overage: number
  /** Overage units not yet on an invoice. */
  unbilled: number
  state: MeterState
}

/** One comparable meter per engagement, whatever its type. */
export function engagementMeter(db: Db, e: Engagement, today: string): Meter {
  const near = db.settings.meterNearRatio

  if (e.type === 'project') {
    const guards = deliverablesOf(db, e.id).map((d) =>
      revisionGuard(d, roundsOf(db, d.id))
    )
    const used = guards.reduce((s, g) => s + g.used, 0)
    const included = guards.reduce((s, g) => s + g.limit, 0)
    const overage = guards.reduce((s, g) => s + g.overCount, 0)
    const unbilled = guards.reduce((s, g) => s + g.unbilledOver, 0)
    const state = overage > 0 ? 'over' : allowanceState(included, used, near)
    return { unit: 'revisions', used, included, overage, unbilled, state }
  }

  const cycle = currentCycle(db, e.id)
  if (!cycle) {
    return {
      unit: e.allowanceUnit,
      used: 0,
      included: 0,
      overage: 0,
      unbilled: 0,
      state: 'ok',
    }
  }

  if (e.type === 'subscription') {
    const included = days(cycle.startsOn, cycle.endsOn)
    const used = Math.max(0, days(cycle.startsOn, today))
    const overage = Math.max(0, used - included)
    return {
      unit: 'days',
      used,
      included,
      overage,
      unbilled: overage,
      state: allowanceState(included, used, near),
    }
  }

  const used = cycleHoursUsed(db, e.id, cycle)
  const included = cycle.includedUnits
  const overage = Math.max(0, Math.round((used - included) * 10) / 10)
  const unbilled = Math.max(0, overage - cycleBilledOverage(db, cycle.id))
  return {
    unit: e.allowanceUnit,
    used,
    included,
    overage,
    unbilled,
    state: allowanceState(included, used, near),
  }
}

// ─── Clients ────────────────────────────────────────────────

export type ClientHealth = 'good' | 'watch' | 'risk'

export function clientHealth(
  db: Db,
  clientId: string,
  today: string
): ClientHealth {
  const overdue = db.invoices.filter(
    (i) =>
      i.clientId === clientId && invoiceStatus(db, i, today) === 'overdue'
  ).length
  const outOfScope = db.engagements
    .filter((e) => e.clientId === clientId)
    .reduce((s, e) => s + engagementMeter(db, e, today).overage, 0)
  if (overdue >= 2) return 'risk'
  if (overdue === 1 || outOfScope >= 3) return 'watch'
  return 'good'
}

export function clientCollectedBase(db: Db, clientId: string) {
  const ids = new Set(
    db.invoices.filter((i) => i.clientId === clientId).map((i) => i.id)
  )
  return db.payments
    .filter((p) => ids.has(p.invoiceId) && p.status === 'confirmed')
    .reduce((s, p) => s + p.baseAmount, 0)
}

/** Outstanding in SAR minor units, using each invoice's own snapshot rate. */
export function clientOutstandingBase(db: Db, clientId: string, today: string) {
  return db.invoices
    .filter((i) => i.clientId === clientId && isOpenInvoice(db, i, today))
    .reduce((s, i) => s + Math.round(invoiceBalance(db, i) * i.rateToBase), 0)
}
