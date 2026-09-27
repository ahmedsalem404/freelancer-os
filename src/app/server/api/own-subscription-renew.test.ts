import { addDaysIso, addMonthsIso, isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())
const renewsOn = addDaysIso(today, 3)

describe('own subscription renewal', () => {
  it('records the charge as an expense and moves the renewal one period', async () => {
    t = createTestApp()
    const added = await t.call('POST', '/own-subscriptions', {
      name: 'Figma',
      amountMinor: 1_500,
      currency: 'USD',
      period: 'monthly',
      nextRenewalOn: renewsOn,
      remindDaysBefore: 5,
    })
    const id = String(added.json.data.id)

    const res = await t.call('POST', `/own-subscriptions/${id}/renew`)
    expect(res.status).toBe(200)

    const snap = await t.snapshot()
    expect(snap.ownSubscriptions.find((s) => s.id === id)?.nextRenewalOn).toBe(
      addMonthsIso(renewsOn, 1)
    )
    expect(snap.expenses).toContainEqual(
      expect.objectContaining({
        title: 'Figma',
        category: 'subscription',
        amount: 1_500,
        currency: 'USD',
        spentOn: renewsOn,
      })
    )
  })

  it('never charges the same period twice', async () => {
    t = createTestApp()
    const added = await t.call('POST', '/own-subscriptions', {
      name: 'Host',
      amountMinor: 9_900,
      currency: 'SAR',
      period: 'yearly',
      nextRenewalOn: renewsOn,
      remindDaysBefore: 5,
    })
    const id = String(added.json.data.id)
    await t.call('POST', `/own-subscriptions/${id}/renew`)
    // Put the renewal back on the charged day, as a stale second tab would.
    const sub = (await t.snapshot()).ownSubscriptions.find((s) => s.id === id)!
    await t.call('PUT', `/own-subscriptions/${id}`, {
      name: sub.name,
      amountMinor: sub.amount,
      currency: sub.currency,
      period: sub.period,
      nextRenewalOn: renewsOn,
      remindDaysBefore: sub.remindDaysBefore,
    })
    const again = await t.call('POST', `/own-subscriptions/${id}/renew`)
    expect(again.status).toBe(409)
    expect(again.json.error?.code).toBe('already_charged')
  })
})
