import { DomainError } from '@/shared/http/errors'

const FOREIGN_KEY = 'SQLITE_CONSTRAINT_FOREIGNKEY'

/** better-sqlite3's code, directly or wrapped by drizzle as the `cause`. */
function isForeignKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const { code, cause } = error as { code?: unknown; cause?: unknown }
  return code === FOREIGN_KEY || isForeignKeyError(cause)
}

/**
 * Runs a hard delete that the database's foreign keys guard: a row anything
 * still points at is refused with a 409 (archive it instead). SQLite undoes
 * the failed statement only, so the surrounding transaction stays usable.
 */
export function deleteUnused(remove: () => void, code: string, entity: string) {
  try {
    remove()
  } catch (error) {
    if (!isForeignKeyError(error)) throw error
    throw new DomainError(
      code,
      `This ${entity} has records — archive it instead`,
      409
    )
  }
}
