import { deleteUnused } from '@/shared/db/delete-unused'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq, sql } from 'drizzle-orm'
import { clients } from './clients.table'

function findClient(ctx: Ctx, id: string) {
  return required(
    ctx.db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, id))
      .get(),
    'client',
    id
  )
}

/**
 * `engagements` sits above `clients` (ARCHITECTURE.md §3), so its rows are
 * counted by id here, as rule 7 describes.
 */
function openEngagementCount(ctx: Ctx, clientId: string) {
  const row = ctx.db.get<{ n: number }>(
    sql`SELECT count(*) AS n FROM engagements
        WHERE client_id = ${clientId} AND archived_at IS NULL`
  )
  return row.n
}

/** Hides a client from lists; its records stay. Engagements go first. */
export function archiveClient(ctx: Ctx, id: string) {
  findClient(ctx, id)
  if (openEngagementCount(ctx, id) > 0) {
    throw new DomainError(
      'client_has_engagements',
      'Archive the client’s engagements first',
      409
    )
  }
  ctx.db
    .update(clients)
    .set({ archivedAt: ctx.now })
    .where(eq(clients.id, id))
    .run()
  return { id }
}

export function unarchiveClient(ctx: Ctx, id: string) {
  findClient(ctx, id)
  ctx.db
    .update(clients)
    .set({ archivedAt: null })
    .where(eq(clients.id, id))
    .run()
  return { id }
}

/** Removes a client added by mistake; one with any records is refused. */
export function deleteClient(ctx: Ctx, id: string) {
  findClient(ctx, id)
  deleteUnused(
    () => ctx.db.delete(clients).where(eq(clients.id, id)).run(),
    'client_in_use',
    'client'
  )
  return { id }
}
