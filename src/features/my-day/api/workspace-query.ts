import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { bootRetry } from '@/app/client/snapshot-query'
import { callApi } from '@/shared/http/api-client'
import { workspaceResponse } from '../model/workspace.schema'

/** The signed-in member's own tasks, time and note (no money). */
export const workspaceQuery = queryOptions({
  queryKey: ['workspace'] as const,
  queryFn: () => callApi('GET', '/workspace', workspaceResponse),
  staleTime: 30_000,
  ...bootRetry,
})

export const useWorkspace = () => useSuspenseQuery(workspaceQuery).data
