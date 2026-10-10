import { isoDay } from '@/shared/model/dates'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

/** A client with no history at all. */
async function freshClient() {
  const res = await t.call('POST', '/clients', {
    name: 'Walid Ali',
    currency: 'SAR',
  })
  return String(res.json.data.id)
}

async function freshEngagement(clientId: string) {
  const res = await t.call('POST', '/engagements', {
    clientId,
    title: 'Monthly support',
    type: 'subscription',
    amountMinor: 100_000,
    startOn: '2026-09-01',
    cyclePeriod: 'monthly',
  })
  expect(res.status).toBe(201)
  return String(res.json.data.id)
}

describe('archiving and deleting clients', () => {
  it('archives a client and keeps it in the snapshot, marked', async () => {
    t = createTestApp()
    const id = await freshClient()
    const res = await t.call('POST', `/clients/${id}/archive`)
    expect(res.status).toBe(200)
    const client = (await t.snapshot()).clients.find((c) => c.id === id)
    expect(client?.archivedAt).toBeDefined()
  })

  it('restores an archived client', async () => {
    t = createTestApp()
    const id = await freshClient()
    await t.call('POST', `/clients/${id}/archive`)
    await t.call('POST', `/clients/${id}/unarchive`)
    const client = (await t.snapshot()).clients.find((c) => c.id === id)
    expect(client?.archivedAt).toBeUndefined()
  })

  it('refuses to archive a client whose engagements are not archived', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/clients/c-nakhla/archive')
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('client_has_engagements')
  })

  it('opens no new engagement for an archived client', async () => {
    t = createTestApp()
    const id = await freshClient()
    await t.call('POST', `/clients/${id}/archive`)
    const res = await t.call('POST', '/engagements', {
      clientId: id,
      title: 'Logo',
      type: 'project',
      amountMinor: 50_000,
      startOn: '2026-09-01',
    })
    expect(res.status).toBe(404)
  })

  it('deletes a client that has no records', async () => {
    t = createTestApp()
    const id = await freshClient()
    const res = await t.call('DELETE', `/clients/${id}`)
    expect(res.status).toBe(200)
    const snap = await t.snapshot()
    expect(snap.clients.some((c) => c.id === id)).toBe(false)
  })

  it('refuses to delete a client with history', async () => {
    t = createTestApp()
    const res = await t.call('DELETE', '/clients/c-nakhla')
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('client_in_use')
    const snap = await t.snapshot()
    expect(snap.clients.some((c) => c.id === 'c-nakhla')).toBe(true)
  })
})

describe('archiving and deleting engagements', () => {
  it('archives a project and restores it', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements/e-nakhla/archive')
    expect(res.status).toBe(200)
    let snap = await t.snapshot()
    expect(
      snap.engagements.find((e) => e.id === 'e-nakhla')?.archivedAt
    ).toBeDefined()

    await t.call('POST', '/engagements/e-nakhla/unarchive')
    snap = await t.snapshot()
    expect(
      snap.engagements.find((e) => e.id === 'e-nakhla')?.archivedAt
    ).toBeUndefined()
  })

  it('refuses to archive a subscription until its cycle is stopped', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements/e-souq/archive')
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('engagement_running')

    await t.call('POST', '/engagements/e-souq/stop')
    const after = await t.call('POST', '/engagements/e-souq/archive')
    expect(after.status).toBe(200)
  })

  it('resumes a stopped subscription with a fresh cycle from today', async () => {
    t = createTestApp()
    await t.call('POST', '/engagements/e-souq/stop')
    const res = await t.call('POST', '/engagements/e-souq/resume')
    expect(res.status).toBe(200)
    const snap = await t.snapshot()
    expect(snap.engagements.find((e) => e.id === 'e-souq')?.status).toBe(
      'active'
    )
    const open = snap.cycles.filter(
      (c) => c.engagementId === 'e-souq' && c.decision === 'pending'
    )
    expect(open).toHaveLength(1)
    expect(open[0]?.startsOn).toBe(isoDay(new Date()))
    const again = await t.call('POST', '/engagements/e-souq/resume')
    expect(again.status).toBe(409)
  })

  it('lets the client be archived once its engagements are', async () => {
    t = createTestApp()
    const clientId = await freshClient()
    const id = await freshEngagement(clientId)
    await t.call('POST', `/engagements/${id}/stop`)
    await t.call('POST', `/engagements/${id}/archive`)
    const res = await t.call('POST', `/clients/${clientId}/archive`)
    expect(res.status).toBe(200)
  })

  it('deletes an engagement opened by mistake, with its first cycle', async () => {
    t = createTestApp()
    const id = await freshEngagement(await freshClient())
    const res = await t.call('DELETE', `/engagements/${id}`)
    expect(res.status).toBe(200)
    const snap = await t.snapshot()
    expect(snap.engagements.some((e) => e.id === id)).toBe(false)
    expect(snap.cycles.some((c) => c.engagementId === id)).toBe(false)
  })

  it('refuses to delete an engagement with history', async () => {
    t = createTestApp()
    const res = await t.call('DELETE', '/engagements/e-nakhla')
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('engagement_in_use')
  })
})
