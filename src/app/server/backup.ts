import type { Database } from '@/shared/db/database'
import { filesDir, type Storage, vaultKeyFile } from '@/shared/server/storage'
import { sql } from 'drizzle-orm'
import { type Zippable, zipSync } from 'fflate'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'

/** Every file under `dir`, keyed by its path inside the zip. */
function addFolder(zip: Zippable, dir: string, prefix: string) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) continue
    const full = join(entry.parentPath, entry.name)
    const inZip = `${prefix}/${relative(dir, full).split(sep).join('/')}`
    zip[inZip] = readFileSync(full)
  }
}

/**
 * One zip holding everything needed to restore: a consistent copy of the
 * database (`VACUUM INTO`, safe while the app runs), the uploaded files and
 * the vault key. Whoever holds the zip can read the vault — keep it private.
 */
export function buildBackup(db: Database, storage: Storage): Uint8Array {
  const tmp = mkdtempSync(join(tmpdir(), 'fos-backup-'))
  try {
    const copy = join(tmp, 'freelancer-os.db')
    db.run(sql`VACUUM INTO ${copy}`)
    const zip: Zippable = { 'freelancer-os.db': readFileSync(copy) }
    addFolder(zip, filesDir(storage), 'files')
    const keyFile = vaultKeyFile(storage)
    if (existsSync(keyFile)) zip['vault.key'] = readFileSync(keyFile)
    return zipSync(zip, { level: 6 })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
