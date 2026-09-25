import { failure, success } from '@/shared/http/envelope'
import { rateLimit } from '@/shared/http/rate-limit'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { type Context, Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { signInInput } from '../model/auth.schema'
import { decoyHash, verifyPassword } from './password'
import {
  SESSION_DAYS,
  endSession,
  findLoginMember,
  resolveSession,
  startSession,
} from './sessions.service'

export const SESSION_COOKIE = 'fos_session'
/** Sign-in attempts per minute from one visitor (argon2 also slows each). */
const SIGN_IN_PER_MINUTE = 10
const MINUTE_MS = 60_000
const DAY_SECONDS = 86_400

/** HTTPS directly or through the tunnel (Cloudflare sets the header). */
const isHttps = (c: Context) =>
  new URL(c.req.url).protocol === 'https:' ||
  c.req.header('x-forwarded-proto') === 'https'

/**
 * HttpOnly: page scripts can't read it. SameSite=Strict: other sites can't
 * make the browser send it, which is the CSRF defence for every write.
 */
const cookieOptions = (c: Context) =>
  ({
    httpOnly: true,
    sameSite: 'Strict',
    secure: isHttps(c),
    path: '/api',
  }) as const

/** Built per app so the sign-in limiter's state is per app (and per test). */
export function createAuthRoutes() {
  return new Hono<AppEnv>()
    .use(
      '/auth/sign-in',
      rateLimit({ max: SIGN_IN_PER_MINUTE, windowMs: MINUTE_MS })
    )
    .post('/auth/sign-in', jsonBody(signInInput), async (c) => {
      const { email, password } = c.req.valid('json')
      const candidate = c.var.run((ctx) => findLoginMember(ctx.db, email))
      const stored = candidate?.passwordHash ?? (await decoyHash())
      const valid = await verifyPassword(password, stored)
      if (!candidate?.passwordHash || !valid) {
        return c.json(
          failure('invalid_credentials', 'Wrong email or password'),
          401
        )
      }
      const userAgent = c.req.header('user-agent')
      const { token, member } = c.var.run((ctx) => {
        const now = new Date(ctx.now)
        const opened = startSession(ctx.db, candidate.id, now, userAgent)
        return { token: opened, member: resolveSession(ctx.db, opened, now) }
      })
      setCookie(c, SESSION_COOKIE, token, {
        ...cookieOptions(c),
        maxAge: SESSION_DAYS * DAY_SECONDS,
      })
      return c.json(success(member))
    })
    .post('/auth/sign-out', (c) => {
      const token = getCookie(c, SESSION_COOKIE)
      c.var.run((ctx) => endSession(ctx.db, token))
      deleteCookie(c, SESSION_COOKIE, cookieOptions(c))
      return c.json(success({ signedOut: true }))
    })
    .get('/auth/me', (c) => c.json(success(c.var.member)))
}
