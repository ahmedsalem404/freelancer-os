import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const NEW_CLIENT = {
  name: 'Huda Saleh',
  company: 'Bayt Al-Qahwa',
  whatsapp: '967771234567',
  email: 'huda@example.com',
  city: 'Aden',
  currency: 'USD',
  billingIdentityId: 'bi-personal',
  notes: 'Prefers voice notes',
}

describe('clients', () => {
  it('creates a company client under the chosen identity', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/clients', NEW_CLIENT)
    expect(res.status).toBe(201)

    const client = (await t.snapshot()).clients.find(
      (c) => c.id === res.json.data.id
    )
    expect(client).toMatchObject({
      kind: 'company',
      name: 'Huda Saleh',
      company: 'Bayt Al-Qahwa',
      email: 'huda@example.com',
      currency: 'USD',
      billingIdentityId: 'bi-personal',
      notes: 'Prefers voice notes',
    })
  })

  it('creates an individual when no company is given', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/clients', {
      name: 'Omar',
      currency: 'SAR',
    })
    expect(res.status).toBe(201)
    const client = (await t.snapshot()).clients.find(
      (c) => c.id === res.json.data.id
    )
    expect(client).toMatchObject({ kind: 'person', name: 'Omar' })
  })

  it('updates a client and recomputes its kind', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/clients/c-nakhla', {
      ...NEW_CLIENT,
      company: '',
      city: 'Jeddah',
    })
    expect(res.status).toBe(200)
    const client = (await t.snapshot()).clients.find((c) => c.id === 'c-nakhla')
    expect(client).toMatchObject({ kind: 'person', city: 'Jeddah' })
    expect(client?.company).toBeUndefined()
  })

  it('rejects an unknown billing identity', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/clients', {
      ...NEW_CLIENT,
      billingIdentityId: 'bi-nope',
    })
    expect(res.status).toBe(422)
    expect(res.json.error?.code).toBe('unknown_identity')
  })

  it('rejects bad input', async () => {
    t = createTestApp()
    const blank = await t.call('POST', '/clients', {
      name: ' ',
      currency: 'SAR',
    })
    const phone = await t.call('POST', '/clients', {
      name: 'A',
      currency: 'SAR',
      whatsapp: '+967 77',
    })
    expect(blank.status).toBe(400)
    expect(phone.status).toBe(400)
  })

  it('answers 404 when editing a missing client', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/clients/c-missing', NEW_CLIENT)
    expect(res.status).toBe(404)
  })
})
