import { deleteUnused } from '@/shared/db/delete-unused'
import { newId } from '@/shared/db/new-id'
import { required } from '@/shared/http/errors'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { latestRates } from '@/features/rates/server'
import type { OwnSubscriptionFields } from '../model/own-subscription.input'
import { ownSubscriptions } from './finance.table'

function columns(input: OwnSubscriptionFields, rateToBase: number) {
  return {
    name: input.name,
    vendor: input.vendor ?? null,
    ...money(input.amountMinor, input.currency, rateToBase),
    period: input.period,
    nextRenewalOn: input.nextRenewalOn,
    remindDaysBefore: input.remindDaysBefore,
  }
}

function findSubscription(ctx: Ctx, id: string) {
  return required(
    ctx.db
      .select({
        currency: ownSubscriptions.currency,
        rateToBase: ownSubscriptions.rateToBase,
      })
      .from(ownSubscriptions)
      .where(eq(ownSubscriptions.id, id))
      .get(),
    'subscription',
    id
  )
}

/** Adds one of the owner's tools at today's rate (the rate is snapshotted). */
export function createOwnSubscription(ctx: Ctx, input: OwnSubscriptionFields) {
  const id = newId('osub')
  const rate = latestRates(ctx.db)[input.currency]
  ctx.db
    .insert(ownSubscriptions)
    .values({ id, ...columns(input, rate), startedOn: ctx.today })
    .run()
  return { id }
}

/** Replaces the fields; the rate stays unless the currency changes. */
export function updateOwnSubscription(
  ctx: Ctx,
  id: string,
  input: OwnSubscriptionFields
) {
  const current = findSubscription(ctx, id)
  const rate =
    current.currency === input.currency
      ? current.rateToBase
      : latestRates(ctx.db)[input.currency]
  ctx.db
    .update(ownSubscriptions)
    .set(columns(input, rate))
    .where(eq(ownSubscriptions.id, id))
    .run()
  return { id }
}

/** Stops a subscription: it leaves the list, its charges stay on record. */
export function cancelOwnSubscription(ctx: Ctx, id: string) {
  findSubscription(ctx, id)
  ctx.db
    .update(ownSubscriptions)
    .set({ cancelledOn: ctx.today })
    .where(eq(ownSubscriptions.id, id))
    .run()
  return { id }
}

/** Removes one added by mistake; recorded charges refuse the delete. */
export function deleteOwnSubscription(ctx: Ctx, id: string) {
  findSubscription(ctx, id)
  deleteUnused(
    () =>
      ctx.db.delete(ownSubscriptions).where(eq(ownSubscriptions.id, id)).run(),
    'subscription_in_use',
    'subscription'
  )
  return { id }
}
