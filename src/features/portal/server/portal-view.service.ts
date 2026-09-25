import { DomainError, notFound, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { clients } from '@/features/clients/server'
import {
  addFeedback,
  approveDeliverable,
  engagementWork,
  findDeliverable,
  findEngagement,
} from '@/features/engagements/server'
import { billingIdentities } from '@/features/settings/server'
import type {
  PortalApproveInput,
  PortalFeedbackInput,
  PortalView,
} from '../model/portal.schema'
import { recordView, resolvePortalToken } from './portal-links.service'

function identityOf(ctx: Ctx, clientId: string) {
  const client = required(
    ctx.db
      .select({ identityId: clients.billingIdentityId })
      .from(clients)
      .where(eq(clients.id, clientId))
      .get(),
    'client',
    clientId
  )
  return required(
    ctx.db
      .select({
        name: billingIdentities.name,
        initials: billingIdentities.initials,
        color: billingIdentities.color,
      })
      .from(billingIdentities)
      .where(eq(billingIdentities.id, client.identityId))
      .get(),
    'identity',
    client.identityId
  )
}

/** The page behind a client link; every open counts as a view. */
export function loadPortalView(ctx: Ctx, token: string): PortalView {
  const link = resolvePortalToken(ctx, token)
  const engagement = findEngagement(ctx, link.engagementId)
  const work = engagementWork(ctx, engagement.id)
  recordView(ctx, link.id)
  return {
    identity: identityOf(ctx, engagement.clientId),
    engagement: { title: engagement.title },
    stages: work.stages.map((s) => ({
      id: s.id,
      title: s.title,
      isDone: s.completedAt !== undefined,
    })),
    deliverables: work.deliverables.map((d) => ({
      id: d.id,
      title: d.title,
      dueOn: d.dueOn,
      rounds: work.rounds.filter((r) => r.deliverableId === d.id).length,
      isApproved: work.approvals.some(
        (a) => a.deliverableId === d.id && a.decision === 'approved'
      ),
    })),
  }
}

/**
 * A deliverable the link may still act on: same engagement (else a plain
 * 404) and not yet approved — after approval the client can neither approve
 * again nor open new rounds, which would be billable as extras.
 */
function openDeliverable(ctx: Ctx, token: string, deliverableId: string) {
  const link = resolvePortalToken(ctx, token)
  const deliverable = findDeliverable(ctx, deliverableId)
  if (deliverable.engagementId !== link.engagementId) {
    throw notFound('deliverable', deliverableId)
  }
  const isApproved = engagementWork(ctx, link.engagementId).approvals.some(
    (a) => a.deliverableId === deliverable.id && a.decision === 'approved'
  )
  if (isApproved) {
    throw new DomainError('already_approved', 'Already approved', 409)
  }
  return { link, deliverable }
}

export function approveViaPortal(
  ctx: Ctx,
  token: string,
  deliverableId: string,
  input: PortalApproveInput
) {
  const { link, deliverable } = openDeliverable(ctx, token, deliverableId)
  return approveDeliverable(
    ctx,
    deliverable.id,
    { source: 'client_link', signerName: input.signerName },
    link.id
  )
}

export function requestChangesViaPortal(
  ctx: Ctx,
  token: string,
  deliverableId: string,
  input: PortalFeedbackInput
) {
  const { link, deliverable } = openDeliverable(ctx, token, deliverableId)
  return addFeedback(
    ctx,
    deliverable.id,
    { note: input.note, source: 'client_link' },
    link.id
  )
}
