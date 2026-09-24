import { ulid } from 'ulid'

/** Id for a new row: `<prefix>_<ULID>` — sortable, readable in logs. */
export const newId = (prefix: string) => `${prefix}_${ulid().toLowerCase()}`
