import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

/** Creates a portal link for the engagement and returns its URL token. */
async function linkFor(engagementId: string) {
  const res = await t.call('POST', `/engagements/${engagementId}/portal-link`)
  expect(res.status).toBe(201)
  return String(res.json.data.token)
}

describe('client portal', () => {
  it('shows only the scoped engagement view — no money, no contacts', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    const res = await t.call('GET', `/portal/${token}`)
    expect(res.status).toBe(200)

    const view = res.json.data as {
      engagement: { title: string }
      stages: unknown[]
      deliverables: { id: string }[]
    }
    expect(view.engagement.title).toBeTruthy()
    expect(view.stages.length).toBeGreaterThan(0)
    expect(view.deliverables.map((d) => d.id)).toContain('dl-1')

    const raw = JSON.stringify(res.json.data)
    for (const secret of ['amount', 'currency', 'whatsapp', 'rate', 'c-masar']) {
      expect(raw).not.toContain(secret)
    }
  })

  it('answers 404 for unknown, malformed and revoked tokens', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    const unknown = await t.call('GET', `/portal/${'x'.repeat(43)}`)
    const malformed = await t.call('GET', '/portal/e-nakhla')
    await t.call('DELETE', '/engagements/e-nakhla/portal-link')
    const revoked = await t.call('GET', `/portal/${token}`)
    expect([unknown.status, malformed.status, revoked.status]).toEqual([
      404, 404, 404,
    ])
  })

  it('replaces the previous link when a new one is created', async () => {
    t = createTestApp()
    const first = await linkFor('e-nakhla')
    const second = await linkFor('e-nakhla')
    expect((await t.call('GET', `/portal/${first}`)).status).toBe(404)
    expect((await t.call('GET', `/portal/${second}`)).status).toBe(200)
  })

  it('lists links in the snapshot by hint only', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    await t.call('GET', `/portal/${token}`)
    const { json } = await t.call('GET', '/snapshot')
    const links = (json.data as { portalLinks: Record<string, unknown>[] })
      .portalLinks
    expect(links).toHaveLength(1)
    expect(links[0]).toMatchObject({
      engagementId: 'e-nakhla',
      tokenHint: token.slice(-4),
      viewCount: 1,
    })
    expect(JSON.stringify(links)).not.toContain(token)
    expect(links[0]).not.toHaveProperty('tokenHash')
  })

  it('records a client approval through the link', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    const res = await t.call(
      'POST',
      `/portal/${token}/deliverables/dl-2/approval`,
      { signerName: 'Sara' }
    )
    expect(res.status).toBe(201)
    const approval = (await t.snapshot()).approvals.find(
      (a) => a.deliverableId === 'dl-2'
    )
    expect(approval).toMatchObject({ source: 'client_link' })
  })

  it('records a change request as a client round', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    const res = await t.call('POST', `/portal/${token}/deliverables/dl-3/rounds`, {
      note: 'Please make the logo bigger',
    })
    expect(res.status).toBe(201)
    const round = (await t.snapshot()).rounds.find(
      (r) => r.deliverableId === 'dl-3'
    )
    expect(round).toMatchObject({ source: 'client_link' })
  })

  it('refuses deliverables of another engagement', async () => {
    t = createTestApp()
    const token = await linkFor('e-masar')
    const res = await t.call(
      'POST',
      `/portal/${token}/deliverables/dl-1/approval`,
      {}
    )
    expect(res.status).toBe(404)
  })

  it('rate-limits the public endpoint', async () => {
    t = createTestApp()
    const token = await linkFor('e-nakhla')
    const statuses: number[] = []
    for (let i = 0; i < 70; i++) {
      statuses.push((await t.call('GET', `/portal/${token}`)).status)
    }
    expect(statuses).toContain(429)
    expect(statuses[0]).toBe(200)
  })
})
