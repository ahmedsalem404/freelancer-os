import { useDb } from './snapshot-query'

/**
 * The signed-in member. Until authentication exists (phase 3) the API acts
 * as the owner, so the UI does too.
 */
export function useCurrentMember() {
  const { team } = useDb()
  const owner = team.find((m) => m.role === 'owner') ?? team[0]
  if (!owner) throw new Error('No team member — run `npm run db:reset`')
  return owner
}
