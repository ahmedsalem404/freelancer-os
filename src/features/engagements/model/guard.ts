/**
 * The allowance guard for projects: revision rounds per deliverable and the
 * agreed scope. Pure, derived — never stored (docs/database.md §4).
 */
import type {
  Invoice,
  InvoiceItem,
} from '@/features/invoices/model/invoice.schema'
import type { Engagement } from './engagement.schema'
import type { Approval, Deliverable, ReviewRound } from './work.schema'

export type MeterState = 'ok' | 'near' | 'over'

export function allowanceState(
  included: number,
  used: number,
  nearRatio: number
): MeterState {
  if (used > included) return 'over'
  if (included > 0 && used / included >= nearRatio) return 'near'
  return 'ok'
}

export const roundsOf = (
  db: { rounds: ReviewRound[] },
  deliverableId: string
) =>
  db.rounds
    .filter((r) => r.deliverableId === deliverableId)
    .sort((a, b) => a.roundNo - b.roundNo)

export function revisionGuard(deliverable: Deliverable, rounds: ReviewRound[]) {
  const used = rounds.length
  const nextRound = used + 1
  const limit = deliverable.revisionLimit
  return {
    used,
    limit,
    nextRound,
    inScope: nextRound <= limit,
    overCount: Math.max(0, used - limit),
    unbilledOver: rounds.filter((r) => r.roundNo > limit && !r.invoiceItemId)
      .length,
  }
}

export function deliverableApproval(
  db: { approvals: Approval[] },
  deliverableId: string
) {
  const latest = db.approvals
    .filter((a) => a.deliverableId === deliverableId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return latest?.decision === 'approved' ? latest : undefined
}

export const deliverablesOf = (
  db: { deliverables: Deliverable[] },
  engagementId: string
) =>
  db.deliverables
    .filter((d) => d.engagementId === engagementId)
    .sort((a, b) => a.position - b.position)

export function scopeGuard(
  db: { deliverables: Deliverable[] },
  engagement: Engagement
) {
  const list = deliverablesOf(db, engagement.id)
  const tracked = list.filter((d) => d.origin === 'contract').length
  return {
    agreed: engagement.scopeAgreedDeliverables,
    tracked,
    changeScope: list.length - tracked,
    extras: Math.max(0, tracked - engagement.scopeAgreedDeliverables),
  }
}

/** Contract amount + every non-void scope-change line. */
export function engagementCurrentValue(
  db: { invoiceItems: InvoiceItem[]; invoices: Invoice[] },
  engagement: Engagement
) {
  const scopeLines = db.invoiceItems.filter((item) => {
    if (item.sourceKind !== 'scope_change') return false
    const invoice = db.invoices.find((i) => i.id === item.invoiceId)
    return invoice?.engagementId === engagement.id && invoice.state !== 'void'
  })
  return engagement.amount + scopeLines.reduce((s, i) => s + i.amount, 0)
}
