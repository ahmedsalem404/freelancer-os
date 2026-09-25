import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type {
  OpenEngagementInput,
  UpdateEngagementInput,
  UpdateTermsInput,
} from '../model/terms.input'

const saved = z.object({ id: z.string() })

/** Opens an engagement for an existing client. */
export const useOpenEngagement = () =>
  useAction((body: OpenEngagementInput) =>
    callApi('POST', '/engagements', saved, body)
  )

/** Changes the agreed amount / period / hours; the type stays. */
export const useUpdateTerms = () =>
  useAction(({ id, ...body }: UpdateTermsInput & { id: string }) =>
    callApi(
      'PUT',
      `/engagements/${seg(id)}/terms`,
      z.object({ id: z.string(), appliesToOpenCycle: z.boolean() }),
      body
    )
  )

/** Renames an engagement and sets its next action. */
export const useUpdateEngagement = () =>
  useAction(({ id, ...body }: UpdateEngagementInput & { id: string }) =>
    callApi('PUT', `/engagements/${seg(id)}`, saved, body)
  )
