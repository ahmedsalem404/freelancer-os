import { z } from 'zod'
import { isoDate, optionalText } from '@/shared/model/schema'
import { paymentMethodKindSchema } from '@/features/settings/model/settings.schema'

/** Most lines one invoice can carry. */
const MAX_LINES = 50

/** One line of a manual invoice. Prices in minor units. */
export const invoiceLineInput = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().positive().max(10_000),
  unitPriceMinor: z.number().int().positive(),
})

/**
 * Body of `POST /api/invoices`: a manual invoice, issued at once in the
 * client's currency. Without `dueOn` the settings' default terms apply.
 */
export const createInvoiceInput = z.object({
  clientId: z.string().min(1),
  engagementId: z.string().min(1).optional(),
  items: z.array(invoiceLineInput).min(1).max(MAX_LINES),
  dueOn: isoDate.optional(),
  note: optionalText(1000),
})

/** Body of `POST /api/invoices/:id/void`. */
export const voidInvoiceInput = z.object({
  reason: z.string().trim().min(1).max(300),
})

/** Body of `POST /api/invoices/:id/payments`. The server sets the date. */
export const recordPaymentInput = z.object({
  /** Minor units, in the invoice currency. */
  amountMinor: z.number().int().positive(),
  /** SAR per 1 unit of the invoice currency, as typed by the owner. */
  rateToBase: z.number().positive(),
  method: paymentMethodKindSchema,
  /** Proof file name — metadata only until uploads ship (phase 3). */
})

/** What every "bill this" action answers with. */
export const issuedInvoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  itemIds: z.array(z.string()),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentInput>
export type InvoiceLineInput = z.infer<typeof invoiceLineInput>
export type CreateInvoiceInput = z.input<typeof createInvoiceInput>
export type CreateInvoiceFields = z.output<typeof createInvoiceInput>
export type VoidInvoiceInput = z.infer<typeof voidInvoiceInput>
export type IssuedInvoiceResult = z.infer<typeof issuedInvoiceSchema>
