import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { eq } from 'drizzle-orm'
import type { UploadFieldValues } from '../model/upload.input'
import { attachments } from './attachments.table'
import { readStoredFile, removeStoredFile, saveFile } from './file-store'

const FILE_NAME_MAX = 200

/** A name that is safe to show and to send back in a header. */
const cleanName = (name: string) =>
  name
    .replace(/[\\/\p{Cc}"]/gu, '_')
    .trim()
    .slice(-FILE_NAME_MAX) || 'file'

/** SQLite refuses an unknown client / engagement / payment id. */
const isForeignKeyError = (error: unknown) =>
  error instanceof Error &&
  'code' in error &&
  error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'

/**
 * Stores an upload: the checked file on disk, then its row. If the row is
 * refused (e.g. an unknown engagement), the file is removed again.
 */
export function uploadAttachment(
  ctx: Ctx,
  storage: Storage,
  fields: UploadFieldValues,
  file: { name: string; bytes: Uint8Array }
) {
  const id = newId('file')
  const stored = saveFile(storage, id, ctx.today.slice(0, 4), file.bytes)
  try {
    ctx.db
      .insert(attachments)
      .values({
        id,
        ...fields,
        ...stored,
        fileName: cleanName(file.name),
        uploadedOn: ctx.today,
        uploadedBy: ctx.memberId,
      })
      .run()
  } catch (error) {
    removeStoredFile(storage, stored.storagePath)
    if (isForeignKeyError(error)) {
      throw new DomainError('not_found', 'The record to attach to is gone', 404)
    }
    throw error
  }
  return { id }
}

function attachmentOf(ctx: Ctx, id: string) {
  return required(
    ctx.db.select().from(attachments).where(eq(attachments.id, id)).get(),
    'File',
    id
  )
}

/** The bytes and headers to send back for one file. */
export function openAttachment(ctx: Ctx, storage: Storage, id: string) {
  const row = attachmentOf(ctx, id)
  if (!row.storagePath || !row.mimeType) {
    throw new DomainError('file_missing', 'Only the name was recorded', 404)
  }
  return {
    bytes: readStoredFile(storage, row.storagePath),
    mimeType: row.mimeType,
    fileName: row.fileName,
  }
}

export function deleteAttachment(ctx: Ctx, storage: Storage, id: string) {
  const row = attachmentOf(ctx, id)
  ctx.db.delete(attachments).where(eq(attachments.id, id)).run()
  if (row.storagePath) removeStoredFile(storage, row.storagePath)
  return { id }
}
