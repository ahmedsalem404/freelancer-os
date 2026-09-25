import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callApi, seg } from '@/shared/http/api-client'
import type {
  PortalApproveInput,
  PortalFeedbackInput,
} from '../model/portal.schema'
import { portalQuery } from './portal-query'

/** A client action through the link; refreshes the portal view after. */
function usePortalAction<TVars, TResult>(
  token: string,
  request: (vars: TVars) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: portalQuery(token).queryKey }),
  })
}

const base = (token: string, deliverableId: string) =>
  `/portal/${seg(token)}/deliverables/${seg(deliverableId)}`

export const usePortalApprove = (token: string) =>
  usePortalAction(
    token,
    ({
      deliverableId,
      ...body
    }: PortalApproveInput & { deliverableId: string }) =>
      callApi(
        'POST',
        `${base(token, deliverableId)}/approval`,
        z.object({ id: z.string() }),
        body
      )
  )

export const usePortalFeedback = (token: string) =>
  usePortalAction(
    token,
    ({
      deliverableId,
      ...body
    }: PortalFeedbackInput & { deliverableId: string }) =>
      callApi(
        'POST',
        `${base(token, deliverableId)}/rounds`,
        z.object({ roundNo: z.number().int() }),
        body
      )
  )
