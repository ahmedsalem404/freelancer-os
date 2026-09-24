import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagements } from '../../engagements/server/engagements.table'
import { payments } from '../../invoices/server/payments.table'
import { teamMembers } from '../../settings/server/team.table'
import { ATTACHMENT_KINDS } from '../model/enums'

/**
 * Attachment metadata; files live on disk under data/files/. `mimeType`,
 * `sizeBytes`, `sha256` and `storagePath` stay NULL for demo rows until the
 * upload endpoint lands (ARCHITECTURE.md §6, phase 3).
 */
export const attachments = sqliteTable(
  'attachments',
  {
    id: id(),
    kind: text({ enum: ATTACHMENT_KINDS }).notNull(),
    fileName: text().notNull(),
    mimeType: text(),
    sizeBytes: integer(),
    sha256: text(),
    storagePath: text(),
    clientId: text().references(() => clients.id),
    engagementId: text().references(() => engagements.id),
    paymentId: text().references(() => payments.id),
    note: text(),
    uploadedOn: text().notNull(),
    uploadedBy: text()
      .notNull()
      .references(() => teamMembers.id),
    ...timestamps(),
  },
  (t) => [
    check('attachment_kind', sql`${t.kind} IN ${inList(ATTACHMENT_KINDS)}`),
    check(
      'attachment_has_owner',
      sql`${t.kind} = 'logo' OR COALESCE(${t.clientId}, ${t.engagementId}, ${t.paymentId}) IS NOT NULL`
    ),
    check(
      'attachment_proof_owner',
      sql`${t.kind} <> 'payment_proof' OR ${t.paymentId} IS NOT NULL`
    ),
    index('attachments_client').on(t.clientId),
    index('attachments_engagement').on(t.engagementId),
    index('attachments_payment').on(t.paymentId),
  ]
)
