import { DomainError } from '@/shared/http/errors'
import { unzipSync } from 'fflate'

/** The largest backup zip accepted for upload. */
export const MAX_RESTORE_BYTES = 200 * 1024 * 1024
/** The most a backup may hold once unpacked (guards against zip bombs). */
const MAX_UNPACKED_BYTES = 1024 * 1024 * 1024

const DB_ENTRY = 'freelancer-os.db'
const KEY_ENTRY = 'vault.key'
const KEY_BYTES = 32
/** Same shape the file store writes: `files/<yyyy>/<id>.<ext>`. */
const FILE_ENTRY = /^files\/\d{4}\/[A-Za-z0-9_-]+\.(pdf|png|jpg|webp|gif)$/
const SQLITE_HEADER = 'SQLite format 3\0'

export type BackupArchive = {
  db: Uint8Array
  key?: Uint8Array
  /** Keyed by their path under the data folder (`files/...`). */
  files: Record<string, Uint8Array>
}

const invalid = (why: string) =>
  new DomainError('backup_invalid', `Not a Freelancer OS backup: ${why}`, 400)

function unzip(bytes: Uint8Array) {
  let unpacked = 0
  try {
    return unzipSync(bytes, {
      filter: (entry) => {
        if (entry.name.endsWith('/')) return false
        const known =
          entry.name === DB_ENTRY ||
          entry.name === KEY_ENTRY ||
          FILE_ENTRY.test(entry.name)
        if (!known) throw invalid(`unexpected entry ${entry.name}`)
        unpacked += entry.originalSize
        if (unpacked > MAX_UNPACKED_BYTES) throw invalid('too large')
        return true
      },
    })
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw invalid('not a zip file')
  }
}

/**
 * Reads a zip made by `buildBackup` and checks it before anything is
 * touched: only the known entries, a real SQLite file and a 32-byte key.
 * Paths come from a fixed pattern, so nothing can land outside `files/`.
 */
export function readBackupArchive(bytes: Uint8Array): BackupArchive {
  const entries = unzip(bytes)
  const db = entries[DB_ENTRY]
  if (!db) throw invalid('no database')
  const header = new TextDecoder().decode(db.subarray(0, SQLITE_HEADER.length))
  if (header !== SQLITE_HEADER) throw invalid('the database is damaged')
  const key = entries[KEY_ENTRY]
  if (key && key.length !== KEY_BYTES) throw invalid('the vault key is damaged')

  const files: Record<string, Uint8Array> = {}
  for (const [name, content] of Object.entries(entries)) {
    if (FILE_ENTRY.test(name)) files[name] = content
  }
  return { db, key, files }
}
