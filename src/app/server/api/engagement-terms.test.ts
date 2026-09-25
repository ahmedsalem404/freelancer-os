import { isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())
const FULL_DAY = 8 * 60

async function openRetainer() {
  const res = await t.call('POST', '/engagements', {
    clientId: 'c-nakhla',
    title: 'Monthly support',
    type: 'retainer',
    amountMinor: 100_000,
    startOn: today,
    cyclePeriod: 'monthly',
    includedHours: 10,
  })
  return String(res.json.data.id)
}

describe('editing engagement terms', () => {
  it('changes a project value', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/engagements/e-nakhla/terms', {
      type: 'project',
      amountMinor: 600_000,
    })
    expect(res.status).toBe(200)
    const e = (await t.snapshot()).engagements.find((x) => x.id === 'e-nakhla')
    expect(e?.amount).toBe(600_000)
    expect(e?.baseAmount).toBe(Math.round(600_000 * e!.rateToBase))
  })

  it('applies new terms to an open cycle with nothing billed', async () => {
    t = createTestApp()
    const id = await openRetainer()
    const res = await t.call('PUT', `/engagements/${id}/terms`, {
      type: 'retainer',
      amountMinor: 150_000,
      cyclePeriod: 'monthly',
      includedHours: 15,
    })
    expect(res.status).toBe(200)
    expect(res.json.data.appliesToOpenCycle).toBe(true)

    const snap = await t.snapshot()
    expect(snap.engagements.find((e) => e.id === id)).toMatchObject({
      amount: 150_000,
      allowanceIncluded: 15,
    })
    const cycle = snap.cycles.find((c) => c.engagementId === id)
    expect(cycle?.includedUnits).toBe(15)
  })

  it('keeps a billed cycle as agreed; new terms start next cycle', async () => {
    t = createTestApp()
    for (const _ of [1, 2]) {
      await t.call('POST', '/time', {
        engagementId: 'e-masar',
        minutes: FULL_DAY,
        description: 'Migration',
        billable: true,
      })
    }
    await t.call('POST', '/engagements/e-masar/bill-hours')
    const before = (await t.snapshot()).cycles.find(
      (c) => c.engagementId === 'e-masar' && c.decision === 'pending'
    )!

    const res = await t.call('PUT', '/engagements/e-masar/terms', {
      type: 'retainer',
      amountMinor: 200_000,
      cyclePeriod: 'monthly',
      includedHours: 40,
    })
    expect(res.json.data.appliesToOpenCycle).toBe(false)
    const snap = await t.snapshot()
    const cycle = snap.cycles.find((c) => c.id === before.id)
    expect(cycle?.includedUnits).toBe(before.includedUnits)
    expect(
      snap.engagements.find((e) => e.id === 'e-masar')?.allowanceIncluded
    ).toBe(40)
  })

  it('bills the new amount on the next renewal', async () => {
    t = createTestApp()
    await t.call('PUT', '/engagements/e-souq/terms', {
      type: 'subscription',
      amountMinor: 55_000,
      cyclePeriod: 'monthly',
    })
    const renewal = await t.call('POST', '/engagements/e-souq/renew')
    const invoice = (await t.snapshot()).invoices.find(
      (i) => i.id === renewal.json.data.id
    )
    expect(invoice?.amount).toBe(55_000)
  })

  it('keeps the engagement type', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/engagements/e-nakhla/terms', {
      type: 'retainer',
      amountMinor: 100_000,
      cyclePeriod: 'monthly',
      includedHours: 10,
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('type_locked')
  })

  it('rejects a retainer without included hours', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/engagements/e-masar/terms', {
      type: 'retainer',
      amountMinor: 100_000,
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(400)
  })
})
