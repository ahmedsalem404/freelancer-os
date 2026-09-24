import { daysBetween } from '@/shared/model/dates'
import type {
  Invoice,
  InvoiceItem,
} from '@/features/invoices/model/invoice.schema'
import type { Settings } from '@/features/settings/model/settings.schema'
import type { TimeEntry } from '@/features/time/model/time.schema'
import { currentCycle, retainerOverage } from './cycles'
import type { Engagement, EngagementCycle } from './engagement.schema'
import type { AllowanceUnit } from './enums'
import {
  type MeterState,
  allowanceState,
  deliverablesOf,
  revisionGuard,
  roundsOf,
} from './guard'
import type { Deliverable, ReviewRound } from './work.schema'

export type Meter = {
  unit: AllowanceUnit
  used: number
  included: number
  overage: number
  /** Overage units not yet on an invoice. */
  unbilled: number
  state: MeterState
}

/** The tables the meter reads (rule: selectors take only what they read). */
export type MeterDb = {
  settings: Pick<Settings, 'meterNearRatio'>
  deliverables: Deliverable[]
  rounds: ReviewRound[]
  cycles: EngagementCycle[]
  timeEntries: TimeEntry[]
  invoiceItems: InvoiceItem[]
  invoices: Invoice[]
}

const EMPTY = { used: 0, included: 0, overage: 0, unbilled: 0 } as const

/** One comparable meter per engagement, whatever its type. */
export function engagementMeter(
  db: MeterDb,
  e: Engagement,
  today: string
): Meter {
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
  if (!cycle) return { unit: e.allowanceUnit, ...EMPTY, state: 'ok' }

  if (e.type === 'subscription') {
    const included = daysBetween(cycle.startsOn, cycle.endsOn)
    const used = Math.max(0, daysBetween(cycle.startsOn, today))
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

  const { used, overage, unbilled } = retainerOverage(db, e.id, cycle)
  const included = cycle.includedUnits
  return {
    unit: e.allowanceUnit,
    used,
    included,
    overage,
    unbilled,
    state: allowanceState(included, used, near),
  }
}
