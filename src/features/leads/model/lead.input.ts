import { z } from 'zod'
import { isoDate, optionalText } from '@/shared/model/schema'
import { currencySchema } from '@/shared/money/money.schema'

/**
 * Body of `POST /api/leads` and `PUT /api/leads/:id`. Money is in minor
 * units. WhatsApp is the international number in digits only. The stage is
 * not editable here: the board moves it (and winning is a conversion).
 */
export const leadInput = z.object({
  name: z.string().trim().min(1).max(120),
  company: optionalText(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\d{8,15})?$/, 'Digits only, with the country code')
    .optional()
    .transform((v) => (v ? v : undefined)),
  service: z.string().trim().min(1).max(200),
  amountMinor: z.number().int().nonnegative(),
  currency: currencySchema,
  source: optionalText(80),
  nextFollowUpOn: isoDate.optional(),
  notes: optionalText(2000),
})

export type LeadInput = z.input<typeof leadInput>
export type LeadFields = z.output<typeof leadInput>
