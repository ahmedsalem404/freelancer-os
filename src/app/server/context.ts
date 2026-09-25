import type { Database } from '@/shared/db/database'
import { DomainError } from '@/shared/http/errors'
import { isoDay } from '@/shared/model/dates'
import type { Ctx, RunInTx } from '@/shared/server/context'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { teamMembers } from '@/features/settings/server'

export type Clock = () => Date

/** Public requests (the client portal) are recorded against the owner. */
function ownerId(db: Database) {
  const owner = db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.role, 'owner'), isNull(teamMembers.archivedAt)))
    .orderBy(asc(teamMembers.createdAt))
    .limit(1)
    .get()
  if (!owner) {
    throw new DomainError(
      'no_owner',
      'No owner account — run `npm run db:reset`',
      409
    )
  }
  return owner.id
}

/** One SQLite transaction per business action; a throw rolls it back. */
export function createRunner(
  db: Database,
  clock: Clock,
  memberId?: string
): RunInTx {
  return <T>(fn: (ctx: Ctx) => T): T =>
    db.transaction((tx) => {
      const at = clock()
      return fn({
        db: tx,
        today: isoDay(at),
        now: at.toISOString(),
        memberId: memberId ?? ownerId(tx),
      })
    })
}
