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
  /** Acting member: the signed-in one, or the owner for public requests. */
  memberId: string
  /** Their role; assistants only reach their own tasks, time and notes. */
  role: 'owner' | 'assistant'
}

/** Runs `fn` in one SQLite transaction with a fresh context. */
export type RunInTx = <T>(fn: (ctx: Ctx) => T) => T

/** The signed-in team member behind a request (no password data). */
export type Actor = {
  id: string
  name: string
  email: string
  role: 'owner' | 'assistant'
}

/** Hono environment shared by every feature router. */
export type AppEnv = { Variables: { run: RunInTx; member: Actor | null } }
