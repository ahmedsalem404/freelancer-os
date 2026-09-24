import { issueInvoice } from '@/features/invoices/server'
import { settings } from '@/features/settings/server'
import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import { addMonthsIso } from '@/shared/model/dates'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import type { ExtendGraceInput } from '../model/engagement.input'
import type { CyclePeriod } from '../model/enums'
import { billingOf, findEngagement, openCycle } from './lookup'
import { engagementCycles } from './cycles.table'
import { engagements } from './engagements.table'

const PERIOD_MONTHS: Record<CyclePeriod, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

function requireOpenCycle(ctx: Ctx, engagementId: string) {
  const cycle = openCycle(ctx, engagementId)
  if (!cycle) {
    throw new DomainError('no_open_cycle', 'This engagement has no open cycle', 409)
  }
  return cycle
}

/**
 * Renew (docs/database.md §3): close the open cycle as `renewed`, open the
 * next one, then bill it — the renewal line points at the new cycle.
 */
export function renewCycle(ctx: Ctx, engagementId: string) {
  const e = findEngagement(ctx, engagementId)
  const cycle = requireOpenCycle(ctx, engagementId)
  if (!e.cyclePeriod) {
    throw new DomainError('no_cycle_period', 'Engagement has no billing period', 409)
  }
  const setup = required(
    ctx.db.select({ graceDays: settings.defaultGraceDays }).from(settings).get(),
    'settings',
    '1'
  )
  const invoiceId = newId('inv')
  const nextId = newId('cycle')

  ctx.db
    .update(engagementCycles)
    .set({
      decision: 'renewed',
      renewalInvoiceId: invoiceId,
      decidedAt: ctx.now,
      decidedBy: ctx.memberId,
    })
    .where(eq(engagementCycles.id, cycle.id))
    .run()
  ctx.db
    .insert(engagementCycles)
    .values({
      id: nextId,
      engagementId,
      seq: cycle.seq + 1,
      startsOn: cycle.endsOn,
      endsOn: addMonthsIso(cycle.endsOn, PERIOD_MONTHS[e.cyclePeriod]),
      amount: e.amount,
      includedUnits: e.type === 'retainer' ? e.allowanceIncluded : null,
      graceDays: e.graceDays ?? setup.graceDays,
    })
    .run()
  ctx.db
    .update(engagements)
    .set({ status: 'active' })
    .where(eq(engagements.id, engagementId))
    .run()

  return issueInvoice(ctx, {
    id: invoiceId,
    ...billingOf(ctx, e),
    kind: 'renewal',
    items: [
      {
        description: `تجديد — ${e.title}`,
        quantity: 1,
        unitPrice: e.amount,
        sourceKind: 'renewal',
        cycleId: nextId,
      },
    ],
  })
}

/** Grant grace: the cycle stays open, its grace window grows. */
export function extendGrace(
  ctx: Ctx,
  engagementId: string,
  input: ExtendGraceInput
) {
  const cycle = requireOpenCycle(ctx, engagementId)
  const graceExtendedDays = cycle.graceExtendedDays + input.days
  ctx.db
    .update(engagementCycles)
    .set({
      decision: 'grace',
      graceExtendedDays,
      decidedAt: ctx.now,
      decidedBy: ctx.memberId,
    })
    .where(eq(engagementCycles.id, cycle.id))
    .run()
  return { graceExtendedDays }
}

/** Stop: close the open cycle and pause the engagement. */
export function stopCycle(ctx: Ctx, engagementId: string) {
  findEngagement(ctx, engagementId)
  const cycle = openCycle(ctx, engagementId)
  if (cycle) {
    ctx.db
      .update(engagementCycles)
      .set({ decision: 'stopped', decidedAt: ctx.now, decidedBy: ctx.memberId })
      .where(eq(engagementCycles.id, cycle.id))
      .run()
  }
  ctx.db
    .update(engagements)
    .set({ status: 'paused' })
    .where(eq(engagements.id, engagementId))
    .run()
  return { status: 'paused' as const }
}
