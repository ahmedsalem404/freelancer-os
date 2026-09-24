import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { count, eq } from 'drizzle-orm'
import { issueInvoice } from '@/features/invoices/server'
import { settings } from '@/features/settings/server'
import type { ChangeScopeInput } from '../model/engagement.input'
import { billingOf, findEngagement } from './lookup'
import { deliverables } from './work.table'

/**
 * Change scope = a new billed deliverable. The deliverable row is written
 * first (it points at its invoice line by plain id), then the invoice whose
 * line points back at the deliverable (FK) — both in the caller's transaction.
 */
export function changeScope(
  ctx: Ctx,
  engagementId: string,
  input: ChangeScopeInput
) {
  const engagement = findEngagement(ctx, engagementId)
  if (engagement.type !== 'project') {
    throw new DomainError(
      'not_a_project',
      'Only projects track deliverables',
      409
    )
  }
  const setup = required(
    ctx.db
      .select({ defaultRevisionLimit: settings.defaultRevisionLimit })
      .from(settings)
      .get(),
    'settings',
    '1'
  )
  const existing = ctx.db
    .select({ n: count() })
    .from(deliverables)
    .where(eq(deliverables.engagementId, engagementId))
    .get()

  const deliverableId = newId('dlv')
  const itemId = newId('item')
  ctx.db
    .insert(deliverables)
    .values({
      id: deliverableId,
      engagementId,
      title: input.title,
      dueOn: input.dueOn,
      revisionLimit: setup.defaultRevisionLimit,
      origin: 'change_scope',
      invoiceItemId: itemId,
      position: existing?.n ?? 0,
    })
    .run()

  return issueInvoice(ctx, {
    ...billingOf(ctx, engagement),
    kind: 'scope',
    items: [
      {
        id: itemId,
        description: `توسعة نطاق — ${input.title}`,
        quantity: 1,
        unitPrice: input.feeMinor,
        sourceKind: 'scope_change',
        deliverableId,
      },
    ],
  })
}
