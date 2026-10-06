import { strToU8, unzipSync, zipSync } from 'fflate'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ASSISTANT_ID, OWNER_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const CLIENT = (name: string) => ({
  name,
  whatsapp: '967771234567',
  currency: 'USD',
  billingIdentityId: 'bi-personal',
})

async function takeBackup() {
  const res = await t.raw('/backup')
  return new Uint8Array(await res.arrayBuffer())
}

function restore(bytes: Uint8Array, token?: string | null) {
  const form = new FormData()
  form.set('file', new File([bytes.slice()], 'backup.zip'))
  const init = { method: 'POST', body: form }
  return token === undefined
    ? t.raw('/backup/restore', init)
    : t.rawAs(token, '/backup/restore', init)
}

async function clientNames(token: string) {
  const { json } = await t.callAs(token, 'GET', '/snapshot')
  return (json.data.clients as { name: string }[]).map((c) => c.name)
}

describe('POST /backup/restore', () => {
  it('puts back the data, files and key of the backup and signs everyone out', async () => {
    t = createTestApp()
    await t.call('POST', '/clients', CLIENT('Kept'))
    mkdirSync(join(t.dataDir, 'files', '2026'), { recursive: true })
    writeFileSync(join(t.dataDir, 'files', '2026', 'old.pdf'), 'old')
    writeFileSync(join(t.dataDir, 'vault.key'), 'a'.repeat(32))
    const backup = await takeBackup()

    // Everything after the backup must go away.
    await t.call('POST', '/clients', CLIENT('Later'))
    writeFileSync(join(t.dataDir, 'files', '2026', 'new.pdf'), 'new')
    writeFileSync(join(t.dataDir, 'vault.key'), 'b'.repeat(32))

    const res = await restore(backup)
    expect(res.status).toBe(200)

    const token = t.sessionFor(OWNER_ID)
    const names = await clientNames(token)
    expect(names).toContain('Kept')
    expect(names).not.toContain('Later')
    expect(readdirSync(join(t.dataDir, 'files', '2026'))).toEqual(['old.pdf'])
    expect(readFileSync(join(t.dataDir, 'vault.key'), 'utf8')).toBe(
      'a'.repeat(32)
    )
    // The old session is gone: sign in again.
    expect((await t.call('GET', '/snapshot')).status).toBe(401)
    // A copy of what was replaced is kept, just in case.
    const copies = readdirSync(join(t.dataDir, 'backups'))
    expect(copies).toHaveLength(1)
    expect(copies[0]).toMatch(/^before-restore-.+\.zip$/)
  })

  it('refuses a file that is not a backup and changes nothing', async () => {
    t = createTestApp()
    await t.call('POST', '/clients', CLIENT('Stays'))
    const bad = [
      strToU8('not a zip'),
      zipSync({ 'notes.txt': strToU8('hi') }),
      zipSync({ 'freelancer-os.db': strToU8('not sqlite') }),
      zipSync({
        'freelancer-os.db': unzipSync(await takeBackup())['freelancer-os.db'],
        '../evil.pdf': strToU8('x'),
      }),
    ]
    for (const bytes of bad) {
      const res = await restore(bytes)
      expect(res.status).toBe(400)
      expect(
        ((await res.json()) as { error: { code: string } }).error.code
      ).toBe('backup_invalid')
    }
    expect((await t.snapshot()).clients.map((c) => c.name)).toContain('Stays')
    expect(existsSync(join(t.dataDir, 'backups'))).toBe(false)
  })

  it('is refused to an assistant and to anonymous callers', async () => {
    t = createTestApp()
    const backup = await takeBackup()
    expect((await restore(backup, t.sessionFor(ASSISTANT_ID))).status).toBe(403)
    expect((await restore(backup, null)).status).toBe(401)
  })
})
