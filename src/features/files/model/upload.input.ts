import { z } from 'zod'
import { optionalText } from '@/shared/model/schema'
import { ATTACHMENT_KINDS } from './enums'

/** Largest file the server accepts (a phone photo or a long PDF). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

/** What a file may be: checked against the bytes, never the name. */
export const UPLOAD_TYPES = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const

export type UploadMime = keyof typeof UPLOAD_TYPES

/** The `accept` attribute for file pickers. */
export const UPLOAD_ACCEPT = Object.keys(UPLOAD_TYPES).join(',')

/** The form fields sent with the file to `POST /api/files`. */
export const uploadFields = z
  .object({
    kind: z.enum(ATTACHMENT_KINDS).exclude(['logo']),
    clientId: z.string().min(1).optional(),
    engagementId: z.string().min(1).optional(),
    paymentId: z.string().min(1).optional(),
    invoiceId: z.string().min(1).optional(),
    note: optionalText(500),
  })
  .refine((f) => f.clientId ?? f.engagementId ?? f.paymentId, {
    message: 'A file belongs to a client, an engagement or a payment',
  })
  .refine((f) => f.kind !== 'payment_proof' || f.paymentId, {
    message: 'A payment proof needs its payment',
  })
  .refine((f) => f.kind !== 'invoice' || (f.invoiceId && f.engagementId), {
    message: 'An invoice copy needs its invoice and engagement',
  })

export type UploadFields = z.input<typeof uploadFields>
export type UploadFieldValues = z.output<typeof uploadFields>
