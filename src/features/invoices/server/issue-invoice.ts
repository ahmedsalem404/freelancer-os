import { money } from '@/domain/money'
import { clients } from '@/features/clients/server'
import { settings } from '@/features/settings/server'
import { newId } from '@/shared/db/new-id'
import { required } from '@/shared/http/errors'
import { addDaysIso } from '@/shared/model/dates'
import type { Currency } from '@/shared/money/currency'
import type { Ctx } from '@/shared/server/context'
import { eq } from 'drizzle-orm'
import type { InvoiceItemSource, InvoiceKind } from '../model/enums'
import { nextInvoiceNumber } from '../model/numbering'
import { invoiceItems, invoices } from './invoices.table'

export type DraftItem = {
  /** Pre-generated when another row must point at this line first. */
  id?: string
  description: string
  quantity: number
  /** Minor units, in the invoice currency. */
  unitPrice: number
  sourceKind: InvoiceItemSource
  deliverableId?: string
  cycleId?: string
}

export type DraftInvoice = {
  id?: string
  clientId: string
  engagementId?: string
  kind: InvoiceKind
  currency: Currency
  rateToBase: number
  items: DraftItem[]
  note?: string
}

export type IssuedInvoice = { id: string; number: string; itemIds: string[] }

/**
 * Issues an invoice inside the caller's transaction: number `INV-YYYY-NNN`
 * (yearly reset), due date from settings, amounts from the lines.
 */
export function issueInvoice(ctx: Ctx, draft: DraftInvoice): IssuedInvoice {
  const setup = required(ctx.db.select().from(settings).get(), 'settings', '1')
  const client = required(
    ctx.db
      .select({ billingIdentityId: clients.billingIdentityId })
      .from(clients)
      .where(eq(clients.id, draft.clientId))
      .get(),
    'client',
    draft.clientId
  )
  const seq = nextInvoiceNumber(setup, Number(ctx.today.slice(0, 4)))
  const id = draft.id ?? newId('inv')
  const lines = draft.items.map((item, position) => ({
    ...item,
    id: item.id ?? newId('item'),
    invoiceId: id,
    position,
    amount: Math.round(item.quantity * item.unitPrice),
  }))
  const total = lines.reduce((sum, line) => sum + line.amount, 0)

  ctx.db
    .insert(invoices)
    .values({
      id,
      number: seq.number,
      state: 'issued',
      kind: draft.kind,
      clientId: draft.clientId,
      engagementId: draft.engagementId,
      billingIdentityId: client.billingIdentityId,
      issueOn: ctx.today,
      dueOn: addDaysIso(ctx.today, setup.defaultDueDays),
      note: draft.note,
      issuedAt: ctx.now,
      ...money(total, draft.currency, draft.rateToBase),
    })
    .run()
  if (lines.length > 0) ctx.db.insert(invoiceItems).values(lines).run()
  ctx.db
    .update(settings)
    .set({ invoiceSeqYear: seq.invoiceSeqYear, invoiceSeqNext: seq.invoiceSeqNext })
    .run()

  return { id, number: seq.number, itemIds: lines.map((line) => line.id) }
}
