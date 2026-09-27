import { z } from 'zod'
import { TEMPLATE_KEYS, TEMPLATE_LOCALES } from './templates'

/** A template the owner edited (snapshot row). */
export const savedTemplateSchema = z.object({
  key: z.enum(TEMPLATE_KEYS),
  locale: z.enum(TEMPLATE_LOCALES),
  body: z.string(),
})

/** Body of `PUT /api/templates/:key`. */
export const templateInput = z.object({
  locale: z.enum(TEMPLATE_LOCALES),
  body: z.string().trim().min(1).max(2000),
})

export type SavedTemplate = z.infer<typeof savedTemplateSchema>
export type TemplateInput = z.infer<typeof templateInput>
