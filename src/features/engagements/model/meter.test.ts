import { describe, expect, it } from 'vitest'
import type { Snapshot as Db } from '@/app/client/snapshot.schema'
import { invoiceStatus } from '@/features/invoices/model/invoice-status'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { subscriptionState } from './cycles'
import type { Engagement, EngagementCycle } from './engagement.schema'
import { engagementCurrentValue, revisionGuard, scopeGuard } from './guard'
import { engagementMeter } from './meter'
import type { Deliverable, ReviewRound } from './work.schema'

const emptyDb = (): Db => ({
  dailyRates: [],
  identities: [],
  paymentMethods: [],
  clients: [],
  vault: [],
  leads: [],
  engagements: [],
  cycles: [],
  stages: [],
  deliverables: [],
  rounds: [],
  approvals: [],
  attachments: [],
  invoices: [],
  invoiceItems: [],
  payments: [],
  expenses: [],
  ownSubscriptions: [],
  timeEntries: [],
  importantDates: [],
  tasks: [],
  team: [],
  reflections: [],
  settings: {
    invoicePrefix: 'INV',
    invoiceSeqYear: 2026,
    invoiceSeqNext: 1,
    defaultDueDays: 7,
    reminderOffsets: [0, 7, 14],
    meterNearRatio: 0.8,
    dueSoonDays: 7,
  },
})

const engagement = (over: Partial<Engagement> = {}): Engagement => ({
  id: 'e1',
  clientId: 'c1',
  title: 'Brand',
  type: 'project',
  status: 'active',
  amount: 350000,
  currency: 'SAR',
  rateToBase: 1,
  baseAmount: 350000,
  allowanceUnit: 'revisions',
  allowanceIncluded: 0,
  overageUnitPrice: 15000,
  scopeAgreedDeliverables: 2,
  startOn: '2026-09-01',
  nextAction: '',
  ...over,
})

const deliverable = (id: string, limit = 2): Deliverable => ({
  id,
  engagementId: 'e1',
  title: id,
  dueOn: '2026-09-20',
  revisionLimit: limit,
  origin: 'contract',
  position: 0,
})

const rounds = (deliverableId: string, n: number): ReviewRound[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${deliverableId}-r${i}`,
    deliverableId,
    roundNo: i + 1,
    receivedOn: '2026-09-10',
    note: 'feedback',
    source: 'owner',
  }))

const invoice = (over: Partial<Invoice> = {}): Invoice => ({
  id: 'i1',
  number: 'INV-2026-001',
  state: 'issued',
  kind: 'standard',
  clientId: 'c1',
  billingIdentityId: 'b1',
  issueOn: '2026-09-01',
  dueOn: '2026-09-15',
  amount: 180000,
  currency: 'SAR',
  rateToBase: 1,
  baseAmount: 180000,
  ...over,
})

const pay = (applied: number) => ({
  id: `p${applied}`,
  invoiceId: 'i1',
  amount: applied,
  currency: 'SAR' as const,
  rateToBase: 1,
  baseAmount: applied,
  appliedAmount: applied,
  receivedOn: '2026-09-05',
  method: 'bank' as const,
  status: 'confirmed' as const,
})

describe('invoiceStatus (derived from payments)', () => {
  it('is unpaid with no payments before the due date', () => {
    const db = { ...emptyDb(), invoices: [invoice()] }
    expect(invoiceStatus(db, invoice(), '2026-09-10')).toBe('unpaid')
  })

  it('is partial with some confirmed payment', () => {
    const db = { ...emptyDb(), payments: [pay(90000)] }
    expect(invoiceStatus(db, invoice(), '2026-09-10')).toBe('partial')
  })

  it('is paid once confirmed payments cover the total', () => {
    const db = { ...emptyDb(), payments: [pay(180000)] }
    expect(invoiceStatus(db, invoice(), '2026-10-10')).toBe('paid')
  })

  it('is overdue past the due date when not fully paid', () => {
    const db = { ...emptyDb(), payments: [pay(90000)] }
    expect(invoiceStatus(db, invoice(), '2026-09-16')).toBe('overdue')
  })

  it('ignores pending payments', () => {
    const db = {
      ...emptyDb(),
      payments: [{ ...pay(180000), status: 'pending' as const }],
    }
    expect(invoiceStatus(db, invoice(), '2026-09-10')).toBe('unpaid')
  })

  it('reports draft and void states as-is', () => {
    const db = emptyDb()
    expect(invoiceStatus(db, invoice({ state: 'draft' }), '2026-09-10')).toBe(
      'draft'
    )
    expect(invoiceStatus(db, invoice({ state: 'void' }), '2026-09-10')).toBe(
      'void'
    )
  })
})

describe('revisionGuard', () => {
  it('keeps the next round in scope while under the limit', () => {
    expect(revisionGuard(deliverable('d1'), rounds('d1', 1))).toMatchObject({
      nextRound: 2,
      inScope: true,
      overCount: 0,
    })
  })

  it('flags the next round once the limit is reached', () => {
    expect(revisionGuard(deliverable('d1'), rounds('d1', 2)).inScope).toBe(
      false
    )
  })

  it('counts only unbilled rounds beyond the limit', () => {
    const list = rounds('d1', 4)
    list[2] = { ...list[2], invoiceItemId: 'item-1' }
    expect(revisionGuard(deliverable('d1'), list)).toMatchObject({
      overCount: 2,
      unbilledOver: 1,
    })
  })
})

describe('engagementMeter', () => {
  it('sums revision rounds across deliverables for projects', () => {
    const db = {
      ...emptyDb(),
      deliverables: [deliverable('d1'), deliverable('d2')],
      rounds: [...rounds('d1', 1), ...rounds('d2', 3)],
    }
    expect(engagementMeter(db, engagement(), '2026-09-10')).toMatchObject({
      unit: 'revisions',
      used: 4,
      included: 4,
      overage: 1,
      unbilled: 1,
      state: 'over',
    })
  })

  it('derives retainer hours from time entries inside the current cycle', () => {
    const cycle: EngagementCycle = {
      id: 'cy1',
      engagementId: 'e1',
      seq: 1,
      startsOn: '2026-09-01',
      endsOn: '2026-10-01',
      includedUnits: 10,
      graceDays: 0,
      graceExtendedDays: 0,
      decision: 'pending',
    }
    const entry = (id: string, minutes: number, workOn: string) => ({
      id,
      memberId: 'm1',
      engagementId: 'e1',
      description: '',
      minutes,
      workOn,
      billable: true,
      countsToAllowance: true,
    })
    const db = {
      ...emptyDb(),
      cycles: [cycle],
      timeEntries: [
        entry('t1', 480, '2026-09-05'),
        entry('t2', 300, '2026-09-12'),
        entry('t3', 600, '2026-08-20'), // previous cycle — ignored
      ],
    }
    const e = engagement({ type: 'retainer', allowanceUnit: 'hours' })
    expect(engagementMeter(db, e, '2026-09-15')).toMatchObject({
      used: 13,
      included: 10,
      overage: 3,
      unbilled: 3,
      state: 'over',
    })
  })
})

describe('scope', () => {
  it('reports contract deliverables beyond the agreed scope', () => {
    const db = {
      ...emptyDb(),
      deliverables: [deliverable('d1'), deliverable('d2'), deliverable('d3')],
    }
    expect(scopeGuard(db, engagement())).toMatchObject({
      tracked: 3,
      extras: 1,
    })
  })

  it('adds non-void scope-change lines to the current value', () => {
    const db = {
      ...emptyDb(),
      invoices: [invoice({ id: 'i9', engagementId: 'e1', kind: 'scope' })],
      invoiceItems: [
        {
          id: 'it1',
          invoiceId: 'i9',
          description: 'extra',
          quantity: 1,
          unitPrice: 50000,
          amount: 50000,
          sourceKind: 'scope_change' as const,
        },
      ],
    }
    expect(engagementCurrentValue(db, engagement())).toBe(400000)
  })
})

describe('subscriptionState', () => {
  const cycle: EngagementCycle = {
    id: 'cy',
    engagementId: 'e1',
    seq: 1,
    startsOn: '2026-09-01',
    endsOn: '2026-10-01',
    includedUnits: 30,
    graceDays: 5,
    graceExtendedDays: 0,
    decision: 'pending',
  }

  it('is active with more than the due-soon window left', () => {
    expect(subscriptionState(cycle, 'active', '2026-09-10', 7).state).toBe(
      'active'
    )
  })

  it('is due inside the window', () => {
    expect(subscriptionState(cycle, 'active', '2026-09-26', 7)).toEqual({
      daysLeft: 5,
      state: 'due',
    })
  })

  it('is in grace after the end date', () => {
    expect(subscriptionState(cycle, 'active', '2026-10-03', 7).state).toBe(
      'grace'
    )
  })

  it('counts extended grace days', () => {
    const extended = { ...cycle, graceExtendedDays: 5 }
    expect(subscriptionState(extended, 'active', '2026-10-09', 7).state).toBe(
      'grace'
    )
  })

  it('lapses once all grace is used', () => {
    expect(subscriptionState(cycle, 'active', '2026-10-07', 7).state).toBe(
      'lapsed'
    )
  })

  it('reports a paused engagement as paused', () => {
    expect(subscriptionState(cycle, 'paused', '2026-09-10', 7).state).toBe(
      'paused'
    )
  })
})
