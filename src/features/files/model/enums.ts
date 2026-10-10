export const ATTACHMENT_KINDS = [
  'agreement_chat',
  'contract',
  'payment_proof',
  'receipt',
  'invoice',
  'deliverable_file',
  'logo',
  'other',
] as const

export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]
