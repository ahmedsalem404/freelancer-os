import { invoiceBalance, invoiceStatus } from '@/domain/selectors'
import { isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

describe('PUT /api/rates/today', () => {
  it("saves today's quotes and replaces them on a second save", async () => {
    t = createTestApp()
    const first = await t.call('PUT', '/rates/today', {
      sarInYer: 430,
      usdInYer: 1650,
    })
    expect(first.status).toBe(200)
    await t.call('PUT', '/rates/today', { sarInYer: 431, usdInYer: 1655 })

    const { dailyRates } = await t.snapshot()
    const todays = dailyRates.filter((r) => r.day === isoDay(new Date()))
    expect(todays).toEqual([
      { day: isoDay(new Date()), sarInYer: 431, usdInYer: 1655 },
    ])
  })

  it('rejects a non-positive quote with the error envelope', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/rates/today', {
      sarInYer: 0,
      usdInYer: 1600,
    })
    expect(res.status).toBe(400)
    expect(res.json).toMatchObject({ ok: false, error: { code: 'invalid_input' } })
  })
})

describe('POST /api/invoices/:id/payments', () => {
  it('records a confirmed payment and its proof metadata', async () => {
    t = createTestApp()
    const before = await t.snapshot()
    const invoice = before.invoices.find((i) => invoiceBalance(before, i) > 0)!
    const balance = invoiceBalance(before, invoice)

    const res = await t.call('POST', `/invoices/${invoice.id}/payments`, {
      amountMinor: balance,
      rateToBase: invoice.rateToBase,
      method: 'bank',
      proofName: 'transfer.jpg',
    })
    expect(res.status).toBe(201)

    const after = await t.snapshot()
    const paymentId = String(res.json.data.id)
    expect(invoiceStatus(after, invoice, isoDay(new Date()))).toBe('paid')
    expect(after.attachments).toContainEqual(
      expect.objectContaining({
        kind: 'payment_proof',
        fileName: 'transfer.jpg',
        paymentId,
      })
    )
  })

  it('answers 404 for an unknown invoice and 400 for a zero amount', async () => {
    t = createTestApp()
    const body = { amountMinor: 100, rateToBase: 1, method: 'cash' }
    const missing = await t.call('POST', '/invoices/nope/payments', body)
    expect(missing.status).toBe(404)
    const zero = await t.call('POST', '/invoices/inv-1/payments', {
      ...body,
      amountMinor: 0,
    })
    expect(zero.status).toBe(400)
  })
})

describe('shared API behaviour', () => {
  it('keeps the vault locked until phase 3', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/vault/v1/reveal')
    expect(res.status).toBe(423)
    expect(res.json.error?.code).toBe('vault_locked')
  })

  it('answers unknown endpoints with the envelope', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/nothing-here')
    expect(res.status).toBe(404)
    expect(res.json.ok).toBe(false)
  })
})
