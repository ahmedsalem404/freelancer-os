import { z } from 'zod'

/** Server configuration — validated once at startup, fails fast. */
const envSchema = z.object({
  DB_FILE: z.string().min(1).default('data/freelancer-os.db'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(5181),
  MIGRATIONS_DIR: z.string().min(1).default('drizzle'),
  /**
   * Interface the API listens on. This machine only by default: the site is
   * reached through Vite's proxy or a tunnel, never the API port directly.
   */
  API_HOST: z.string().min(1).default('127.0.0.1'),
})

export type Env = z.infer<typeof envSchema>

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`)
  }
  return parsed.data
}
