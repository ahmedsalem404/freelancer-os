import type { Database } from '@/shared/db/database'
import { failure } from '@/shared/http/envelope'
import type { AppEnv } from '@/shared/server/context'
import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { SESSION_COOKIE } from './auth.routes'
import { resolveSession } from './sessions.service'

/** Reads the session cookie and exposes the member as `c.var.member`. */
export function sessionMember(
  db: Database,
  clock: () => Date
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE)
    c.set(
      'member',
      db.transaction((tx) => resolveSession(tx, token, clock()))
    )
    await next()
  }
}

type GateOptions = {
  /** Open to anyone (sign-in, health, the client portal). */
  isPublic: (path: string) => boolean
  /** Open to every signed-in member; everything else is owner-only. */
  anyMember: ReadonlySet<string>
}

/**
 * 401 without a session, 403 for an assistant outside `anyMember`
 * (docs/database.md §3.1: assistants never see money, the vault or settings).
 */
export function authGate({
  isPublic,
  anyMember,
}: GateOptions): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const path = c.req.path
    if (isPublic(path)) return next()
    const member = c.var.member
    if (!member) {
      return c.json(failure('unauthenticated', 'Sign in first'), 401)
    }
    if (member.role !== 'owner' && !anyMember.has(path)) {
      return c.json(failure('forbidden', 'Not allowed for this account'), 403)
    }
    // Private data: never keep it in a shared or browser cache.
    c.header('Cache-Control', 'no-store')
    await next()
  }
}
