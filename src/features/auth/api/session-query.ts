import { queryOptions } from '@tanstack/react-query'
import { bootRetry } from '@/app/client/snapshot-query'
import { ApiError, callApi } from '@/shared/http/api-client'
import { type SessionMember, sessionMemberSchema } from '../model/auth.schema'

const UNAUTHORIZED = 401

/**
 * Who is signed in, or `null`. The API is the judge; this only decides
 * which screen to show. Sign-in and sign-out replace it directly.
 */
export const sessionQuery = queryOptions({
  queryKey: ['session'] as const,
  queryFn: async (): Promise<SessionMember | null> => {
    try {
      return await callApi('GET', '/auth/me', sessionMemberSchema)
    } catch (error) {
      if (error instanceof ApiError && error.status === UNAUTHORIZED) {
        return null
      }
      throw error
    }
  },
  staleTime: Infinity,
  ...bootRetry,
})

/**
 * Where to go after signing in: only a path on this site, so a crafted
 * `?redirect=` can't send the owner to another site.
 */
export function safeRedirect(target: string | undefined) {
  if (!target) return '/'
  try {
    const url = new URL(target, window.location.origin)
    if (url.origin !== window.location.origin) return '/'
    if (url.pathname.startsWith('/sign-in')) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
