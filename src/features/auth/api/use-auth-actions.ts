import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callApi } from '@/shared/http/api-client'
import { type SignInInput, sessionMemberSchema } from '../model/auth.schema'
import { sessionQuery } from './session-query'

/** Signs in; on success the session query holds the member. */
export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SignInInput) =>
      callApi('POST', '/auth/sign-in', sessionMemberSchema, input),
    onSuccess: (member) => {
      queryClient.setQueryData(sessionQuery.queryKey, member)
    },
  })
}

/** Signs out and forgets every cached answer (they were private). */
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      callApi(
        'POST',
        '/auth/sign-out',
        z.object({ signedOut: z.literal(true) })
      ),
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(sessionQuery.queryKey, null)
    },
  })
}
