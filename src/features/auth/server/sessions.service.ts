import type { Database } from '@/shared/db/database'
import { and, eq, isNull, lte, sql } from 'drizzle-orm'
import { createHash, randomBytes } from 'node:crypto'
import { teamMembers } from '@/features/settings/server'
import type { SessionMember } from '../model/auth.schema'
import { authSessions } from './sessions.table'

const DAY_MS = 86_400_000
/** A session lasts this long after the last request that refreshed it. */
export const SESSION_DAYS = 30
/** Refresh `expiresAt`/`lastSeenAt` at most this often (fewer writes). */
const REFRESH_MS = 3_600_000
const TOKEN_BYTES = 32
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const USER_AGENT_MAX = 300

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')
const expiryFrom = (now: Date) =>
  new Date(now.getTime() + SESSION_DAYS * DAY_MS).toISOString()

const byEmail = (email: string) =>
  sql`lower(${teamMembers.email}) = ${email.trim().toLowerCase()}`

const activeMember = and(
  eq(teamMembers.isActive, true),
  isNull(teamMembers.archivedAt)
)

/** The sign-in candidate for `email`, if it is an active account. */
export function findLoginMember(db: Database, email: string) {
  return db
    .select({ id: teamMembers.id, passwordHash: teamMembers.passwordHash })
    .from(teamMembers)
    .where(and(byEmail(email), activeMember))
    .get()
}

/** Opens a session and returns the raw token for the cookie. */
export function startSession(
  db: Database,
  memberId: string,
  now: Date,
  userAgent?: string
) {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  // Sign-in is rare: sweep every expired session then.
  db.delete(authSessions)
    .where(lte(authSessions.expiresAt, now.toISOString()))
    .run()
  db.insert(authSessions)
    .values({
      id: hashToken(token),
      memberId,
      expiresAt: expiryFrom(now),
      lastSeenAt: now.toISOString(),
      userAgent: userAgent?.slice(0, USER_AGENT_MAX),
      createdAt: now.toISOString(),
    })
    .run()
  return token
}

/**
 * The member behind a session cookie, or `null` when the token is unknown,
 * expired or its member was deactivated. Slides the expiry forward.
 */
export function resolveSession(
  db: Database,
  token: string | undefined,
  now: Date
): SessionMember | null {
  if (!token || !TOKEN_PATTERN.test(token)) return null
  const id = hashToken(token)
  const row = db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      role: teamMembers.role,
      email: teamMembers.email,
      expiresAt: authSessions.expiresAt,
      lastSeenAt: authSessions.lastSeenAt,
    })
    .from(authSessions)
    .innerJoin(teamMembers, eq(teamMembers.id, authSessions.memberId))
    .where(and(eq(authSessions.id, id), activeMember))
    .get()
  if (!row || row.expiresAt <= now.toISOString()) return null

  const lastSeen = Date.parse(row.lastSeenAt ?? '')
  if (!(now.getTime() - lastSeen < REFRESH_MS)) {
    db.update(authSessions)
      .set({ lastSeenAt: now.toISOString(), expiresAt: expiryFrom(now) })
      .where(eq(authSessions.id, id))
      .run()
  }
  return { id: row.id, name: row.name, role: row.role, email: row.email }
}

export function endSession(db: Database, token: string | undefined) {
  if (!token || !TOKEN_PATTERN.test(token)) return
  db.delete(authSessions)
    .where(eq(authSessions.id, hashToken(token)))
    .run()
}

/**
 * Stores a new password hash and signs the member out everywhere.
 * Returns false when no account has that email.
 */
export function replacePassword(db: Database, email: string, hash: string) {
  return db.transaction((tx) => {
    const member = tx
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(byEmail(email))
      .get()
    if (!member) return false
    tx.update(teamMembers)
      .set({ passwordHash: hash })
      .where(eq(teamMembers.id, member.id))
      .run()
    tx.delete(authSessions).where(eq(authSessions.memberId, member.id)).run()
    return true
  })
}
