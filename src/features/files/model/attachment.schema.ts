import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'
import { ATTACHMENT_KINDS } from './enums'

/** File metadata only — contents never travel in the snapshot. */
export const attachmentSchema = z.object({
  id: recordId,
  kind: z.enum(ATTACHMENT_KINDS),
  fileName: z.string(),
  clientId: recordId.optional(),
  engagementId: recordId.optional(),
  paymentId: recordId.optional(),
  invoiceId: recordId.optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  note: z.string().optional(),
  /** False for rows that only recorded a name (demo data). */
  hasFile: z.boolean().default(false),
  uploadedOn: isoDate,
})

export type Attachment = z.infer<typeof attachmentSchema>
