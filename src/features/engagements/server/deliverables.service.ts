import { newId } from '@/shared/db/new-id'
import { DomainError } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { inArray } from 'drizzle-orm'
import { issueInvoice } from '@/features/invoices/server'
import type { AddFeedbackInput, ApproveInput } from '../model/engagement.input'
import { billingOf, findDeliverable, findEngagement, roundsFor } from './lookup'
import { approvals, reviewRounds } from './rounds.table'

/**
 * Records the next feedback round; the guard derives in/out of scope.
 * `portalLinkId` is set when the client sent it through their link.
 */
export function addFeedback(
  ctx: Ctx,
  deliverableId: string,
  input: AddFeedbackInput,
  portalLinkId?: string
) {
  findDeliverable(ctx, deliverableId)
  const last = roundsFor(ctx, deliverableId).reduce(
    (max, round) => Math.max(max, round.roundNo),
    0
  )
  const roundNo = last + 1
  ctx.db
    .insert(reviewRounds)
    .values({
      id: newId('round'),
      deliverableId,
      roundNo,
      receivedOn: ctx.today,
      note: input.note,
      source: input.source,
      portalLinkId,
      createdBy: input.source === 'client_link' ? undefined : ctx.memberId,
    })
    .run()
  return { roundNo }
}

export function approveDeliverable(
  ctx: Ctx,
  deliverableId: string,
  input: ApproveInput,
  portalLinkId?: string
) {
  findDeliverable(ctx, deliverableId)
  const id = newId('appr')
  ctx.db
    .insert(approvals)
    .values({
      id,
      deliverableId,
      source: input.source,
      decision: 'approved',
      signerName: input.signerName,
      portalLinkId,
      recordedBy: input.source === 'owner' ? ctx.memberId : undefined,
      createdAt: ctx.now,
    })
    .run()
  return { id }
}

/** Bills every out-of-scope round not yet on an invoice, in one line. */
export function billOverageRounds(ctx: Ctx, deliverableId: string) {
  const deliverable = findDeliverable(ctx, deliverableId)
  const engagement = findEngagement(ctx, deliverable.engagementId)
  const unbilled = roundsFor(ctx, deliverableId).filter(
    (round) => round.roundNo > deliverable.revisionLimit && !round.invoiceItemId
  )
  if (unbilled.length === 0) {
    throw new DomainError('nothing_to_bill', 'No unbilled extra rounds', 409)
  }

  const itemId = newId('item')
  const invoice = issueInvoice(ctx, {
    ...billingOf(ctx, engagement),
    kind: 'overage',
    items: [
      {
        id: itemId,
        description: `مراجعة إضافية — ${deliverable.title}`,
        quantity: unbilled.length,
        unitPrice: engagement.overageUnitPrice,
        sourceKind: 'revision_overage',
        deliverableId,
      },
    ],
  })
  ctx.db
    .update(reviewRounds)
    .set({ invoiceItemId: itemId })
    .where(
      inArray(
        reviewRounds.id,
        unbilled.map((round) => round.id)
      )
    )
    .run()
  return invoice
}
