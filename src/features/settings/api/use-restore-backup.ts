import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callApi } from '@/shared/http/api-client'
import { sessionQuery } from '@/features/auth'

const restored = z.object({ restored: z.literal(true), safetyCopy: z.string() })

/**
 * Replaces everything with a backup zip. The server signs everyone out, so
 * every cached answer is dropped and the sign-in page shows.
 */
export function useRestoreBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.set('file', file)
      return callApi('POST', '/backup/restore', restored, form)
    },
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(sessionQuery.queryKey, null)
    },
  })
}
