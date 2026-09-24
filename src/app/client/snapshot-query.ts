import { callApi } from '@/shared/http/api-client'
import { stripNulls } from '@/shared/model/schema'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { type Snapshot, snapshotSchema } from './snapshot.schema'

/** Accepts raw JSON (SQL NULLs) and yields the validated snapshot. */
const snapshotResponse = z.preprocess(stripNulls, snapshotSchema)

/**
 * The one read query (ARCHITECTURE.md §4). Route loaders prefetch it, so
 * screens read it synchronously; every write invalidates it.
 */
export const snapshotQuery = queryOptions({
  queryKey: ['snapshot'] as const,
  queryFn: () => callApi('GET', '/snapshot', snapshotResponse),
  staleTime: 30_000,
})

/** Every table the UI reads, validated. Must render under a route loader. */
export const useDb = (): Snapshot => useSuspenseQuery(snapshotQuery).data
