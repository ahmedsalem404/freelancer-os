import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { LeadStage } from '../model/enums'
import { leadStageSchema } from '../model/lead.schema'

export const useMoveLead = () =>
  useAction(({ leadId, stage }: { leadId: string; stage: LeadStage }) =>
    callApi(
      'POST',
      `/leads/${seg(leadId)}/stage`,
      z.object({ id: z.string(), stage: leadStageSchema }),
      { stage }
    )
  )
