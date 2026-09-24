import { type ZodType, z } from 'zod'

/** A failed API call; `code` is stable and maps to a translated message. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const envelopeSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), data: z.unknown() }),
  z.object({
    ok: z.literal(false),
    error: z.object({ code: z.string(), message: z.string() }),
  }),
])

type Method = 'GET' | 'POST' | 'PUT'

/**
 * Calls `/api<path>`, unwraps the `{ ok, data }` envelope and validates the
 * data with `schema` (every HTTP response is a boundary — ARCHITECTURE.md §1).
 */
export async function callApi<T>(
  method: Method,
  path: string,
  schema: ZodType<T>,
  body?: unknown
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers:
        body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('network', 'The server is not reachable', 0)
  }

  const json: unknown = await response.json().catch(() => null)
  const envelope = envelopeSchema.safeParse(json)
  if (!envelope.success) {
    throw new ApiError('bad_response', `Unexpected ${response.status}`, response.status)
  }
  if (!envelope.data.ok) {
    const { code, message } = envelope.data.error
    throw new ApiError(code, message, response.status)
  }
  return schema.parse(envelope.data.data)
}

/** `encodeURIComponent` for ids placed in a path. */
export const seg = (id: string) => encodeURIComponent(id)
