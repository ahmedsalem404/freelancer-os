import { failure, success } from '@/shared/http/envelope'
import type { AppEnv } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { MAX_UPLOAD_BYTES, uploadFields } from '../model/upload.input'
import {
  deleteAttachment,
  openAttachment,
  uploadAttachment,
} from './attachments.service'

/** Room for the form fields around the file. */
const FORM_OVERHEAD = 64 * 1024

/** Owner-only (not in the gate's ANY_MEMBER list). */
export const createFilesRoutes = (storage: Storage) =>
  new Hono<AppEnv>()
    .post(
      '/files',
      bodyLimit({
        maxSize: MAX_UPLOAD_BYTES + FORM_OVERHEAD,
        onError: (c) =>
          c.json(failure('file_too_large', 'The file is over 15 MB'), 413),
      }),
      async (c) => {
        const form = await c.req.parseBody()
        const file = form.file
        const fields = uploadFields.safeParse({
          kind: form.kind,
          clientId: form.clientId || undefined,
          engagementId: form.engagementId || undefined,
          paymentId: form.paymentId || undefined,
          note: form.note || undefined,
        })
        if (!(file instanceof File) || !fields.success) {
          const why = fields.error?.issues[0]?.message ?? 'file: missing'
          return c.json(failure('invalid_input', why), 400)
        }
        const bytes = new Uint8Array(await file.arrayBuffer())
        const saved = c.var.run((ctx) =>
          uploadAttachment(ctx, storage, fields.data, {
            name: file.name,
            bytes,
          })
        )
        return c.json(success(saved), 201)
      }
    )
    .get('/files/:id', (c) => {
      const id = c.req.param('id')
      const file = c.var.run((ctx) => openAttachment(ctx, storage, id))
      c.header('content-type', file.mimeType)
      c.header(
        'content-disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`
      )
      // The type was checked from the bytes on upload; never re-guess it.
      c.header('x-content-type-options', 'nosniff')
      c.header('cache-control', 'private, no-store')
      return c.body(
        file.bytes.buffer.slice(
          file.bytes.byteOffset,
          file.bytes.byteOffset + file.bytes.byteLength
        ) as ArrayBuffer
      )
    })
    .delete('/files/:id', (c) => {
      const id = c.req.param('id')
      return c.json(
        success(c.var.run((ctx) => deleteAttachment(ctx, storage, id)))
      )
    })
