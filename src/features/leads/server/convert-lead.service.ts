import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { clients, createClient } from '@/features/clients/server'
import { openEngagement } from '@/features/engagements/server'
import type { ConvertLeadInput } from '../model/convert.input'
import { leads } from './leads.table'

/**
 * Won = converted, in one transaction (docs/database.md §3, leads):
 * client (reused or created) → engagement (lead_id) → lead marked won.
 */
export function convertLead(ctx: Ctx, leadId: string, input: ConvertLeadInput) {
  const lead = required(
    ctx.db.select().from(leads).where(eq(leads.id, leadId)).get(),
    'lead',
    leadId
  )
  if (lead.stage === 'won') {
    throw new DomainError('lead_already_won', 'This lead is already won', 409)
  }

  const clientId =
    lead.clientId ??
    createClient(ctx, {
      name: lead.name,
      company: lead.company ?? undefined,
      whatsapp: lead.whatsapp ?? undefined,
      currency: lead.currency,
    }).id
  const client = required(
    ctx.db
      .select({ billingIdentityId: clients.billingIdentityId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .get(),
    'client',
    clientId
  )
  const { id: engagementId } = openEngagement(ctx, {
    ...input,
    clientId,
    billingIdentityId: client.billingIdentityId,
    leadId,
    currency: lead.currency,
  })

  ctx.db
    .update(leads)
    .set({
      stage: 'won',
      clientId,
      engagementId,
      lastContactOn: ctx.today,
      closedAt: ctx.now,
    })
    .where(eq(leads.id, leadId))
    .run()
  return { clientId, engagementId }
}
