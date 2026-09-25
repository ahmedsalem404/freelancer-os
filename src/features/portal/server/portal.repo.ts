import type { Database } from '@/shared/db/database'
import { isNull } from 'drizzle-orm'
import { clientPortalLinks } from './portal-links.table'

/** Snapshot slice owned by `portal`: active links, never their hashes. */
export function loadPortal(db: Database) {
  return {
    portalLinks: db
      .select({
        id: clientPortalLinks.id,
        engagementId: clientPortalLinks.engagementId,
        tokenHint: clientPortalLinks.tokenHint,
        viewCount: clientPortalLinks.viewCount,
        lastViewedAt: clientPortalLinks.lastViewedAt,
        createdAt: clientPortalLinks.createdAt,
      })
      .from(clientPortalLinks)
      .where(isNull(clientPortalLinks.revokedAt))
      .all(),
  }
}
