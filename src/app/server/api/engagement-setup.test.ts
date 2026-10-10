import { isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())

describe('engagement setup', () => {
  it('opens a project in the client currency and identity', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Menu redesign',
      type: 'project',
      amountMinor: 250_000,
      startOn: today,
    })
    expect(res.status).toBe(201)

    const e = (await t.snapshot()).engagements.find(
      (x) => x.id === res.json.data.id
    )
    expect(e).toMatchObject({
      clientId: 'c-nakhla',
      type: 'project',
      status: 'active',
      amount: 250_000,
      currency: 'SAR',
    })
  })

  it('opens an engagement in another currency with a payment channel', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Dollar job',
      type: 'project',
      amountMinor: 100_000,
      startOn: today,
      currency: 'USD',
      paymentChannel: 'qutaibi',
    })
    expect(res.status).toBe(201)
    const e = (await t.snapshot()).engagements.find(
      (x) => x.id === res.json.data.id
    )
    expect(e).toMatchObject({ currency: 'USD', paymentChannel: 'qutaibi' })
  })

  it('rejects an unknown payment channel', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'X',
      type: 'project',
      amountMinor: 100,
      startOn: today,
      paymentChannel: 'paypal',
    })
    expect(res.status).toBe(400)
  })

  it('changes and clears the payment channel when editing', async () => {
    t = createTestApp()
    const set = await t.call('PUT', '/engagements/e-nakhla', {
      title: 'Brand',
      nextAction: '',
      paymentChannel: 'aden',
    })
    expect(set.status).toBe(200)
    const channel = async () =>
      (await t.snapshot()).engagements.find((e) => e.id === 'e-nakhla')
        ?.paymentChannel
    expect(await channel()).toBe('aden')
    await t.call('PUT', '/engagements/e-nakhla', {
      title: 'Brand',
      nextAction: '',
    })
    expect(await channel()).toBeUndefined()
  })

  it('opens a subscription with its first cycle', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Monthly support',
      type: 'subscription',
      amountMinor: 100_000,
      startOn: today,
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(201)
    const snap = await t.snapshot()
    const cycles = snap.cycles.filter(
      (c) => c.engagementId === res.json.data.id
    )
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toMatchObject({
      seq: 1,
      startsOn: today,
    })
  })

  it('rejects the retired retainer type', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Support',
      type: 'retainer',
      amountMinor: 100_000,
      startOn: today,
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(400)
  })

  it('rejects a subscription without a billing period', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Support',
      type: 'subscription',
      amountMinor: 100_000,
      startOn: today,
    })
    expect(res.status).toBe(400)
  })

  it('answers 404 for an unknown client', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements', {
      clientId: 'c-missing',
      title: 'X',
      type: 'project',
      amountMinor: 1,
      startOn: today,
    })
    expect(res.status).toBe(404)
  })

  it('edits the title and the next action', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/engagements', {
      clientId: 'c-nakhla',
      title: 'Draft',
      type: 'project',
      amountMinor: 1_000,
      startOn: today,
    })
    const res = await t.call('PUT', `/engagements/${json.data.id}`, {
      title: 'Menu redesign v2',
      nextAction: 'Send the first concepts',
      nextActionOn: today,
    })
    expect(res.status).toBe(200)
    const e = (await t.snapshot()).engagements.find(
      (x) => x.id === json.data.id
    )
    expect(e).toMatchObject({
      title: 'Menu redesign v2',
      nextAction: 'Send the first concepts',
      nextActionOn: today,
    })
  })

  it('clears the next action date when left blank', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/engagements/e-masar', {
      title: 'Masar support',
      nextAction: '',
    })
    expect(res.status).toBe(200)
    const e = (await t.snapshot()).engagements.find((x) => x.id === 'e-masar')
    expect(e?.nextActionOn).toBeUndefined()
    expect(e?.nextAction).toBe('')
  })

  it('answers 404 when editing a missing engagement', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/engagements/e-missing', { title: 'X' })
    expect(res.status).toBe(404)
  })
})
