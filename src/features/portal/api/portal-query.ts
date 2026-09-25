import { z } from 'zod'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { ApiError, callApi, seg } from '@/shared/http/api-client'
import { stripNulls } from '@/shared/model/schema'
import { portalViewSchema } from '../model/portal.schema'

const portalResponse = z.preprocess(stripNulls, portalViewSchema)

/** The client's view behind a link — the only data the portal ever reads. */
export const portalQuery = (token: string) =>
  queryOptions({
    queryKey: ['portal', token] as const,
    queryFn: () => callApi('GET', `/portal/${seg(token)}`, portalResponse),
    staleTime: 30_000,
    // A dead link stays dead; only transient failures are retried.
    retry: (failures, error) =>
      failures < 2 && !(error instanceof ApiError && error.status < 500),
  })

export const usePortalView = (token: string) =>
  useSuspenseQuery(portalQuery(token)).data
