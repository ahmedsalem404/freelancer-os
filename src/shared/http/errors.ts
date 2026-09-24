import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * An expected business failure (missing record, rule violated). The API turns
 * it into `{ ok: false, error: { code, message } }` with its status; anything
 * else is a 500 whose details stay in the server log.
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: ContentfulStatusCode = 422
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export const notFound = (entity: string, id: string) =>
  new DomainError('not_found', `${entity} ${id} does not exist`, 404)

/** Returns the row or throws a 404 DomainError. */
export function required<T>(row: T | undefined, entity: string, id: string): T {
  if (row === undefined) throw notFound(entity, id)
  return row
}
