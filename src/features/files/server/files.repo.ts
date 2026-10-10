import type { Database } from '@/shared/db/database'
import { desc, sql } from 'drizzle-orm'
import { attachments } from './attachments.table'

/** Snapshot slice owned by `files`: metadata only, never file contents. */
export function loadFiles(db: Database) {
  return {
    attachments: db
      .select({
        id: attachments.id,
        kind: attachments.kind,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        sizeBytes: attachments.sizeBytes,
        clientId: attachments.clientId,
        engagementId: attachments.engagementId,
        paymentId: attachments.paymentId,
        invoiceId: attachments.invoiceId,
        note: attachments.note,
        hasFile: sql<boolean>`${attachments.storagePath} IS NOT NULL`.mapWith(
          Boolean
        ),
        uploadedOn: attachments.uploadedOn,
      })
      .from(attachments)
      .orderBy(desc(attachments.uploadedOn))
      .all(),
  }
}
