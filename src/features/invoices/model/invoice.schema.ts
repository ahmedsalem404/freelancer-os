import { z } from 'zod'
import { isoDate, recordId } from '@/shared/model/schema'
import { moneyFieldsSchema } from '@/shared/money/money.schema'
import { paymentMethodKindSchema } from '@/features/settings/model/settings.schema'
import {
  INVOICE_ITEM_SOURCES,
  INVOICE_KINDS,
  INVOICE_STATES,
  PAYMENT_STATUSES,
} from './enums'

export const invoiceKindSchema = z.enum(INVOICE_KINDS)
export const invoiceItemSourceSchema = z.enum(INVOICE_ITEM_SOURCES)

export const invoiceSchema = moneyFieldsSchema.extend({
  id: recordId,
  /** Drafts have no number yet (never produced by the app today). */
  number: z.string().default(''),
  state: z.enum(INVOICE_STATES),
  kind: invoiceKindSchema,
  clientId: recordId,
  engagementId: recordId.optional(),
  billingIdentityId: recordId,
  issueOn: isoDate,
  dueOn: isoDate,
  note: z.string().optional(),
})

export const invoiceItemSchema = z.object({
  id: recordId,
  invoiceId: recordId,
  description: z.string(),
  quantity: z.number().positive(),
  /** Minor units in the invoice currency. */
  unitPrice: z.number().int().nonnegative(),
  amount: z.number().int().nonnegative(),
  sourceKind: invoiceItemSourceSchema,
  deliverableId: recordId.optional(),
  cycleId: recordId.optional(),
})

export const paymentSchema = moneyFieldsSchema.extend({
  id: recordId,
  invoiceId: recordId,
  /** Amount credited to the invoice, in the invoice currency (minor units). */
  appliedAmount: z.number().int().positive(),
  receivedOn: isoDate,
  method: paymentMethodKindSchema,
  status: z.enum(PAYMENT_STATUSES),
  reference: z.string().optional(),
})

export type Invoice = z.infer<typeof invoiceSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type Payment = z.infer<typeof paymentSchema>
