import { isoDate, recordId } from '@/shared/model/schema'
import { z } from 'zod'
import { DATE_KINDS } from './enums'

export const importantDateSchema = z.object({
  id: recordId,
  title: z.string(),
  kind: z.enum(DATE_KINDS),
  dueOn: isoDate,
  clientId: recordId.optional(),
})

export type ImportantDate = z.infer<typeof importantDateSchema>
