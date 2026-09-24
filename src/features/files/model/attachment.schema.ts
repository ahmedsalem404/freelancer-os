import { isoDate, recordId } from '@/shared/model/schema'
import { z } from 'zod'
import { ATTACHMENT_KINDS } from './enums'

/** File metadata only — contents never travel in the snapshot. */
export const attachmentSchema = z.object({
  id: recordId,
  kind: z.enum(ATTACHMENT_KINDS),
  fileName: z.string(),
  clientId: recordId.optional(),
  engagementId: recordId.optional(),
  paymentId: recordId.optional(),
  uploadedOn: isoDate,
})

export type Attachment = z.infer<typeof attachmentSchema>
