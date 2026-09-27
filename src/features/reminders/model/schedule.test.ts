import { describe, expect, it } from 'vitest'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import { pendingReminders } from './schedule'

type Db = Parameters<typeof pendingReminders>[0]

const invoice = (over: Partial<Invoice> = {}) =>
  ({
    id: 'inv-1',
    number: 'INV-1',
    clientId: 'c1',
    state: 'issued',
    dueOn: '2026-09-10',
    amount: 10000,
    currency: 'SAR',
    rateToBase: 1,
    baseAmount: 10000,
    ...over,
  }) as Invoice

const db = (over: Partial<Db> = {}): Db => ({
  settings: { reminderOffsets: [0, 7, 14], dueSoonDays: 7 },
  invoices: [invoice()],
  payments: [],
  engagements: [],
  cycles: [],
  leads: [],
  importantDates: [],
  ownSubscriptions: [],
  reminderLog: [],
  ...over,
})

describe('pendingReminders', () => {
  it('asks nothing before the due date', () => {
    expect(pendingReminders(db(), '2026-09-09')).toEqual([])
  })

  it('asks the latest reached offset only', () => {
    const [first] = pendingReminders(db(), '2026-09-18')
    expect(first).toMatchObject({ kind: 'invoice_due', offsetDays: 7 })
  })

  it('stops once decided, until the next offset is reached', () => {
    const reminderLog: Db['reminderLog'] = [
      {
        kind: 'invoice_due',
        targetId: 'inv-1',
        occurrenceOn: '2026-09-10',
        offsetDays: 7,
        action: 'sent',
        createdAt: '2026-09-17T10:00:00Z',
      },
    ]
    expect(pendingReminders(db({ reminderLog }), '2026-09-18')).toEqual([])
    const [next] = pendingReminders(db({ reminderLog }), '2026-09-24')
    expect(next).toMatchObject({ offsetDays: 14 })
  })

  it('stops for a paid invoice', () => {
    const payments = [
      {
        id: 'p1',
        invoiceId: 'inv-1',
        status: 'confirmed',
        appliedAmount: 10000,
      },
    ] as Db['payments']
    expect(pendingReminders(db({ payments }), '2026-09-30')).toEqual([])
  })

  it('reminds of an important date its lead time before, until handled', () => {
    const date = {
      id: 'd1',
      title: 'Domain',
      kind: 'domain' as const,
      dueOn: '2026-10-10',
      recurrence: 'yearly' as const,
      remindDaysBefore: 14,
    }
    const base = db({ invoices: [], importantDates: [date] })
    expect(pendingReminders(base, '2026-09-25')).toEqual([])
    expect(pendingReminders(base, '2026-09-26')[0]).toMatchObject({
      kind: 'important_date',
      offsetDays: -14,
    })
    const handled = db({
      invoices: [],
      importantDates: [{ ...date, handledOn: '2026-09-27' }],
    })
    expect(pendingReminders(handled, '2026-10-01')).toEqual([])
  })
})
