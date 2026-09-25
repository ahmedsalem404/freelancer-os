import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id } from '../../../shared/db/columns'
import { teamMembers } from '../../settings/server/team.table'

/**
 * Signed-in browsers (docs/database.md §3.1). `id` is the SHA-256 of the
 * session cookie; the raw token only ever lives in the cookie.
 */
export const authSessions = sqliteTable(
  'auth_sessions',
  {
    id: id(),
    memberId: text()
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'cascade' }),
    expiresAt: text().notNull(),
    lastSeenAt: text(),
    userAgent: text(),
    createdAt: text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index('auth_sessions_member').on(t.memberId)]
)
