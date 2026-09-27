import { afterEach, describe, expect, it } from 'vitest'
import { ASSISTANT_ID, OWNER_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const signIn = (login: string, password: string) =>
  t.callAs(null, 'POST', '/auth/sign-in', { login, password })

describe('team management', () => {
  it('adds an assistant who can sign in and lands on their own screen', async () => {
    t = createTestApp()
    const added = await t.call('POST', '/team', {
      name: 'Sara',
      login: 'sara',
      password: 'pass1',
    })
    expect(added.status).toBe(201)
    const res = await signIn('SARA', 'pass1')
    expect(res.status).toBe(200)
    expect(res.json.data).toMatchObject({ name: 'Sara', role: 'assistant' })

    const snap = await t.snapshot()
    expect(snap.team.find((m) => m.name === 'Sara')).toMatchObject({
      isActive: true,
      hasPassword: true,
    })
  })

  it('refuses a login another member already uses', async () => {
    t = createTestApp()
    const snap = await t.snapshot()
    const ownerLogin = snap.team.find((m) => m.id === OWNER_ID)!.email
    const res = await t.call('POST', '/team', {
      name: 'X',
      login: ownerLogin.toUpperCase(),
      password: 'pass1',
    })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('login_taken')
  })

  it('resets a password and signs the assistant out everywhere', async () => {
    t = createTestApp()
    const old = t.sessionFor(ASSISTANT_ID)
    const res = await t.call('PUT', `/team/${ASSISTANT_ID}/password`, {
      password: 'new-pass',
    })
    expect(res.status).toBe(200)
    expect((await t.callAs(old, 'GET', '/workspace')).status).toBe(401)
    const snap = await t.snapshot()
    const login = snap.team.find((m) => m.id === ASSISTANT_ID)!.email
    expect((await signIn(login, 'new-pass')).status).toBe(200)
  })

  it('stops an assistant (no sign-in, signed out) and brings them back', async () => {
    t = createTestApp()
    await t.call('PUT', `/team/${ASSISTANT_ID}/password`, { password: 'pass1' })
    const snap = await t.snapshot()
    const login = snap.team.find((m) => m.id === ASSISTANT_ID)!.email
    const session = t.sessionFor(ASSISTANT_ID)

    expect(
      (await t.call('POST', `/team/${ASSISTANT_ID}/deactivate`)).status
    ).toBe(200)
    expect((await t.callAs(session, 'GET', '/workspace')).status).toBe(401)
    expect((await signIn(login, 'pass1')).status).toBe(401)
    // A stopped assistant can't be given tasks.
    const task = await t.call('POST', '/tasks', {
      title: 'x',
      assigneeId: ASSISTANT_ID,
    })
    expect(task.status).toBe(404)

    await t.call('POST', `/team/${ASSISTANT_ID}/activate`)
    expect((await signIn(login, 'pass1')).status).toBe(200)
  })

  it('edits name and login', async () => {
    t = createTestApp()
    const res = await t.call('PUT', `/team/${ASSISTANT_ID}`, {
      name: 'Ali',
      login: 'ali',
    })
    expect(res.status).toBe(200)
    const snap = await t.snapshot()
    expect(snap.team.find((m) => m.id === ASSISTANT_ID)).toMatchObject({
      name: 'Ali',
      email: 'ali',
    })
  })

  it('never touches the owner, and is closed to assistants', async () => {
    t = createTestApp()
    const owner = await t.call('POST', `/team/${OWNER_ID}/deactivate`)
    expect(owner.status).toBe(409)
    expect(owner.json.error?.code).toBe('not_an_assistant')

    const token = t.sessionFor(ASSISTANT_ID)
    const res = await t.callAs(token, 'POST', '/team', {
      name: 'X',
      login: 'x',
      password: 'pass1',
    })
    expect(res.status).toBe(403)
  })
})
