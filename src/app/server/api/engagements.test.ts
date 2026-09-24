import { afterEach, describe, expect, it } from 'vitest'
import { engagementCurrentValue } from '@/features/engagements/model/guard'
import { exchangeRates } from '@/features/rates/server/rates.table'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const year = new Date().getFullYear()

describe('deliverables', () => {
  it('numbers feedback rounds and records approvals', async () => {
    t = createTestApp()
    const round = await t.call('POST', '/deliverables/dl-1/rounds', {
      note: 'Bigger logo',
    })
    expect(round.json.data).toEqual({ roundNo: 3 })
    await t.call('POST', '/deliverables/dl-2/approval', { source: 'owner' })

    const db = await t.snapshot()
    expect(db.rounds.filter((r) => r.deliverableId === 'dl-1')).toHaveLength(3)
    expect(db.approvals).toContainEqual(
      expect.objectContaining({ deliverableId: 'dl-2', decision: 'approved' })
    )
  })

  it('bills out-of-scope rounds once, with the next invoice number', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/deliverables/dl-2/bill-overage')
    expect(res.status).toBe(201)
    expect(res.json.data.number).toBe(`INV-${year}-018`)

    const db = await t.snapshot()
    const invoiceId = String(res.json.data.id)
    const [line] = db.invoiceItems.filter((i) => i.invoiceId === invoiceId)
    expect(line).toMatchObject({ sourceKind: 'revision_overage', quantity: 1 })
    expect(db.rounds.find((r) => r.id === 'r-dl-2-3')?.invoiceItemId).toBe(
      line.id
    )
    expect(db.settings.invoiceSeqNext).toBe(19)

    const again = await t.call('POST', '/deliverables/dl-2/bill-overage')
    expect(again.status).toBe(409)
    expect(again.json.error?.code).toBe('nothing_to_bill')
  })
})

describe('change scope', () => {
  it('adds a billed deliverable and raises the contract value', async () => {
    t = createTestApp()
    const before = await t.snapshot()
    const e = before.engagements.find((x) => x.id === 'e-nakhla')!
    const res = await t.call('POST', '/engagements/e-nakhla/scope', {
      title: 'Menu design',
      feeMinor: 80000,
      dueOn: '2030-01-10',
    })
    expect(res.status).toBe(201)

    const after = await t.snapshot()
    const added = after.deliverables.find((d) => d.title === 'Menu design')
    expect(added).toMatchObject({ origin: 'change_scope', dueOn: '2030-01-10' })
    expect(
      after.invoiceItems.find((i) => i.id === added?.invoiceItemId)
    ).toMatchObject({ sourceKind: 'scope_change', deliverableId: added?.id })
    expect(engagementCurrentValue(after, e)).toBe(
      engagementCurrentValue(before, e) + 80000
    )
  })

  it('refuses non-projects and rolls back when billing fails midway', async () => {
    t = createTestApp()
    const body = { title: 'X', feeMinor: 100, dueOn: '2030-01-10' }
    const retainer = await t.call('POST', '/engagements/e-masar/scope', body)
    expect(retainer.status).toBe(409)

    // No exchange rate → the invoice step throws after the deliverable insert.
    t.db.delete(exchangeRates).run()
    const before = (await t.snapshot()).deliverables.length
    const res = await t.call('POST', '/engagements/e-nakhla/scope', body)
    expect(res.json.error?.code).toBe('rate_missing')
    expect((await t.snapshot()).deliverables).toHaveLength(before)
  })
})

describe('subscription cycles', () => {
  it('renews: closes the cycle, opens the next, bills the new one', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements/e-souq/renew')
    expect(res.status).toBe(201)

    const db = await t.snapshot()
    const cycles = db.cycles.filter((c) => c.engagementId === 'e-souq')
    const old = cycles.find((c) => c.decision === 'renewed')!
    const next = cycles.find((c) => c.decision === 'pending')!
    expect(old.renewalInvoiceId).toBe(res.json.data.id)
    expect(next).toMatchObject({ seq: old.seq + 1, startsOn: old.endsOn })
    const line = db.invoiceItems.find((i) => i.invoiceId === res.json.data.id)
    expect(line).toMatchObject({ sourceKind: 'renewal', cycleId: next.id })
  })

  it('grants grace, validates the days, then stops', async () => {
    t = createTestApp()
    const bad = await t.call('POST', '/engagements/e-masar-saas/grace', {
      days: 0,
    })
    expect(bad.status).toBe(400)
    await t.call('POST', '/engagements/e-masar-saas/grace', { days: 5 })
    let db = await t.snapshot()
    expect(
      db.cycles.find((c) => c.engagementId === 'e-masar-saas')
    ).toMatchObject({ decision: 'grace', graceExtendedDays: 5 })

    await t.call('POST', '/engagements/e-masar-saas/stop')
    db = await t.snapshot()
    expect(db.engagements.find((e) => e.id === 'e-masar-saas')?.status).toBe(
      'paused'
    )
    expect(
      db.cycles.find((c) => c.engagementId === 'e-masar-saas')?.decision
    ).toBe('stopped')
  })
})

describe('stages', () => {
  it('toggles a stage done and back', async () => {
    t = createTestApp()
    const done = await t.call('POST', '/stages/s3/toggle')
    expect(done.json.data.completedAt).toEqual(expect.any(String))
    const undone = await t.call('POST', '/stages/s3/toggle')
    expect(undone.json.data.completedAt).toBeNull()
  })
})
