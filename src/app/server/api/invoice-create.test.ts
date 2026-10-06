import { addDaysIso, isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())

const MANUAL = {
  clientId: 'c-nakhla',
  items: [
    { description: 'Logo refresh', quantity: 1, unitPriceMinor: 150_000 },
    { description: 'Social templates', quantity: 3, unitPriceMinor: 20_000 },
  ],
  note: 'Thank you!',
}

describe('manual invoices', () => {
  it('issues an invoice in the client currency with numbered lines', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/invoices', MANUAL)
    expect(res.status).toBe(201)
    expect(res.json.data.number).toMatch(/^INV-\d{4}-\d{3}$/)

    const snap = await t.snapshot()
    const invoice = snap.invoices.find((i) => i.id === res.json.data.id)
    expect(invoice).toMatchObject({
      state: 'issued',
      kind: 'standard',
      clientId: 'c-nakhla',
      currency: 'SAR',
      amount: 210_000,
      issueOn: today,
      note: 'Thank you!',
    })
    const lines = snap.invoiceItems.filter((i) => i.invoiceId === invoice!.id)
    expect(lines.map((l) => l.amount)).toEqual([150_000, 60_000])
    expect(lines.every((l) => l.sourceKind === 'manual')).toBe(true)
  })

  it('numbers consecutive invoices in sequence', async () => {
    t = createTestApp()
    const a = await t.call('POST', '/invoices', MANUAL)
    const b = await t.call('POST', '/invoices', MANUAL)
    const seq = (n: unknown) => Number(String(n).slice(-3))
    expect(seq(b.json.data.number)).toBe(seq(a.json.data.number) + 1)
  })

  it('uses the chosen due date', async () => {
    t = createTestApp()
    const dueOn = addDaysIso(today, 30)
    const res = await t.call('POST', '/invoices', { ...MANUAL, dueOn })
    const invoice = (await t.snapshot()).invoices.find(
      (i) => i.id === res.json.data.id
    )
    expect(invoice?.dueOn).toBe(dueOn)
  })

  it('rejects a due date before today', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/invoices', {
      ...MANUAL,
      dueOn: addDaysIso(today, -1),
    })
    expect(res.status).toBe(422)
    expect(res.json.error?.code).toBe('due_in_past')
  })

  it('refuses an engagement of another client', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/invoices', {
      ...MANUAL,
      engagementId: 'e-masar',
    })
    expect(res.status).toBe(422)
    expect(res.json.error?.code).toBe('engagement_mismatch')
  })

  it('rejects an invoice without lines', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/invoices', { ...MANUAL, items: [] })
    expect(res.status).toBe(400)
  })
})

describe('voiding invoices', () => {
  it('voids an unpaid invoice with its reason', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/invoices', MANUAL)
    const res = await t.call('POST', `/invoices/${json.data.id}/void`, {
      reason: 'Issued to the wrong client',
    })
    expect(res.status).toBe(200)
    const invoice = (await t.snapshot()).invoices.find(
      (i) => i.id === json.data.id
    )
    expect(invoice?.state).toBe('void')
  })

  it('refuses to void an invoice that has payments', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/invoices', MANUAL)
    await t.call('POST', `/invoices/${json.data.id}/payments`, {
      amountMinor: 10_000,
      rateToBase: 1,
      method: 'bank',
    })
    const res = await t.call('POST', `/invoices/${json.data.id}/void`, {
      reason: 'Mistake',
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('invoice_has_payments')
  })

  it('frees billed revision rounds so they can be billed again', async () => {
    t = createTestApp()
    const billed = await t.call('POST', '/deliverables/dl-2/bill-overage')
    const res = await t.call('POST', `/invoices/${billed.json.data.id}/void`, {
      reason: 'Wrong quantity',
    })
    expect(res.status).toBe(200)
    const again = await t.call('POST', '/deliverables/dl-2/bill-overage')
    expect(again.status).toBe(201)
  })

  it('undoes a renewal: the new cycle goes, the old one reopens', async () => {
    t = createTestApp()
    const before = (await t.snapshot()).cycles.filter(
      (c) => c.engagementId === 'e-souq'
    )
    const renewal = await t.call('POST', '/engagements/e-souq/renew')
    const res = await t.call('POST', `/invoices/${renewal.json.data.id}/void`, {
      reason: 'Renewed by mistake',
    })
    expect(res.status).toBe(200)

    const db = await t.snapshot()
    const cycles = db.cycles.filter((c) => c.engagementId === 'e-souq')
    expect(cycles).toHaveLength(before.length)
    const reopened = cycles.find((c) => c.decision === 'pending')!
    expect(reopened.renewalInvoiceId).toBeUndefined()
    expect(reopened.seq).toBe(Math.max(...before.map((c) => c.seq)))
    expect(db.invoices.find((i) => i.id === renewal.json.data.id)?.state).toBe(
      'void'
    )
    // It can be renewed again, with the same cycle number.
    const again = await t.call('POST', '/engagements/e-souq/renew')
    expect(again.status).toBe(201)
  })

  it('refuses to undo a renewal once the next cycle was renewed too', async () => {
    t = createTestApp()
    const first = await t.call('POST', '/engagements/e-souq/renew')
    await t.call('POST', '/engagements/e-souq/renew')
    const res = await t.call('POST', `/invoices/${first.json.data.id}/void`, {
      reason: 'Too late',
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('renewal_superseded')
  })

  it('refuses to void twice', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/invoices', MANUAL)
    const body = { reason: 'Duplicate' }
    await t.call('POST', `/invoices/${json.data.id}/void`, body)
    const res = await t.call('POST', `/invoices/${json.data.id}/void`, body)
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('invoice_not_open')
  })
})
