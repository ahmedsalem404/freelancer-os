import type { Database } from '@/shared/db/database'
import { asc } from 'drizzle-orm'
import { clients, vaultEntries } from './clients.table'

/** Snapshot slice owned by `clients`. The vault lists labels only. */
export function loadClients(db: Database) {
  return {
    // Archived clients stay: their invoices and history still point at them.
    clients: db.select().from(clients).orderBy(asc(clients.name)).all(),
    vault: db
      .select({
        id: vaultEntries.id,
        clientId: vaultEntries.clientId,
        label: vaultEntries.label,
        url: vaultEntries.url,
        username: vaultEntries.username,
      })
      .from(vaultEntries)
      .all(),
  }
}
