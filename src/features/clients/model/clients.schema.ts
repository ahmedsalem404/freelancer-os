import { z } from 'zod'
import { isoDateTime, recordId } from '@/shared/model/schema'
import { currencySchema } from '@/shared/money/money.schema'
import { CLIENT_KINDS } from './enums'

export const clientSchema = z.object({
  id: recordId,
  name: z.string(),
  company: z.string().optional(),
  kind: z.enum(CLIENT_KINDS),
  whatsapp: z.string().default(''),
  email: z.string().optional(),
  city: z.string().default(''),
  notes: z.string().optional(),
  timezone: z.string(),
  currency: currencySchema,
  billingIdentityId: recordId,
  color: z.string(),
  createdAt: isoDateTime,
})

/** The UI never holds secrets — only labels. Secrets are revealed on demand. */
export const vaultEntrySchema = z.object({
  id: recordId,
  clientId: recordId,
  label: z.string(),
  username: z.string().default(''),
  url: z.string().optional(),
})

export type Client = z.infer<typeof clientSchema>
export type VaultEntry = z.infer<typeof vaultEntrySchema>
