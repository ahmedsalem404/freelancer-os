import { DomainError } from '@/shared/http/errors'
import { money } from '@/shared/money/money'
import type { Ctx } from '@/shared/server/context'
import { eq, sql } from 'drizzle-orm'
import type { UpdateTermsInput } from '../model/terms.input'
import { engagementCycles } from './cycles.table'
import { engagements } from './engagements.table'
import { findEngagement, openCycle } from './lookup'

/** A non-void invoice line already bills this cycle (renewal). */
function isCycleBilled(ctx: Ctx, cycleId: string) {
  const row = ctx.db.get<{ n: number }>(
    sql`SELECT count(*) AS n FROM invoice_items AS item
        JOIN invoices AS invoice ON invoice.id = item.invoice_id
        WHERE item.cycle_id = ${cycleId} AND invoice.state <> 'void'`
  )
  return row.n > 0
}

/**
 * Changes what an engagement is agreed at. The type is fixed. The open
 * cycle takes the new amount only while nothing bills it yet;
 * otherwise they start with the next renewal. Issued invoices never change,
 * and the stored exchange rate stays (a typo fix never revalues).
 */
export function updateTerms(ctx: Ctx, id: string, input: UpdateTermsInput) {
  const e = findEngagement(ctx, id)
  if (input.type !== e.type) {
    throw new DomainError(
      'type_locked',
      'The engagement type is fixed once opened',
      409
    )
  }
  ctx.db
    .update(engagements)
    .set({
      ...money(input.amountMinor, e.currency, e.rateToBase),
      cyclePeriod: e.type === 'project' ? null : input.cyclePeriod,
    })
    .where(eq(engagements.id, id))
    .run()

  const cycle = openCycle(ctx, id)
  const appliesToOpenCycle =
    cycle !== undefined && !isCycleBilled(ctx, cycle.id)
  if (cycle && appliesToOpenCycle) {
    ctx.db
      .update(engagementCycles)
      .set({ amount: input.amountMinor })
      .where(eq(engagementCycles.id, cycle.id))
      .run()
  }
  return { id, appliesToOpenCycle }
}
