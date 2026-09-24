import { z } from 'zod'
import { recordId } from '@/shared/model/schema'
import { IDENTITY_KINDS, PAYMENT_METHOD_KINDS, TEAM_ROLES } from './enums'

export const billingIdentitySchema = z.object({
  id: recordId,
  kind: z.enum(IDENTITY_KINDS),
  name: z.string(),
  tagline: z.string(),
  initials: z.string(),
  color: z.string(),
  invoiceFooter: z.string().optional(),
})

export const paymentMethodKindSchema = z.enum(PAYMENT_METHOD_KINDS)

export const paymentMethodSchema = z.object({
  id: recordId,
  billingIdentityId: recordId,
  kind: paymentMethodKindSchema,
  label: z.string(),
  details: z.string(),
})

/** Never carries the password hash (the repo does not select it). */
export const teamMemberSchema = z.object({
  id: recordId,
  name: z.string(),
  role: z.enum(TEAM_ROLES),
  email: z.string(),
})

/** What the UI reads; services read the full row from the table. */
export const settingsSchema = z.object({
  invoicePrefix: z.string(),
  invoiceSeqYear: z.number().int(),
  invoiceSeqNext: z.number().int().positive(),
  defaultDueDays: z.number().int().nonnegative(),
  reminderOffsets: z.array(z.number().int()),
  meterNearRatio: z.number().positive(),
  dueSoonDays: z.number().int().nonnegative(),
})

export type BillingIdentity = z.infer<typeof billingIdentitySchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type TeamMember = z.infer<typeof teamMemberSchema>
export type Settings = z.infer<typeof settingsSchema>
