import { z } from 'zod'
import { optionalText } from '@/shared/model/schema'
import { currencySchema } from '@/shared/money/money.schema'

/**
 * Body of `POST /api/clients` and `PUT /api/clients/:id`. WhatsApp is the
 * international number in digits only (e.g. 9677…), as `wa.me` expects.
 */
export const clientInput = z.object({
  name: z.string().trim().min(1).max(120),
  company: optionalText(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\d{8,15})?$/, 'Digits only, with the country code')
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: z
    .union([z.literal(''), z.string().trim().email().max(200)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  city: optionalText(80),
  currency: currencySchema,
  billingIdentityId: z.string().min(1).optional(),
  notes: optionalText(2000),
})

export type ClientInput = z.input<typeof clientInput>
export type ClientFields = z.output<typeof clientInput>
