import { unzipSync } from 'fflate'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ASSISTANT_ID, createTestApp } from './test-app'

describe('GET /backup', () => {
  it('downloads a zip with the database, the uploaded files and the vault key', async () => {
    const t = createTestApp(new Date('2026-09-25T09:00:00Z'))
    mkdirSync(join(t.dataDir, 'files', '2026'), { recursive: true })
    writeFileSync(join(t.dataDir, 'files', '2026', 'a.pdf'), 'pdf')
    writeFileSync(join(t.dataDir, 'vault.key'), 'k'.repeat(32))

    const res = await t.raw('/backup')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    expect(res.headers.get('content-disposition')).toContain(
      'freelancer-os-backup-2026-09-25.zip'
    )
    const zip = unzipSync(new Uint8Array(await res.arrayBuffer()))
    expect(Object.keys(zip).sort()).toEqual([
      'files/2026/a.pdf',
      'freelancer-os.db',
      'vault.key',
    ])
    // A real SQLite file, not an empty placeholder.
    expect(new TextDecoder().decode(zip['freelancer-os.db'].slice(0, 15))).toBe(
      'SQLite format 3'
    )
    t.close()
  })

  it('is refused to an assistant and to anonymous callers', async () => {
    const t = createTestApp()
    expect((await t.rawAs(t.sessionFor(ASSISTANT_ID), '/backup')).status).toBe(
      403
    )
    expect((await t.rawAs(null, '/backup')).status).toBe(401)
    t.close()
  })
})
