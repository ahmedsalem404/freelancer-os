import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { latestRates } from '@/features/rates/server'
import type { LeadFields } from '../model/lead.input'
import { leads } from './leads.table'

/** Stored columns for the editable fields; blanks clear the column. */
function columns(ctx: Ctx, input: LeadFields) {
  return {
    name: input.name,
    company: input.company ?? null,
    whatsapp: input.whatsapp ?? null,
    service: input.service,
    source: input.source ?? null,
    nextFollowUpOn: input.nextFollowUpOn ?? null,
    notes: input.notes ?? null,
    ...money(
      input.amountMinor,
      input.currency,
      latestRates(ctx.db)[input.currency]
    ),
  }
}

/** A won lead is already a client and an engagement: those are edited there. */
function openLead(ctx: Ctx, id: string) {
  const lead = required(
    ctx.db.select().from(leads).where(eq(leads.id, id)).get(),
    'lead',
    id
  )
  if (lead.stage === 'won') {
    throw new DomainError(
      'lead_won',
      'A won lead is a client now; change it there',
      409
    )
  }
  return lead
}

/** Adds a lead at the start of the pipeline, contacted today. */
export function createLead(ctx: Ctx, input: LeadFields) {
  const id = newId('lead')
  ctx.db
    .insert(leads)
    .values({
      id,
      ...columns(ctx, input),
      stage: 'lead',
      lastContactOn: ctx.today,
    })
    .run()
  return { id }
}

/** Edits a lead's details; the stage stays where the board put it. */
export function updateLead(ctx: Ctx, id: string, input: LeadFields) {
  openLead(ctx, id)
  ctx.db.update(leads).set(columns(ctx, input)).where(eq(leads.id, id)).run()
  return { id }
}

/** Removes a lead that never became a client. */
export function deleteLead(ctx: Ctx, id: string) {
  openLead(ctx, id)
  ctx.db.delete(leads).where(eq(leads.id, id)).run()
  return { id }
}
