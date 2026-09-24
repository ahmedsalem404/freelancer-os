import { sql } from 'drizzle-orm'
import { check, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { bool, id, inList, timestamps } from '../../../shared/db/columns'
import { TEAM_ROLES } from '../model/enums'

/**
 * Owner + up to two assistants. `passwordHash` stays NULL until the auth
 * phase (ARCHITECTURE.md §6, phase 3).
 */
export const teamMembers = sqliteTable(
  'team_members',
  {
    id: id(),
    name: text().notNull(),
    role: text({ enum: TEAM_ROLES }).notNull(),
    email: text().notNull().unique(),
    whatsapp: text(),
    passwordHash: text(),
    isActive: bool().notNull().default(true),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [
    check('team_role', sql`${t.role} IN ${inList(TEAM_ROLES)}`),
    uniqueIndex('team_one_owner')
      .on(t.role)
      .where(sql`${t.role} = 'owner'`),
  ]
)
