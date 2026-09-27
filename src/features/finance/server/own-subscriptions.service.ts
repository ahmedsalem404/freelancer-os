import { deleteUnused } from '@/shared/db/delete-unused'
import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import { addMonthsIso } from '@/shared/model/dates'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { and, eq } from 'drizzle-orm'
import { latestRates } from '@/features/rates/server'
import type { OwnSubscriptionFields } from '../model/own-subscription.input'
import { expenses, ownSubscriptions } from './finance.table'

const MONTHS_IN = { monthly: 1, yearly: 12 } as const

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

/**
 * "Renewed and paid": records this period's charge as an expense (at
 * today's rate, dated on the renewal day) and moves the renewal one period
 * on. The unique (subscription, day) key refuses charging a period twice.
 */
export function renewOwnSubscription(ctx: Ctx, id: string) {
  const sub = required(
    ctx.db
      .select()
      .from(ownSubscriptions)
      .where(eq(ownSubscriptions.id, id))
      .get(),
    'subscription',
    id
  )
  const charged = ctx.db
    .select({ id: expenses.id })
    .from(expenses)
    .where(
      and(
        eq(expenses.ownSubscriptionId, id),
        eq(expenses.spentOn, sub.nextRenewalOn)
      )
    )
    .get()
  if (charged) {
    throw new DomainError('already_charged', 'This period is recorded', 409)
  }
  const expenseId = newId('exp')
  ctx.db
    .insert(expenses)
    .values({
      id: expenseId,
      title: sub.name,
      category: 'subscription',
      ...money(sub.amount, sub.currency, latestRates(ctx.db)[sub.currency]),
      spentOn: sub.nextRenewalOn,
      vendor: sub.vendor,
      ownSubscriptionId: id,
    })
    .run()
  const nextRenewalOn = addMonthsIso(sub.nextRenewalOn, MONTHS_IN[sub.period])
  ctx.db
    .update(ownSubscriptions)
    .set({ nextRenewalOn })
    .where(eq(ownSubscriptions.id, id))
    .run()
  return { id, expenseId, nextRenewalOn }
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
