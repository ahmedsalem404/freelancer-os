import { type ZodType, z } from 'zod'

/** Calendar date `YYYY-MM-DD` (`*_on` columns). */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

/** Instant, ISO-8601 UTC (`*_at` columns). */
export const isoDateTime = z.string().min(1)

/** Record id: seed ids are readable (`c-nakhla`), new ids are prefixed ULIDs. */
export const recordId = z.string().min(1).max(64)

/** Optional form text: trimmed, and blank becomes `undefined` ("not set"). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined))

/**
 * SQL `NULL` → `undefined`, recursively. JSON from the API carries `null` for
 * empty columns; the feature schemas model them as optional fields.
 */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls)
  if (value === null || typeof value !== 'object') return value
  const entries = Object.entries(value).filter(([, v]) => v !== null)
  return Object.fromEntries(entries.map(([k, v]) => [k, stripNulls(v)]))
}

/** Database rows → schema-typed values (server services feed pure selectors). */
export const parseRows = <T extends ZodType>(
  schema: T,
  rows: readonly unknown[]
): z.infer<T>[] => z.array(schema).parse(stripNulls(rows))
