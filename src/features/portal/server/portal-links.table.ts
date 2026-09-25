import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id } from '../../../shared/db/columns'
import { engagements } from '../../engagements/server/engagements.table'
import { teamMembers } from '../../settings/server/team.table'

/**
 * Public status + approve links (docs/database.md §3.6). Only the SHA-256 of
 * the URL token is stored; the token itself is shown to the owner once.
 */
export const clientPortalLinks = sqliteTable(
  'client_portal_links',
  {
    id: id(),
    engagementId: text()
      .notNull()
      .references(() => engagements.id),
    tokenHash: text().notNull().unique(),
    tokenHint: text().notNull(),
    createdBy: text()
      .notNull()
      .references(() => teamMembers.id),
    expiresAt: text(),
    revokedAt: text(),
    lastViewedAt: text(),
    viewCount: integer().notNull().default(0),
    createdAt: text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index('portal_links_engagement').on(t.engagementId)]
)
