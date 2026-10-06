import type { Database } from '@/shared/db/database'
import { failure, success } from '@/shared/http/envelope'
import type { AppEnv } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { buildBackup } from './backup'
import type { Clock } from './context'
import { restoreBackup } from './restore'
import { MAX_RESTORE_BYTES } from './restore-archive'

/** Room for the form fields around the zip. */
const FORM_OVERHEAD = 64 * 1024

type Options = { clock: Clock; storage: Storage; migrationsDir: string }

/** Download and restore the whole system. Owner-only (not in ANY_MEMBER). */
export const createBackupRoutes = (
  db: Database,
  { clock, storage, migrationsDir }: Options
) =>
  new Hono<AppEnv>()
    .get('/backup', (c) => {
      const day = clock().toISOString().slice(0, 10)
      c.header('content-type', 'application/zip')
      c.header(
        'content-disposition',
        `attachment; filename="freelancer-os-backup-${day}.zip"`
      )
      c.header('cache-control', 'no-store')
      return c.body(buildBackup(db, storage).slice().buffer)
    })
    .post(
      '/backup/restore',
      bodyLimit({
        maxSize: MAX_RESTORE_BYTES + FORM_OVERHEAD,
        onError: (c) =>
          c.json(failure('file_too_large', 'The backup is over 200 MB'), 413),
      }),
      async (c) => {
        const form = await c.req.parseBody()
        if (!(form.file instanceof File)) {
          return c.json(failure('invalid_input', 'file: missing'), 400)
        }
        const bytes = new Uint8Array(await form.file.arrayBuffer())
        const result = restoreBackup(db, storage, bytes, {
          now: clock(),
          migrationsDir,
        })
        return c.json(success(result))
      }
    )
