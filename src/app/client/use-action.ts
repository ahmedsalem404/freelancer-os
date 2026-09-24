import { useMutation, useQueryClient } from '@tanstack/react-query'
import { snapshotQuery } from './snapshot-query'

/**
 * A write to the API. When it lands, the snapshot is refetched before
 * `onSuccess` callbacks run, so the screen already shows the new state.
 * Failures surface through the global mutation error toast (main.tsx).
 */
export function useAction<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: snapshotQuery.queryKey }),
  })
}
