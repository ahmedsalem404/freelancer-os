export const INVOICE_STATES = ['draft', 'issued', 'void'] as const
export const INVOICE_KINDS = [
  'standard',
  'deposit',
  'overage',
  'renewal',
  'scope',
] as const
export const INVOICE_ITEM_SOURCES = [
  'manual',
  'deposit',
  'revision_overage',
  'scope_change',
  'renewal',
] as const
export const PAYMENT_STATUSES = ['pending', 'confirmed', 'rejected'] as const

export type InvoiceState = (typeof INVOICE_STATES)[number]
export type InvoiceKind = (typeof INVOICE_KINDS)[number]
export type InvoiceItemSource = (typeof INVOICE_ITEM_SOURCES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
