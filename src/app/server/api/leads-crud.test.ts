import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const NEW_LEAD = {
  name: 'Sara Ahmed',
  company: 'Sara Studio',
  whatsapp: '967771234567',
  service: 'Online store',
  amountMinor: 450_000,
  currency: 'SAR',
  source: 'Instagram',
  nextFollowUpOn: '2030-01-10',
  notes: 'Wants it before Ramadan',
}

describe('adding a lead', () => {
  it('creates a lead in the first stage with today as last contact', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads', NEW_LEAD)
    expect(res.status).toBe(201)
    const lead = (await t.snapshot()).leads.find(
      (l) => l.id === res.json.data.id
    )
    expect(lead).toMatchObject({
      name: 'Sara Ahmed',
      company: 'Sara Studio',
      service: 'Online store',
      stage: 'lead',
      amount: 450_000,
      currency: 'SAR',
      source: 'Instagram',
      nextFollowUpOn: '2030-01-10',
    })
    expect(lead?.lastContactOn).toBeDefined()
  })

  it('stores the amount at the latest rate for its currency', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads', {
      ...NEW_LEAD,
      currency: 'USD',
    })
    const lead = (await t.snapshot()).leads.find(
      (l) => l.id === res.json.data.id
    )!
    expect(lead.currency).toBe('USD')
    expect(lead.baseAmount).toBe(Math.round(450_000 * lead.rateToBase))
  })

  it('needs a name and a service', async () => {
    t = createTestApp()
    const noName = await t.call('POST', '/leads', { ...NEW_LEAD, name: ' ' })
    const noService = await t.call('POST', '/leads', {
      ...NEW_LEAD,
      service: '',
    })
    expect([noName.status, noService.status]).toEqual([400, 400])
  })

  it('rejects a negative amount and a bad WhatsApp number', async () => {
    t = createTestApp()
    const negative = await t.call('POST', '/leads', {
      ...NEW_LEAD,
      amountMinor: -1,
    })
    const badPhone = await t.call('POST', '/leads', {
      ...NEW_LEAD,
      whatsapp: '+967 77',
    })
    expect([negative.status, badPhone.status]).toEqual([400, 400])
  })
})

describe('editing and deleting a lead', () => {
  it('updates the fields but keeps the stage', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/leads/l1', {
      ...NEW_LEAD,
      name: 'Renamed',
    })
    expect(res.status).toBe(200)
    const before = (await t.snapshot()).leads.find((l) => l.id === 'l1')
    expect(before).toMatchObject({ name: 'Renamed', service: 'Online store' })
    expect(before?.stage).toBe('lead')
  })

  it('answers 404 for an unknown lead', async () => {
    t = createTestApp()
    const res = await t.call('PUT', '/leads/l-missing', NEW_LEAD)
    expect(res.status).toBe(404)
  })

  it('refuses to edit or delete a lead that is already won', async () => {
    t = createTestApp()
    const body = {
      title: 'Store',
      type: 'project',
      amountMinor: 100,
      startOn: '2030-01-01',
    }
    await t.call('POST', '/leads/l1/convert', body)
    const edit = await t.call('PUT', '/leads/l1', NEW_LEAD)
    const del = await t.call('DELETE', '/leads/l1')
    expect([edit.status, del.status]).toEqual([409, 409])
    expect(edit.json.error?.code).toBe('lead_won')
  })

  it('deletes an open lead', async () => {
    t = createTestApp()
    const res = await t.call('DELETE', '/leads/l1')
    expect(res.status).toBe(200)
    expect((await t.snapshot()).leads.some((l) => l.id === 'l1')).toBe(false)
  })

  it('is closed to assistants', async () => {
    t = createTestApp()
    const token = t.sessionFor('m-assistant')
    for (const [method, path] of [
      ['POST', '/leads'],
      ['PUT', '/leads/l1'],
      ['DELETE', '/leads/l1'],
    ]) {
      const res = await t.callAs(token, method, path, NEW_LEAD)
      expect(res.status, path).toBe(403)
    }
  })
})
