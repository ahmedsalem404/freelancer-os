import type { Snapshot as Db } from '@/app/client/snapshot.schema'
import { clientHealth } from '@/features/clients/model/client-health'
import { engagementCurrentValue } from '@/features/engagements/model/guard'
import { engagementMeter } from '@/features/engagements/model/meter'
import { invoiceBalance, invoiceStatus } from '@/features/invoices/model/invoice-status'
import { seedDb, today } from './seed/demo-data'
import { sql } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { parseSnapshot } from '../client/snapshot.schema'
import { openDatabase, runMigrations } from './db'
import { seedDemo } from './seed/demo'
import { loadSnapshot } from './snapshot'

function seededSnapshot() {
  const { db, close } = openDatabase(':memory:')
  runMigrations(db, 'drizzle')
  seedDemo(db)
  const snapshot = loadSnapshot(db)
  const fkViolations = db.all(sql`PRAGMA foreign_key_check`)
  close()
  return { snapshot, fkViolations }
}

describe('SQLite round trip (migrate → seed → snapshot)', () => {
  const mock = seedDb()
  const { snapshot, fkViolations } = seededSnapshot()
  // The same JSON → Zod path the browser takes (throws if the schema drifts).
  const fromDb: Db = parseSnapshot(JSON.parse(JSON.stringify(snapshot)))
  const day = today()

  it('stores every demo row with no foreign-key violations', () => {
    expect(fkViolations).toEqual([])
    for (const key of Object.keys(mock) as (keyof Db)[]) {
      const expected = mock[key]
      if (Array.isArray(expected)) {
        expect(fromDb[key], key).toHaveLength(expected.length)
      }
    }
  })

  it('never sends password hashes or vault secrets', () => {
    expect(snapshot.team.every((m) => !('passwordHash' in m))).toBe(true)
    expect(snapshot.vault.every((v) => !('ciphertext' in v))).toBe(true)
  })

  it('keeps invoice status and balance identical to the mock', () => {
    for (const invoice of mock.invoices) {
      const stored = fromDb.invoices.find((i) => i.id === invoice.id)!
      expect(invoiceStatus(fromDb, stored, day)).toBe(
        invoiceStatus(mock, invoice, day)
      )
      expect(invoiceBalance(fromDb, stored)).toBe(invoiceBalance(mock, invoice))
    }
  })

  it('keeps the allowance guard identical to the mock', () => {
    for (const engagement of mock.engagements) {
      const stored = fromDb.engagements.find((e) => e.id === engagement.id)!
      expect(engagementMeter(fromDb, stored, day)).toEqual(
        engagementMeter(mock, engagement, day)
      )
      expect(engagementCurrentValue(fromDb, stored)).toBe(
        engagementCurrentValue(mock, engagement)
      )
    }
  })

  it('keeps client health identical to the mock', () => {
    for (const client of mock.clients) {
      expect(clientHealth(fromDb, client.id, day)).toBe(
        clientHealth(mock, client.id, day)
      )
    }
  })

  it("exposes today's exchange rate first", () => {
    expect(snapshot.dailyRates[0]).toEqual({
      day,
      sarInYer: 425,
      usdInYer: 1600,
    })
  })
})
