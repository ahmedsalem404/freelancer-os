import { join } from 'node:path'

/**
 * Where the server keeps what is not in SQLite: uploaded files and the vault
 * key. Built once by the composition root (`app/server`); tests point it at a
 * temporary folder.
 */
export type Storage = {
  /** The data folder (next to the database file). */
  dataDir: string
}

/** Uploaded files: `<dataDir>/files/<yyyy>/<id>.<ext>`. */
export const filesDir = (storage: Storage) => join(storage.dataDir, 'files')

/** The vault's AES-256 key (32 random bytes, created on first use). */
export const vaultKeyFile = (storage: Storage) =>
  join(storage.dataDir, 'vault.key')
