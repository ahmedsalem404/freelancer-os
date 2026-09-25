import { afterEach, describe, expect, it } from 'vitest'
import { hashPassword, replacePassword } from '@/features/auth/server'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const OWNER_EMAIL = 'owner@freelancer-os.local'
const PASSWORD = 'correct horse battery'

async function withPassword(email = OWNER_EMAIL, password = PASSWORD) {
  replacePassword(t.db, email, await hashPassword(password))
}

/** The raw `fos_session` value from a sign-in response. */
function sessionCookie(res: Response) {
  const header = res.headers.get('set-cookie') ?? ''
  return { header, token: /fos_session=([^;]*)/.exec(header)?.[1] ?? '' }
}

describe('authentication', () => {
  it('rejects owner endpoints without a session', async () => {
    t = createTestApp()
    for (const [method, path] of [
      ['GET', '/snapshot'],
      ['POST', '/clients'],
      ['POST', '/engagements/e-nakhla/portal-link'],
      ['GET', '/auth/me'],
    ] as const) {
      const res = await t.callAs(null, method, path)
      expect(res.status, path).toBe(401)
      expect(res.json.error?.code).toBe('unauthenticated')
    }
  })

  it('keeps health and the public portal open', async () => {
    t = createTestApp()
    expect((await t.callAs(null, 'GET', '/health')).status).toBe(200)
    const link = await t.call('POST', '/engagements/e-nakhla/portal-link')
    const token = String(link.json.data.token)
    expect((await t.callAs(null, 'GET', `/portal/${token}`)).status).toBe(200)
  })

  it('signs in with the right password and sets a strict HttpOnly cookie', async () => {
    t = createTestApp()
    await withPassword()
    const res = await t.callAs(null, 'POST', '/auth/sign-in', {
      email: 'Owner@Freelancer-OS.local ',
      password: PASSWORD,
    })
    expect(res.status).toBe(200)
    expect(res.json.data).toMatchObject({ id: 'm-owner', role: 'owner' })
    expect(JSON.stringify(res.json.data)).not.toContain('argon2')

    const { header, token } = sessionCookie(res.res)
    expect(header).toMatch(/HttpOnly/i)
    expect(header).toMatch(/SameSite=Strict/i)
    expect(header).toMatch(/Path=\/api/)
    const me = await t.callAs(token, 'GET', '/auth/me')
    expect(me.json.data).toMatchObject({ email: OWNER_EMAIL })
    expect((await t.callAs(token, 'GET', '/snapshot')).status).toBe(200)
  })

  it('answers the same error for a wrong password and an unknown email', async () => {
    t = createTestApp()
    await withPassword()
    const wrong = await t.callAs(null, 'POST', '/auth/sign-in', {
      email: OWNER_EMAIL,
      password: 'not the password',
    })
    const unknown = await t.callAs(null, 'POST', '/auth/sign-in', {
      email: 'nobody@example.com',
      password: PASSWORD,
    })
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401)
      expect(res.json.error?.code).toBe('invalid_credentials')
      expect(res.res.headers.get('set-cookie')).toBeNull()
    }
  })

  it('refuses an account that has no password yet', async () => {
    t = createTestApp()
    const res = await t.callAs(null, 'POST', '/auth/sign-in', {
      email: OWNER_EMAIL,
      password: PASSWORD,
    })
    expect(res.status).toBe(401)
  })

  it('signs out: the old cookie stops working', async () => {
    t = createTestApp()
    const token = t.sessionFor('m-owner')
    const out = await t.callAs(token, 'POST', '/auth/sign-out')
    expect(out.status).toBe(200)
    expect((await t.callAs(token, 'GET', '/snapshot')).status).toBe(401)
  })

  it('ends every session when the password changes', async () => {
    t = createTestApp()
    const token = t.sessionFor('m-owner')
    await withPassword()
    expect((await t.callAs(token, 'GET', '/snapshot')).status).toBe(401)
  })

  it('expires a session after 30 days without use', async () => {
    t = createTestApp(new Date('2026-01-01T00:00:00Z'))
    const idle = t.sessionFor('m-owner')
    t.setNow(new Date('2026-02-01T00:00:00Z'))
    expect((await t.callAs(idle, 'GET', '/auth/me')).status).toBe(401)
  })

  it('keeps a used session alive (sliding expiry)', async () => {
    t = createTestApp(new Date('2026-01-01T00:00:00Z'))
    const used = t.sessionFor('m-owner')
    t.setNow(new Date('2026-01-21T00:00:00Z'))
    expect((await t.callAs(used, 'GET', '/auth/me')).status).toBe(200)
    t.setNow(new Date('2026-02-15T00:00:00Z'))
    expect((await t.callAs(used, 'GET', '/auth/me')).status).toBe(200)
  })

  it('rate-limits sign-in attempts', async () => {
    t = createTestApp()
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const res = await t.callAs(null, 'POST', '/auth/sign-in', {
        email: 'nobody@example.com',
        password: 'x',
      })
      statuses.push(res.status)
    }
    expect(statuses[statuses.length - 1]).toBe(429)
  })
})

describe('roles', () => {
  it('lets an assistant read who they are but nothing owner-only', async () => {
    t = createTestApp()
    const token = t.sessionFor(ASSISTANT_ID)
    const me = await t.callAs(token, 'GET', '/auth/me')
    expect(me.json.data).toMatchObject({ role: 'assistant' })
    for (const [method, path] of [
      ['GET', '/snapshot'],
      ['POST', '/invoices'],
      ['POST', '/vault/v-1/reveal'],
    ] as const) {
      const res = await t.callAs(token, method, path)
      expect(res.status, path).toBe(403)
    }
  })
})

describe('owner-only sources', () => {
  it('no longer lets an owner call pose as the client link', async () => {
    t = createTestApp()
    const approval = await t.call('POST', '/deliverables/dl-2/approval', {
      source: 'client_link',
    })
    const round = await t.call('POST', '/deliverables/dl-2/rounds', {
      note: 'x',
      source: 'client_link',
    })
    expect([approval.status, round.status]).toEqual([400, 400])
  })
})
