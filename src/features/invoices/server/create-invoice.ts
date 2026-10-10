import { DomainError, required } from '@/shared/http/errors'
import type { Currency } from '@/shared/money/currency'
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
function checkEngagement(
  ctx: Ctx,
  engagementId: string,
  clientId: string
): Currency {
  const row = ctx.db.get<{ clientId: string; currency: Currency } | undefined>(
    sql`SELECT client_id AS clientId, currency FROM engagements WHERE id = ${engagementId}`
  )
  const engagement = required(row, 'engagement', engagementId)
  if (engagement.clientId !== clientId) {
    throw new DomainError(
      'engagement_mismatch',
      `Engagement ${engagementId} belongs to another client`
    )
  }
  return engagement.currency
}

/**
 * Issues a manual invoice at today's rate: in the engagement's currency when
 * it is tied to one (it can differ from the client's), else the client's.
 */
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
  const currency = input.engagementId
    ? checkEngagement(ctx, input.engagementId, input.clientId)
    : client.currency
  if (input.dueOn !== undefined && input.dueOn < ctx.today) {
    throw new DomainError('due_in_past', 'The due date is before today')
  }

  return issueInvoice(ctx, {
    clientId: input.clientId,
    engagementId: input.engagementId,
    kind: 'standard',
    currency,
    rateToBase: latestRates(ctx.db)[currency],
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
