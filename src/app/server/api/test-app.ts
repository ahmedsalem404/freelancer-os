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

/** A migrated, demo-seeded in-memory API — one per test, nothing shared. */
export function createTestApp(at: Date = new Date()) {
  const { db, close } = openDatabase(':memory:')
  runMigrations(db, 'drizzle')
  seedDemo(db)
  const app = createApp(db, { clock: () => at })

  async function call(method: string, path: string, body?: unknown) {
    const res = await app.request(`/api${path}`, {
      method,
      headers:
        body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return { status: res.status, json: (await res.json()) as Json }
  }

  async function snapshot() {
    const { json } = await call('GET', '/snapshot')
    return parseSnapshot(json.data)
  }

  return { db, call, snapshot, close }
}
