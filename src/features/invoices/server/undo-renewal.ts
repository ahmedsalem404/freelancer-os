import { DomainError } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { sql } from 'drizzle-orm'

type CycleRow = {
  id: string
  decision: string
  graceExtendedDays: number
}

/**
 * Voiding a renewal invoice undoes the renewal: the cycle it opened is
 * removed and the renewed cycle opens again. Only while nothing was built on
 * top — the new cycle is still open and no other live line bills it.
 * `engagements` sits above `invoices`, so cycles are touched by id (rule 7).
 */
export function undoRenewal(ctx: Ctx, invoiceId: string) {
  const renewed = ctx.db.get<CycleRow | undefined>(
    sql`SELECT id, decision, grace_extended_days AS graceExtendedDays
        FROM engagement_cycles WHERE renewal_invoice_id = ${invoiceId}`
  )
  const opened = ctx.db.get<CycleRow | undefined>(
    sql`SELECT cycle.id, cycle.decision,
               cycle.grace_extended_days AS graceExtendedDays
        FROM invoice_items item
        JOIN engagement_cycles cycle ON cycle.id = item.cycle_id
        WHERE item.invoice_id = ${invoiceId} AND item.source_kind = 'renewal'`
  )
  if (!renewed || !opened) {
    throw new DomainError(
      'renewal_not_found',
      `Invoice ${invoiceId} has no renewal to undo`,
      409
    )
  }
  if (opened.decision !== 'pending' && opened.decision !== 'grace') {
    throw new DomainError(
      'renewal_superseded',
      'The cycle this renewal opened is already closed',
      409
    )
  }
  const billedElsewhere = ctx.db.get<{ n: number }>(
    sql`SELECT count(*) AS n FROM invoice_items item
        JOIN invoices invoice ON invoice.id = item.invoice_id
        WHERE item.cycle_id = ${opened.id} AND item.invoice_id <> ${invoiceId}
          AND invoice.state <> 'void'`
  )
  if (billedElsewhere && billedElsewhere.n > 0) {
    throw new DomainError(
      'renewal_cycle_billed',
      'Another invoice bills the cycle this renewal opened',
      409
    )
  }

  // Voided lines on the removed cycle stay on record against the old one.
  ctx.db.run(
    sql`UPDATE invoice_items SET cycle_id = ${renewed.id}
        WHERE cycle_id = ${opened.id}`
  )
  ctx.db.run(sql`DELETE FROM engagement_cycles WHERE id = ${opened.id}`)
  const decision = renewed.graceExtendedDays > 0 ? 'grace' : 'pending'
  ctx.db.run(
    sql`UPDATE engagement_cycles
        SET decision = ${decision}, renewal_invoice_id = NULL,
            decided_at = NULL, decided_by = NULL
        WHERE id = ${renewed.id}`
  )
}
