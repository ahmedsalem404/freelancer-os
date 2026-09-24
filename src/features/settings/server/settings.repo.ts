import type { Database } from '@/shared/db/database'
import { asc, isNull } from 'drizzle-orm'
import { billingIdentities, paymentMethods } from './identities.table'
import { settings } from './settings.table'
import { teamMembers } from './team.table'

/** Snapshot slice owned by `settings`. Never exposes password hashes. */
export function loadSettings(db: Database) {
  return {
    settings: db.select().from(settings).get() ?? null,
    identities: db
      .select()
      .from(billingIdentities)
      .where(isNull(billingIdentities.archivedAt))
      .all(),
    paymentMethods: db
      .select()
      .from(paymentMethods)
      .where(isNull(paymentMethods.archivedAt))
      .orderBy(asc(paymentMethods.position))
      .all(),
    team: db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        email: teamMembers.email,
        whatsapp: teamMembers.whatsapp,
        isActive: teamMembers.isActive,
      })
      .from(teamMembers)
      .where(isNull(teamMembers.archivedAt))
      .all(),
  }
}
