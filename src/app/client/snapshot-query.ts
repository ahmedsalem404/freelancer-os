import { z } from 'zod'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { ApiError, callApi } from '@/shared/http/api-client'
import { stripNulls } from '@/shared/model/schema'
import { type Snapshot, snapshotSchema } from './snapshot.schema'

const MAX_BOOT_RETRIES = 10
const BOOT_RETRY_MS = 500
const BAD_GATEWAY = 502

/** Network down or proxy 5xx gateway error: the API is not up yet. */
const isServerStarting = (error: Error) =>
  error instanceof ApiError &&
  (error.status === 0 || error.status >= BAD_GATEWAY)

/**
 * `npm run dev` starts web and API together: until the API listens, the
 * Vite proxy answers 502. Queries that boot a page keep retrying briefly.
 */
export const bootRetry = {
  retry: (failures: number, error: Error) =>
    failures < MAX_BOOT_RETRIES && isServerStarting(error),
  retryDelay: BOOT_RETRY_MS,
}

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
  ...bootRetry,
})

/** Every table the UI reads, validated. Must render under a route loader. */
export const useDb = (): Snapshot => useSuspenseQuery(snapshotQuery).data
