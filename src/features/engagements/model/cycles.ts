/** Subscription cycles: usage windows and renewal state. */
import { daysBetween } from '@/shared/model/dates'
import type { EngagementCycle } from './engagement.schema'
import type { EngagementStatus } from './enums'

export function currentCycle(
  db: { cycles: EngagementCycle[] },
  engagementId: string
) {
  return db.cycles
    .filter(
      (c) =>
        c.engagementId === engagementId &&
        (c.decision === 'pending' || c.decision === 'grace')
    )
    .sort((a, b) => b.seq - a.seq)[0]
}

/** The open cycle, or the last one when the subscription was stopped. */
export function latestCycle(
  db: { cycles: EngagementCycle[] },
  engagementId: string
) {
  return (
    currentCycle(db, engagementId) ??
    db.cycles
      .filter((c) => c.engagementId === engagementId)
      .sort((a, b) => b.seq - a.seq)[0]
  )
}

export type SubscriptionState =
  'active' | 'due' | 'grace' | 'lapsed' | Exclude<EngagementStatus, 'active'>

export function subscriptionState(
  cycle: EngagementCycle,
  status: EngagementStatus,
  today: string,
  dueSoonDays: number
): { daysLeft: number; state: SubscriptionState } {
  const daysLeft = daysBetween(today, cycle.endsOn)
  if (status !== 'active') return { daysLeft, state: status }
  const grace = cycle.graceDays + cycle.graceExtendedDays
  if (daysLeft < -grace) return { daysLeft, state: 'lapsed' }
  if (daysLeft < 0) return { daysLeft, state: 'grace' }
  if (daysLeft <= dueSoonDays) return { daysLeft, state: 'due' }
  return { daysLeft, state: 'active' }
}
