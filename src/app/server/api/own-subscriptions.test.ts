import { addDaysIso, isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())

const FIGMA = {
  name: 'Figma',
  vendor: 'Figma Inc.',
  amountMinor: 1_500,
  currency: 'USD',
  period: 'monthly',
  nextRenewalOn: addDaysIso(today, 10),
  remindDaysBefore: 5,
}

async function subById(id: unknown) {
  return (await t.snapshot()).ownSubscriptions.find((s) => s.id === id)
}

describe('own subscriptions', () => {
  it('adds a subscription at today’s rate', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/own-subscriptions', FIGMA)
    expect(res.status).toBe(201)
    const sub = await subById(res.json.data.id)
    expect(sub).toMatchObject({
      name: 'Figma',
      vendor: 'Figma Inc.',
      amount: 1_500,
      currency: 'USD',
      period: 'monthly',
      remindDaysBefore: 5,
    })
    expect(sub?.baseAmount).toBe(Math.round(1_500 * sub!.rateToBase))
  })

  it('edits a subscription and keeps its rate in the same currency', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/own-subscriptions', FIGMA)
    const before = await subById(json.data.id)
    const res = await t.call('PUT', `/own-subscriptions/${json.data.id}`, {
      ...FIGMA,
      name: 'Figma Pro',
      amountMinor: 2_000,
      period: 'yearly',
    })
    expect(res.status).toBe(200)
    const after = await subById(json.data.id)
    expect(after).toMatchObject({
      name: 'Figma Pro',
      amount: 2_000,
      period: 'yearly',
      rateToBase: before!.rateToBase,
    })
  })

  it('cancels a subscription: it leaves the list', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/own-subscriptions', FIGMA)
    const res = await t.call(
      'POST',
      `/own-subscriptions/${json.data.id}/cancel`
    )
    expect(res.status).toBe(200)
    expect(await subById(json.data.id)).toBeUndefined()
  })

  it('deletes a subscription added by mistake', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/own-subscriptions', FIGMA)
    const res = await t.call('DELETE', `/own-subscriptions/${json.data.id}`)
    expect(res.status).toBe(200)
    expect(await subById(json.data.id)).toBeUndefined()
  })

  it('refuses to delete a subscription with recorded charges', async () => {
    t = createTestApp()
    const res = await t.call('DELETE', '/own-subscriptions/os1')
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('subscription_in_use')
  })

  it('rejects a subscription without an amount', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/own-subscriptions', {
      ...FIGMA,
      amountMinor: 0,
    })
    expect(res.status).toBe(400)
  })
})
