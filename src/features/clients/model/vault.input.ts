import { z } from 'zod'
import { optionalText } from '@/shared/model/schema'

/** Body of `POST /api/clients/:id/vault` (the secret is required). */
export const vaultEntryInput = z.object({
  label: z.string().trim().min(1).max(80),
  url: optionalText(500),
  username: optionalText(200),
  secret: z.string().min(1).max(2000),
  notes: optionalText(2000),
})

/** Body of `PUT /api/vault/:id`: an empty secret keeps the saved one. */
export const vaultEntryUpdate = vaultEntryInput.extend({
  secret: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => v || undefined),
})

export type VaultEntryInput = z.input<typeof vaultEntryInput>
export type VaultEntryFields = z.output<typeof vaultEntryInput>
export type VaultEntryChanges = z.output<typeof vaultEntryUpdate>

/** What `POST /api/vault/:id/reveal` returns. */
export const revealedSecretSchema = z.object({
  secret: z.string(),
  notes: z.string().optional(),
})
