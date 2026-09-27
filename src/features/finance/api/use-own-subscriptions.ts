import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { OwnSubscriptionInput } from '../model/own-subscription.input'

const saved = z.object({ id: z.string() })

/** Adds one of the owner's tools, or replaces it when `id` is given. */
export const useSaveOwnSubscription = () =>
  useAction(({ id, ...body }: OwnSubscriptionInput & { id?: string }) =>
    id
      ? callApi('PUT', `/own-subscriptions/${seg(id)}`, saved, body)
      : callApi('POST', '/own-subscriptions', saved, body)
  )

/** Records this period's charge as an expense and moves the renewal on. */
export const useRenewOwnSubscription = () =>
  useAction((id: string) =>
    callApi('POST', `/own-subscriptions/${seg(id)}/renew`, saved)
  )

export const useCancelOwnSubscription = () =>
  useAction((id: string) =>
    callApi('POST', `/own-subscriptions/${seg(id)}/cancel`, saved)
  )

export const useDeleteOwnSubscription = () =>
  useAction((id: string) =>
    callApi('DELETE', `/own-subscriptions/${seg(id)}`, saved)
  )
