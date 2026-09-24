import { retainerOverage } from '@/features/engagements/model/cycles'
import {
  billingOf,
  findEngagement,
  openCycle,
} from '@/features/engagements/server'
import { engagementInvoices, issueInvoice } from '@/features/invoices/server'
import { DomainError } from '@/shared/http/errors'
import { parseRows } from '@/shared/model/schema'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import { timeEntrySchema } from '../model/time.schema'
import { timeEntries } from './time.table'

/**
 * Bills retainer hours above the open cycle's allowance that are not on an
 * invoice yet. Lives in `time` because it reads time entries (engagements
 * never import time — ARCHITECTURE.md §3).
 */
export function billExtraHours(ctx: Ctx, engagementId: string) {
  const engagement = findEngagement(ctx, engagementId)
  const cycle = openCycle(ctx, engagementId)
  if (engagement.type !== 'retainer' || !cycle) {
    throw new DomainError(
      'not_billable',
      'Only an open retainer cycle bills extra hours',
      409
    )
  }
  const entries = parseRows(
    timeEntrySchema,
    ctx.db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.engagementId, engagementId))
      .all()
  )
  const { unbilled } = retainerOverage(
    { timeEntries: entries, ...engagementInvoices(ctx.db, engagementId) },
    engagementId,
    cycle
  )
  if (unbilled <= 0) {
    throw new DomainError('nothing_to_bill', 'No unbilled extra hours', 409)
  }
  return issueInvoice(ctx, {
    ...billingOf(ctx, engagement),
    kind: 'overage',
    items: [
      {
        description: `ساعات إضافية خارج الباقة — ${engagement.title}`,
        quantity: unbilled,
        unitPrice: engagement.overageUnitPrice,
        sourceKind: 'retainer_overage',
        cycleId: cycle.id,
      },
    ],
  })
}
