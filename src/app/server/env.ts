import { z } from 'zod'

/** Server configuration — validated once at startup, fails fast. */
const envSchema = z.object({
  DB_FILE: z.string().min(1).default('data/freelancer-os.db'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(5181),
  MIGRATIONS_DIR: z.string().min(1).default('drizzle'),
})

export type Env = z.infer<typeof envSchema>

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`)
  }
  return parsed.data
}
