import type { MiddlewareHandler } from 'hono'
import { failure } from './envelope'

type Options = {
  /** Requests allowed per window and client. */
  max: number
  windowMs: number
  now?: () => number
}

/** The visitor's address as the tunnel or proxy reports it. */
function clientKey(header: (name: string) => string | undefined) {
  return (
    header('cf-connecting-ip') ??
    header('x-forwarded-for')?.split(',')[0]?.trim() ??
    'direct'
  )
}

/**
 * Fixed-window, in-memory rate limit for public endpoints. One instance per
 * app, so state never leaks between servers (or tests). Enough for a single
 * process; a shared store is needed only when the API runs on several.
 */
export function rateLimit({
  max,
  windowMs,
  now = Date.now,
}: Options): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return async (c, next) => {
    const key = clientKey((name) => c.req.header(name))
    const at = now()
    const entry = hits.get(key)
    const current =
      entry && entry.resetAt > at ? entry : { count: 0, resetAt: at + windowMs }
    const updated = { ...current, count: current.count + 1 }
    hits.set(key, updated)
    if (updated.count > max) {
      c.header('Retry-After', String(Math.ceil((updated.resetAt - at) / 1000)))
      return c.json(failure('rate_limited', 'Too many requests'), 429)
    }
    await next()
  }
}
