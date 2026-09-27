import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
])
const PDF = new TextEncoder().encode('%PDF-1.7\n%…')

function form(bytes: Uint8Array, name: string, fields: Record<string, string>) {
  const body = new FormData()
  body.set('file', new File([new Uint8Array(bytes)], name))
  for (const [k, v] of Object.entries(fields)) body.set(k, v)
  return body
}

async function upload(
  bytes: Uint8Array,
  name: string,
  fields: Record<string, string>,
  token?: string | null
) {
  const res = await (
    token === undefined
      ? t.raw
      : (p: string, i?: RequestInit) => t.rawAs(token, p, i)
  )('/files', { method: 'POST', body: form(bytes, name, fields) })
  return {
    status: res.status,
    json: (await res.json()) as {
      ok: boolean
      data: { id: string }
      error?: { code: string }
    },
  }
}

describe('files', () => {
  it('stores an upload on disk and serves it back to the owner', async () => {
    t = createTestApp(new Date('2026-09-27T09:00:00Z'))
    const res = await upload(PNG, 'chat.png', {
      kind: 'agreement_chat',
      engagementId: 'e-nakhla',
      note: 'agreed 3 revisions',
    })
    expect(res.status).toBe(201)
    const id = res.json.data.id

    const snap = await t.snapshot()
    expect(snap.attachments.find((a) => a.id === id)).toMatchObject({
      fileName: 'chat.png',
      mimeType: 'image/png',
      hasFile: true,
      note: 'agreed 3 revisions',
    })
    expect(existsSync(join(t.dataDir, 'files', '2026', `${id}.png`))).toBe(true)

    const file = await t.raw(`/files/${id}`)
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toBe('image/png')
    expect(file.headers.get('x-content-type-options')).toBe('nosniff')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(PNG)
  })

  it('attaches a proof to a payment', async () => {
    t = createTestApp()
    const snap = await t.snapshot()
    const payment = snap.payments[0]!
    const res = await upload(PDF, 'transfer.pdf', {
      kind: 'payment_proof',
      paymentId: payment.id,
    })
    expect(res.status).toBe(201)
  })

  it('refuses a file whose bytes are not a PDF or an image, whatever its name', async () => {
    t = createTestApp()
    const exe = new TextEncoder().encode('MZ\x90\x00 not really a pdf')
    const res = await upload(exe, 'invoice.pdf', {
      kind: 'contract',
      engagementId: 'e-nakhla',
    })
    expect(res.status).toBe(415)
    expect(res.json.error?.code).toBe('file_type')
  })

  it('refuses a file with no owner, and an unknown owner leaves nothing on disk', async () => {
    t = createTestApp()
    expect((await upload(PNG, 'a.png', { kind: 'other' })).status).toBe(400)
    const res = await upload(PNG, 'a.png', {
      kind: 'other',
      engagementId: 'nope',
    })
    expect(res.status).toBe(404)
    expect(existsSync(join(t.dataDir, 'files'))).toBe(true)
    const { readdirSync } = await import('node:fs')
    const years = readdirSync(join(t.dataDir, 'files'))
    const left = years.flatMap((y) => readdirSync(join(t.dataDir, 'files', y)))
    expect(left).toEqual([])
  })

  it('deletes the row and the file', async () => {
    t = createTestApp(new Date('2026-09-27T09:00:00Z'))
    const { json } = await upload(PNG, 'a.png', {
      kind: 'other',
      engagementId: 'e-nakhla',
    })
    const id = json.data.id
    expect((await t.call('DELETE', `/files/${id}`)).status).toBe(200)
    expect(existsSync(join(t.dataDir, 'files', '2026', `${id}.png`))).toBe(
      false
    )
    expect((await t.raw(`/files/${id}`)).status).toBe(404)
  })

  it('is closed to assistants and anonymous callers', async () => {
    t = createTestApp()
    const token = t.sessionFor(ASSISTANT_ID)
    expect(
      (
        await upload(
          PNG,
          'a.png',
          { kind: 'other', engagementId: 'e-nakhla' },
          token
        )
      ).status
    ).toBe(403)
    expect(
      (
        await upload(
          PNG,
          'a.png',
          { kind: 'other', engagementId: 'e-nakhla' },
          null
        )
      ).status
    ).toBe(401)
  })
})
