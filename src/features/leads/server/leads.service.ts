import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import type { MoveLeadInput } from '../model/lead.schema'
import { leads } from './leads.table'

const CLOSED_STAGES = new Set(['won', 'lost'])

/** Moves a lead on the board; counts as a contact today. */
export function moveLead(ctx: Ctx, leadId: string, input: MoveLeadInput) {
  if (input.stage === 'won') {
    // Winning opens the client + engagement: that is `convertLead`.
    throw new DomainError(
      'lead_needs_conversion',
      'Convert the lead to win it',
      409
    )
  }
  required(
    ctx.db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, leadId))
      .get(),
    'lead',
    leadId
  )
  ctx.db
    .update(leads)
    .set({
      stage: input.stage,
      lastContactOn: ctx.today,
      closedAt: CLOSED_STAGES.has(input.stage) ? ctx.now : null,
    })
    .where(eq(leads.id, leadId))
    .run()
  return { id: leadId, stage: input.stage }
}
