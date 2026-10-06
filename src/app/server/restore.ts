import type { Database } from '@/shared/db/database'
import { DomainError } from '@/shared/http/errors'
import { filesDir, type Storage, vaultKeyFile } from '@/shared/server/storage'
import { sql } from 'drizzle-orm'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { buildBackup } from './backup'
import { openDatabase, runMigrations } from './db'
import { type BackupArchive, readBackupArchive } from './restore-archive'

/** Not copied: drizzle's own bookkeeping, and sessions (everyone signs in again). */
const SKIPPED_TABLES = new Set(['__drizzle_migrations', 'auth_sessions'])

export type RestoreOptions = { now: Date; migrationsDir: string }

const invalid = (why: string) =>
  new DomainError('backup_invalid', `Not a Freelancer OS backup: ${why}`, 400)

/** Brings the backup's database up to this version and checks it is usable. */
function prepareDatabase(file: string, migrationsDir: string) {
  let conn: ReturnType<typeof openDatabase> | undefined
  try {
    conn = openDatabase(file)
    const check = conn.db.get<{ integrity_check: string }>(
      sql`PRAGMA integrity_check`
    )
    if (check?.integrity_check !== 'ok')
      throw invalid('the database is damaged')
    runMigrations(conn.db, migrationsDir)
    const owner = conn.db.get<{ n: number }>(
      sql`SELECT count(*) AS n FROM team_members WHERE role = 'owner'`
    )
    if (!owner?.n) throw invalid('it has no owner account')
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw invalid('the database can’t be opened')
  } finally {
    conn?.close()
  }
}

function tableNames(db: Database) {
  return db
    .all<{ name: string }>(
      sql`SELECT name FROM main.sqlite_master
          WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
    )
    .map((row) => row.name)
    .filter((name) => !SKIPPED_TABLES.has(name))
}

function columnsOf(db: Database, table: string) {
  return db
    .all<{ name: string }>(sql`SELECT name FROM pragma_table_info(${table})`)
    .map((col) => sql.identifier(col.name))
}

/**
 * Swaps every row for the backup's in one transaction. Foreign keys are off
 * while rows move (so cascades can't fire) and checked before the commit.
 * better-sqlite3 is synchronous: no other request runs in between.
 */
function replaceRows(db: Database, backupFile: string) {
  db.run(sql`PRAGMA foreign_keys = OFF`)
  db.run(sql`ATTACH DATABASE ${backupFile} AS backup`)
  try {
    db.transaction((tx) => {
      const tables = tableNames(tx)
      for (const table of tables) {
        tx.run(sql`DELETE FROM main.${sql.identifier(table)}`)
      }
      for (const table of tables) {
        const cols = sql.join(columnsOf(tx, table), sql`, `)
        tx.run(
          sql`INSERT INTO main.${sql.identifier(table)} (${cols})
              SELECT ${cols} FROM backup.${sql.identifier(table)}`
        )
      }
      tx.run(sql`DELETE FROM main.auth_sessions`)
      const broken = tx.all(sql`PRAGMA main.foreign_key_check`)
      if (broken.length > 0) throw invalid('its records don’t fit together')
    })
  } finally {
    db.run(sql`DETACH DATABASE backup`)
    db.run(sql`PRAGMA foreign_keys = ON`)
  }
}

function writeFiles(dir: string, files: BackupArchive['files']) {
  mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    const target = join(dir, name.slice('files/'.length))
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

/**
 * Replaces all data, uploaded files and the vault key with a backup's.
 * Checks everything first, then saves a zip of the current state under
 * `backups/` so a wrong restore can itself be undone.
 */
export function restoreBackup(
  db: Database,
  storage: Storage,
  bytes: Uint8Array,
  { now, migrationsDir }: RestoreOptions
) {
  const archive = readBackupArchive(bytes)
  const tmp = mkdtempSync(join(tmpdir(), 'fos-restore-'))
  const staged = join(storage.dataDir, 'files.restoring')
  try {
    const backupFile = join(tmp, 'freelancer-os.db')
    writeFileSync(backupFile, archive.db)
    prepareDatabase(backupFile, migrationsDir)
    rmSync(staged, { recursive: true, force: true })
    writeFiles(staged, archive.files)

    const stamp = now.toISOString().replace(/[:.]/g, '-')
    const safetyCopy = `before-restore-${stamp}.zip`
    mkdirSync(join(storage.dataDir, 'backups'), { recursive: true })
    writeFileSync(
      join(storage.dataDir, 'backups', safetyCopy),
      buildBackup(db, storage)
    )

    replaceRows(db, backupFile)
    rmSync(filesDir(storage), { recursive: true, force: true })
    renameSync(staged, filesDir(storage))
    if (archive.key) writeFileSync(vaultKeyFile(storage), archive.key)
    return { restored: true as const, safetyCopy }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
    if (existsSync(staged)) rmSync(staged, { recursive: true, force: true })
  }
}
