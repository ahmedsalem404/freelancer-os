import { isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())

const HOSTING = {
  title: 'VPS hosting',
  category: 'software',
  amountMinor: 1_200,
  currency: 'USD',
  spentOn: today,
  vendor: 'Hetzner',
  note: 'For the Masar project',
}

async function expenseById(id: unknown) {
  return (await t.snapshot()).expenses.find((x) => x.id === id)
}

describe('expenses', () => {
  it('records an expense with the daily rate snapshot', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/expenses', HOSTING)
    expect(res.status).toBe(201)

    const x = await expenseById(res.json.data.id)
    expect(x).toMatchObject({
      title: 'VPS hosting',
      category: 'software',
      amount: 1_200,
      currency: 'USD',
      vendor: 'Hetzner',
      note: 'For the Masar project',
    })
    expect(x!.rateToBase).toBeGreaterThan(1)
    expect(x!.baseAmount).toBe(Math.round(1_200 * x!.rateToBase))
  })

  it('keeps SAR expenses at rate 1', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/expenses', {
      ...HOSTING,
      currency: 'SAR',
    })
    const x = await expenseById(res.json.data.id)
    expect(x).toMatchObject({ rateToBase: 1, baseAmount: 1_200 })
  })

  it('edits an expense and keeps its rate while the currency stays', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/expenses', HOSTING)
    const before = await expenseById(json.data.id)

    const res = await t.call('PUT', `/expenses/${json.data.id}`, {
      ...HOSTING,
      title: 'VPS hosting (yearly)',
      amountMinor: 12_000,
      vendor: '',
    })
    expect(res.status).toBe(200)
    const after = await expenseById(json.data.id)
    expect(after).toMatchObject({
      title: 'VPS hosting (yearly)',
      amount: 12_000,
      rateToBase: before!.rateToBase,
      baseAmount: Math.round(12_000 * before!.rateToBase),
    })
    expect(after?.vendor).toBeUndefined()
  })

  it('deletes an expense once', async () => {
    t = createTestApp()
    const { json } = await t.call('POST', '/expenses', HOSTING)
    const first = await t.call('DELETE', `/expenses/${json.data.id}`)
    const second = await t.call('DELETE', `/expenses/${json.data.id}`)
    expect(first.status).toBe(200)
    expect(second.status).toBe(404)
    expect(await expenseById(json.data.id)).toBeUndefined()
  })

  it('rejects bad input', async () => {
    t = createTestApp()
    const zero = await t.call('POST', '/expenses', { ...HOSTING, amountMinor: 0 })
    const kind = await t.call('POST', '/expenses', {
      ...HOSTING,
      category: 'coffee',
    })
    expect(zero.status).toBe(400)
    expect(kind.status).toBe(400)
  })

  it('answers 404 when editing a missing expense', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/expenses/x-missing', HOSTING)
    expect(res.status).toBe(404)
  })
})
