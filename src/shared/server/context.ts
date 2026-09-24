import type { Database } from '@/shared/db/database'

/**
 * What every feature service receives: the transaction handle, the clock and
 * the acting team member. Built per request by the composition root
 * (`app/server`), so services never read the wall clock themselves.
 */
export type Ctx = {
  db: Database
  /** Local calendar day, `YYYY-MM-DD`. */
  today: string
  /** Instant, ISO-8601 UTC. */
  now: string
  /** Acting member — the owner until authentication exists (phase 3). */
  memberId: string
}

/** Runs `fn` in one SQLite transaction with a fresh context. */
export type RunInTx = <T>(fn: (ctx: Ctx) => T) => T

/** Hono environment shared by every feature router. */
export type AppEnv = { Variables: { run: RunInTx } }
