import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startSession } from '@/features/auth/server'
import { parseSnapshot } from '../../client/snapshot.schema'
import { createApp } from '../app'
import { openDatabase, runMigrations } from '../db'
import { seedDemo } from '../seed/demo'

/** Loose view of an API envelope for assertions. */
export type Json = {
  ok: boolean
  data: Record<string, unknown>
  error?: { code: string; message: string }
}

/** Demo member ids (seed/demo-data.ts). */
export const OWNER_ID = 'm-owner'
export const ASSISTANT_ID = 'm-assistant'

/**
 * A migrated, demo-seeded in-memory API — one per test, nothing shared.
 * `call` acts as the signed-in owner; `callAs` picks the session (or none).
 */
export function createTestApp(at: Date = new Date()) {
  const { db, close } = openDatabase(':memory:')
  runMigrations(db, 'drizzle')
  seedDemo(db)
  let now = at
  const dataDir = mkdtempSync(join(tmpdir(), 'fos-test-'))
  const app = createApp(db, { clock: () => now, storage: { dataDir } })
  const ownerToken = startSession(db, OWNER_ID, at)

  async function callAs(
    token: string | null,
    method: string,
    path: string,
    body?: unknown
  ) {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['content-type'] = 'application/json'
    if (token) headers.cookie = `fos_session=${token}`
    const res = await app.request(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return { status: res.status, json: (await res.json()) as Json, res }
  }

  /** The raw response, for endpoints that don't answer JSON (downloads). */
  const rawAs = (token: string | null, path: string, init: RequestInit = {}) =>
    app.request(`/api${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        ...(token ? { cookie: `fos_session=${token}` } : {}),
      },
    })
  const raw = (path: string, init?: RequestInit) =>
    rawAs(ownerToken, path, init)

  const call = (method: string, path: string, body?: unknown) =>
    callAs(ownerToken, method, path, body)

  async function snapshot() {
    const { json } = await call('GET', '/snapshot')
    return parseSnapshot(json.data)
  }

  /** A fresh session for any member, e.g. the assistant. */
  const sessionFor = (memberId: string) => startSession(db, memberId, now)
  /** Moves the API clock (session expiry tests). */
  const setNow = (next: Date) => {
    now = next
  }

  return {
    db,
    dataDir,
    raw,
    rawAs,
    call,
    callAs,
    sessionFor,
    setNow,
    snapshot,
    close,
  }
}
