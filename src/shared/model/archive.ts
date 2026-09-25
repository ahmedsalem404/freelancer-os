/**
 * Archived rows stay in the snapshot so history (invoices, time) still
 * resolves them; lists and pickers leave them out with this check.
 */
export const isArchived = (row: { archivedAt?: string }) =>
  row.archivedAt !== undefined
