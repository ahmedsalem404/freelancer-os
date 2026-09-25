import { useSuspenseQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/features/auth'
import { useDb } from './snapshot-query'

/** The signed-in member (the `_authenticated` route guarantees one). */
export function useCurrentMember() {
  const { team } = useDb()
  const { data: session } = useSuspenseQuery(sessionQuery)
  const member = team.find((m) => m.id === session?.id)
  if (!member) throw new Error('Signed-in member is not in the team')
  return member
}
