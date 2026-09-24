import { newId } from '@/shared/db/new-id'
import type { Ctx } from '@/shared/server/context'
import type { AttachmentKind } from '../model/enums'
import { attachments } from './attachments.table'

export type NewAttachment = {
  kind: AttachmentKind
  fileName: string
  clientId?: string
  engagementId?: string
  paymentId?: string
}

/** Stores attachment metadata; file upload itself arrives in phase 3. */
export function addAttachment(ctx: Ctx, input: NewAttachment) {
  const id = newId('file')
  ctx.db
    .insert(attachments)
    .values({
      id,
      ...input,
      uploadedOn: ctx.today,
      uploadedBy: ctx.memberId,
    })
    .run()
  return { id }
}
