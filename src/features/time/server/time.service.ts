import { newId } from '@/shared/db/new-id'
import type { Ctx } from '@/shared/server/context'
import { findEngagement } from '@/features/engagements/server'
import type { LogTimeInput } from '../model/time.schema'
import { timeEntries } from './time.table'

/** Logs today's work for the acting member; retainer hours use the allowance. */
export function logTime(ctx: Ctx, input: LogTimeInput) {
  const engagement = input.engagementId
    ? findEngagement(ctx, input.engagementId)
    : undefined
  const id = newId('time')
  ctx.db
    .insert(timeEntries)
    .values({
      id,
      memberId: ctx.memberId,
      engagementId: engagement?.id,
      clientId: engagement?.clientId,
      description: input.description,
      minutes: input.minutes,
      workOn: ctx.today,
      billable: input.billable,
      countsToAllowance: engagement?.type === 'retainer',
    })
    .run()
  return { id }
}
