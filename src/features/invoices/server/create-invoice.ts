import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq, sql } from 'drizzle-orm'
import { clients } from '@/features/clients/server'
import { latestRates } from '@/features/rates/server'
import type { CreateInvoiceFields } from '../model/invoice.input'
import { issueInvoice } from './issue-invoice'

/**
 * The engagement must belong to the invoiced client. `engagements` sits
 * above `invoices` in the service direction (ARCHITECTURE.md §3), so the
 * back-link is checked here by id, as rule 7 describes.
 */
function checkEngagement(ctx: Ctx, engagementId: string, clientId: string) {
  const row = ctx.db.get<{ clientId: string } | undefined>(
    sql`SELECT client_id AS clientId FROM engagements WHERE id = ${engagementId}`
  )
  const engagement = required(row, 'engagement', engagementId)
  if (engagement.clientId !== clientId) {
    throw new DomainError(
      'engagement_mismatch',
      `Engagement ${engagementId} belongs to another client`
    )
  }
}

/** Issues a manual invoice in the client's currency at today's rate. */
export function createInvoice(ctx: Ctx, input: CreateInvoiceFields) {
  const client = required(
    ctx.db
      .select({ currency: clients.currency })
      .from(clients)
      .where(eq(clients.id, input.clientId))
      .get(),
    'client',
    input.clientId
  )
  if (input.engagementId) {
    checkEngagement(ctx, input.engagementId, input.clientId)
  }
  if (input.dueOn !== undefined && input.dueOn < ctx.today) {
    throw new DomainError('due_in_past', 'The due date is before today')
  }

  return issueInvoice(ctx, {
    clientId: input.clientId,
    engagementId: input.engagementId,
    kind: 'standard',
    currency: client.currency,
    rateToBase: latestRates(ctx.db)[client.currency],
    dueOn: input.dueOn,
    note: input.note,
    items: input.items.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPriceMinor,
      sourceKind: 'manual',
    })),
  })
}
