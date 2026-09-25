import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { hashPassword, replacePassword } from '@/features/auth/server'
import { teamMembers } from '@/features/settings/server'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const OWNER_LOGIN = 'owner@freelancer-os.local'
const OLD = 'old-pass'

async function setup() {
  t = createTestApp()
  replacePassword(t.db, OWNER_LOGIN, await hashPassword(OLD))
  // Signed in on two devices.
  return { here: t.sessionFor('m-owner'), elsewhere: t.sessionFor('m-owner') }
}

describe('PUT /auth/account', () => {
  it('changes name, login and password; the new ones sign in', async () => {
    const { here } = await setup()
    const res = await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'أحمد ديلوف',
      login: 'Ahmed',
      newPassword: '1234',
    })
    expect(res.status).toBe(200)
    expect(res.json.data).toMatchObject({ name: 'أحمد ديلوف', email: 'Ahmed' })

    const signIn = await t.callAs(null, 'POST', '/auth/sign-in', {
      login: 'ahmed',
      password: '1234',
    })
    expect(signIn.status).toBe(200)
    const oldLogin = await t.callAs(null, 'POST', '/auth/sign-in', {
      login: OWNER_LOGIN,
      password: '1234',
    })
    expect(oldLogin.status).toBe(401)
  })

  it('keeps this device signed in and signs the others out on a new password', async () => {
    const { here, elsewhere } = await setup()
    await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'أحمد',
      login: OWNER_LOGIN,
      newPassword: 'new-pass',
    })
    expect((await t.callAs(here, 'GET', '/auth/me')).status).toBe(200)
    expect((await t.callAs(elsewhere, 'GET', '/auth/me')).status).toBe(401)
  })

  it('keeps the password and every session when only the name changes', async () => {
    const { here, elsewhere } = await setup()
    const res = await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'Ahmed',
      login: OWNER_LOGIN,
      newPassword: '',
    })
    expect(res.status).toBe(200)
    expect((await t.callAs(elsewhere, 'GET', '/auth/me')).status).toBe(200)
    const signIn = await t.callAs(null, 'POST', '/auth/sign-in', {
      login: OWNER_LOGIN,
      password: OLD,
    })
    expect(signIn.status).toBe(200)
  })

  it('refuses a wrong current password and changes nothing', async () => {
    const { here } = await setup()
    const res = await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: 'guess',
      name: 'Hacker',
      login: 'hacker',
    })
    expect(res.status).toBe(403)
    expect(res.json.error?.code).toBe('wrong_password')
    const row = t.db
      .select({ name: teamMembers.name })
      .from(teamMembers)
      .where(eq(teamMembers.id, 'm-owner'))
      .get()
    expect(row?.name).toBe('أحمد')
  })

  it('refuses a login another member already uses, in any letter case', async () => {
    const { here } = await setup()
    const res = await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'أحمد',
      login: 'ASSISTANT@freelancer-os.local',
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('login_taken')
  })

  it('refuses a new password shorter than 4 characters', async () => {
    const { here } = await setup()
    const res = await t.callAs(here, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'أحمد',
      login: OWNER_LOGIN,
      newPassword: '123',
    })
    expect(res.status).toBe(400)
  })

  it('lets an assistant edit their own account', async () => {
    t = createTestApp()
    replacePassword(
      t.db,
      'assistant@freelancer-os.local',
      await hashPassword(OLD)
    )
    const token = t.sessionFor(ASSISTANT_ID)
    const res = await t.callAs(token, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'سلمى',
      login: 'salma',
    })
    expect(res.status).toBe(200)
    expect(res.json.data).toMatchObject({ id: ASSISTANT_ID, email: 'salma' })
  })

  it('needs a session', async () => {
    t = createTestApp()
    const res = await t.callAs(null, 'PUT', '/auth/account', {
      currentPassword: OLD,
      name: 'x',
      login: 'x',
    })
    expect(res.status).toBe(401)
  })
})
