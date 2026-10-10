import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { LeadInput } from '../model/lead.input'

const saved = z.object({ id: z.string() })

/** Adds a lead, or replaces its details when `leadId` is given. */
export const useSaveLead = () =>
  useAction(({ leadId, ...body }: LeadInput & { leadId?: string }) =>
    leadId
      ? callApi('PUT', `/leads/${seg(leadId)}`, saved, body)
      : callApi('POST', '/leads', saved, body)
  )

export const useDeleteLead = () =>
  useAction((leadId: string) =>
    callApi('DELETE', `/leads/${seg(leadId)}`, saved)
  )
