import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'
import { moneyFieldsSchema } from '@/shared/money/money.schema'
import { LEAD_STAGES } from './enums'

export const leadStageSchema = z.enum(LEAD_STAGES)

export const leadSchema = moneyFieldsSchema.extend({
  id: recordId,
  name: z.string(),
  company: z.string().optional(),
  whatsapp: z.string().optional(),
  service: z.string(),
  stage: leadStageSchema,
  source: z.string().default(''),
  lastContactOn: isoDate.optional(),
  nextFollowUpOn: isoDate.optional(),
  clientId: recordId.optional(),
  engagementId: recordId.optional(),
})

/** Body of `POST /api/leads/:id/stage`. */
export const moveLeadInput = z.object({ stage: leadStageSchema })

export type Lead = z.infer<typeof leadSchema>
export type MoveLeadInput = z.infer<typeof moveLeadInput>
