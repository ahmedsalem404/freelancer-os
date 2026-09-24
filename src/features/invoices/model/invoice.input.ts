import { z } from 'zod'
import { paymentMethodKindSchema } from '@/features/settings/model/settings.schema'

/** Body of `POST /api/invoices/:id/payments`. The server sets the date. */
export const recordPaymentInput = z.object({
  /** Minor units, in the invoice currency. */
  amountMinor: z.number().int().positive(),
  /** SAR per 1 unit of the invoice currency, as typed by the owner. */
  rateToBase: z.number().positive(),
  method: paymentMethodKindSchema,
  /** Proof file name — metadata only until uploads ship (phase 3). */
  proofName: z.string().trim().min(1).max(255).optional(),
})

/** What every "bill this" action answers with. */
export const issuedInvoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  itemIds: z.array(z.string()),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentInput>
export type IssuedInvoiceResult = z.infer<typeof issuedInvoiceSchema>
