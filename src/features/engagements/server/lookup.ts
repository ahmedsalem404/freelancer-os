import type { z, ZodType } from 'zod'
import { required } from '@/shared/http/errors'
import { parseRows, stripNulls } from '@/shared/model/schema'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { currentCycle } from '@/features/engagements/model/cycles'
import { latestRates } from '@/features/rates/server'
import {
  type Engagement,
  cycleSchema,
  engagementSchema,
} from '../model/engagement.schema'
import { deliverableSchema, reviewRoundSchema } from '../model/work.schema'
import { engagementCycles } from './cycles.table'
import { engagements } from './engagements.table'
import { reviewRounds } from './rounds.table'
import { deliverables } from './work.table'

function parseFound<T extends ZodType>(
  schema: T,
  row: unknown,
  entity: string,
  id: string
): z.infer<T> {
  return schema.parse(stripNulls(required(row ?? undefined, entity, id)))
}

export const findEngagement = (ctx: Ctx, id: string) =>
  parseFound(
    engagementSchema,
    ctx.db.select().from(engagements).where(eq(engagements.id, id)).get(),
    'engagement',
    id
  )

export const findDeliverable = (ctx: Ctx, id: string) =>
  parseFound(
    deliverableSchema,
    ctx.db.select().from(deliverables).where(eq(deliverables.id, id)).get(),
    'deliverable',
    id
  )

export const roundsFor = (ctx: Ctx, deliverableId: string) =>
  parseRows(
    reviewRoundSchema,
    ctx.db
      .select()
      .from(reviewRounds)
      .where(eq(reviewRounds.deliverableId, deliverableId))
      .all()
  )

/** The one pending/grace cycle of an engagement, if any. */
export function openCycle(ctx: Ctx, engagementId: string) {
  const cycles = parseRows(
    cycleSchema,
    ctx.db
      .select()
      .from(engagementCycles)
      .where(eq(engagementCycles.engagementId, engagementId))
      .all()
  )
  return currentCycle({ cycles }, engagementId)
}

/** Who and how to bill for an engagement, at today's exchange rate. */
export const billingOf = (ctx: Ctx, e: Engagement) => ({
  clientId: e.clientId,
  engagementId: e.id,
  currency: e.currency,
  rateToBase: latestRates(ctx.db)[e.currency],
})
