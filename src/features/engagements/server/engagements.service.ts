import { required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, isNull } from 'drizzle-orm'
import { clients } from '@/features/clients/server'
import type {
  OpenEngagementInput,
  UpdateEngagementInput,
} from '../model/terms.input'
import { engagements } from './engagements.table'
import { openEngagement } from './open-engagement'

/** Opens an engagement for an existing client, in the chosen currency (the
 * client's by default) and the client's billing identity. */
export function createEngagement(ctx: Ctx, input: OpenEngagementInput) {
  const client = required(
    ctx.db
      .select({
        currency: clients.currency,
        billingIdentityId: clients.billingIdentityId,
      })
      .from(clients)
      .where(and(eq(clients.id, input.clientId), isNull(clients.archivedAt)))
      .get(),
    'client',
    input.clientId
  )
  return openEngagement(ctx, {
    ...input,
    billingIdentityId: client.billingIdentityId,
    currency: input.currency ?? client.currency,
  })
}

/** Renames an engagement; sets its next action and payment channel. Terms stay as agreed. */
export function updateEngagement(
  ctx: Ctx,
  id: string,
  input: Required<Pick<UpdateEngagementInput, 'title' | 'nextAction'>> &
    Pick<UpdateEngagementInput, 'nextActionOn' | 'paymentChannel'>
) {
  required(
    ctx.db
      .select({ id: engagements.id })
      .from(engagements)
      .where(eq(engagements.id, id))
      .get(),
    'engagement',
    id
  )
  ctx.db
    .update(engagements)
    .set({
      title: input.title,
      nextAction: input.nextAction,
      nextActionOn: input.nextActionOn ?? null,
      paymentChannel: input.paymentChannel ?? null,
    })
    .where(eq(engagements.id, id))
    .run()
  return { id }
}
