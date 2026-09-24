import { DomainError } from '@/shared/http/errors'
import type { AppEnv } from '@/shared/server/context'
import { Hono } from 'hono'

/**
 * Secrets stay locked until the encrypted vault ships (phase 3): the column
 * holds no ciphertext yet, so there is nothing safe to reveal.
 */
export const vaultRoutes = new Hono<AppEnv>().post('/vault/:id/reveal', () => {
  throw new DomainError(
    'vault_locked',
    'The vault opens once encryption ships (phase 3)',
    423
  )
})
