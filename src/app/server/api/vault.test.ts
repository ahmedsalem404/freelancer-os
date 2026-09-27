import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { vaultEntries } from '@/features/clients/server/clients.table'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const login = {
  label: 'cPanel',
  url: 'https://host.example',
  username: 'admin',
  secret: 'p@ss-123',
  notes: 'PIN 4455',
}

async function addLogin() {
  const res = await t.call('POST', '/clients/c-nakhla/vault', login)
  expect(res.status).toBe(201)
  return String(res.json.data.id)
}

describe('vault', () => {
  it('stores the secret encrypted and reveals it to the owner', async () => {
    t = createTestApp()
    const id = await addLogin()

    const row = t.db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.id, id))
      .get()
    expect(row?.ciphertext).toBeTruthy()
    expect(row?.ciphertext).not.toContain('p@ss')
    expect(row?.algo).toBe('aes-256-gcm')

    const shown = await t.call('POST', `/vault/${id}/reveal`)
    expect(shown.json.data).toEqual({ secret: 'p@ss-123', notes: 'PIN 4455' })
    expect(shown.res.headers.get('cache-control')).toBe('no-store')
  })

  it('never puts the secret in the snapshot', async () => {
    t = createTestApp()
    await addLogin()
    const { json } = await t.call('GET', '/snapshot')
    expect(JSON.stringify(json.data)).not.toContain('p@ss-123')
    expect(JSON.stringify(json.data)).not.toContain('PIN 4455')
  })

  it('keeps the saved secret when an edit leaves it blank', async () => {
    t = createTestApp()
    const id = await addLogin()
    const edit = await t.call('PUT', `/vault/${id}`, {
      ...login,
      label: 'cPanel (new)',
      secret: '',
      notes: '',
    })
    expect(edit.status).toBe(200)
    const shown = await t.call('POST', `/vault/${id}/reveal`)
    expect(shown.json.data).toEqual({ secret: 'p@ss-123', notes: 'PIN 4455' })
  })

  it('re-encrypts with a fresh nonce on every edit', async () => {
    t = createTestApp()
    const id = await addLogin()
    const before = t.db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.id, id))
      .get()
    await t.call('PUT', `/vault/${id}`, login)
    const after = t.db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.id, id))
      .get()
    expect(after?.nonce).not.toBe(before?.nonce)
  })

  it('deletes an entry', async () => {
    t = createTestApp()
    const id = await addLogin()
    expect((await t.call('DELETE', `/vault/${id}`)).status).toBe(200)
    expect((await t.call('POST', `/vault/${id}/reveal`)).status).toBe(404)
  })

  it('says so when an old entry has no secret saved yet', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/vault/v1/reveal')
    expect(res.status).toBe(404)
    expect(res.json.error?.code).toBe('vault_empty')
  })

  it('is closed to assistants', async () => {
    t = createTestApp()
    const id = await addLogin()
    const token = t.sessionFor(ASSISTANT_ID)
    for (const [method, path] of [
      ['POST', `/vault/${id}/reveal`],
      ['POST', '/clients/c-nakhla/vault'],
      ['PUT', `/vault/${id}`],
      ['DELETE', `/vault/${id}`],
    ] as const) {
      expect((await t.callAs(token, method, path, login)).status, path).toBe(
        403
      )
    }
  })
})
