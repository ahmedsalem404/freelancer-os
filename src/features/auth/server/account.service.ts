import type { Database } from '@/shared/db/database'
import { DomainError } from '@/shared/http/errors'
import { and, eq, ne } from 'drizzle-orm'
import { teamMembers } from '@/features/settings/server'
import { byLogin, endOtherSessions } from './sessions.service'

type AccountChange = {
  name: string
  login: string
  /** New argon2id hash; omitted keeps the current password. */
  passwordHash?: string
}

/** The stored hash of a member, to check their current password. */
export function passwordHashOf(db: Database, memberId: string) {
  return db
    .select({ passwordHash: teamMembers.passwordHash })
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .get()?.passwordHash
}

/**
 * Saves the member's own name, login and (optionally) password. A new
 * password signs out every other device, keeping the one making the change.
 */
export function saveAccount(
  db: Database,
  memberId: string,
  currentToken: string | undefined,
  change: AccountChange
) {
  const login = change.login.trim()
  const taken = db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(byLogin(login), ne(teamMembers.id, memberId)))
    .get()
  if (taken) {
    throw new DomainError('login_taken', 'Another member uses this login', 409)
  }
  db.update(teamMembers)
    .set({
      name: change.name.trim(),
      email: login,
      ...(change.passwordHash ? { passwordHash: change.passwordHash } : {}),
    })
    .where(eq(teamMembers.id, memberId))
    .run()
  if (change.passwordHash) endOtherSessions(db, memberId, currentToken)
}
