import { isoDay } from '@/shared/model/dates'
import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { engagementCycles } from '@/features/engagements/server/cycles.table'
import { createTestApp } from './test-app'

const cycleAmount = (db: ReturnType<typeof createTestApp>['db'], id: string) =>
  db.select().from(engagementCycles).where(eq(engagementCycles.id, id)).get()
    ?.amount

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())

async function openSubscription() {
  const res = await t.call('POST', '/engagements', {
    clientId: 'c-nakhla',
    title: 'Monthly support',
    type: 'subscription',
    amountMinor: 100_000,
    startOn: today,
    cyclePeriod: 'monthly',
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
    const id = await openSubscription()
    const res = await t.call('PUT', `/engagements/${id}/terms`, {
      type: 'subscription',
      amountMinor: 150_000,
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(200)
    expect(res.json.data.appliesToOpenCycle).toBe(true)

    const snap = await t.snapshot()
    expect(snap.engagements.find((e) => e.id === id)).toMatchObject({
      amount: 150_000,
    })
    const cycle = snap.cycles.find((c) => c.engagementId === id)!
    expect(cycleAmount(t.db, cycle.id)).toBe(150_000)
  })

  it('keeps a billed cycle as agreed; new terms start next cycle', async () => {
    t = createTestApp()
    const before = (await t.snapshot()).cycles.find(
      (c) => c.engagementId === 'e-masar' && c.decision === 'pending'
    )!
    const amountBefore = cycleAmount(t.db, before.id)

    const res = await t.call('PUT', '/engagements/e-masar/terms', {
      type: 'subscription',
      amountMinor: 200_000,
      cyclePeriod: 'monthly',
    })
    expect(res.json.data.appliesToOpenCycle).toBe(false)
    const snap = await t.snapshot()
    expect(cycleAmount(t.db, before.id)).toBe(amountBefore)
    expect(snap.engagements.find((e) => e.id === 'e-masar')?.amount).toBe(
      200_000
    )
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
      type: 'subscription',
      amountMinor: 100_000,
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('type_locked')
  })
})
