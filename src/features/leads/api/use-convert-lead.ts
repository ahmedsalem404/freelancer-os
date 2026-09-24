import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { ConvertLeadInput } from '../model/convert.input'

const converted = z.object({ clientId: z.string(), engagementId: z.string() })

/** Won = client + engagement opened in one step. */
export const useConvertLead = () =>
  useAction(({ leadId, ...body }: ConvertLeadInput & { leadId: string }) =>
    callApi('POST', `/leads/${seg(leadId)}/convert`, converted, body)
  )
