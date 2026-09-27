import { DomainError } from '@/shared/http/errors'
import { filesDir, type Storage } from '@/shared/server/storage'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, normalize, sep } from 'node:path'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_TYPES,
  type UploadMime,
} from '../model/upload.input'

const startsWith = (bytes: Uint8Array, prefix: number[], at = 0) =>
  prefix.every((b, i) => bytes[at + i] === b)

/** The real type from the first bytes; a renamed .exe is refused. */
export function sniffMime(bytes: Uint8Array): UploadMime | undefined {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return 'application/pdf'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return 'image/png'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return 'image/webp'
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  return undefined
}

export type StoredFile = {
  mimeType: UploadMime
  sizeBytes: number
  sha256: string
  /** Relative to the data folder, always `files/<yyyy>/<id>.<ext>`. */
  storagePath: string
}

/** Checks and writes one upload. The path is built here, never from input. */
export function saveFile(
  storage: Storage,
  id: string,
  year: string,
  bytes: Uint8Array
): StoredFile {
  if (bytes.length === 0) {
    throw new DomainError('file_empty', 'The file is empty', 400)
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new DomainError('file_too_large', 'The file is over 15 MB', 413)
  }
  const mimeType = sniffMime(bytes)
  if (!mimeType) {
    throw new DomainError(
      'file_type',
      'Only PDF and images (PNG, JPG, WEBP, GIF)',
      415
    )
  }
  const name = `${id}.${UPLOAD_TYPES[mimeType]}`
  mkdirSync(join(filesDir(storage), year), { recursive: true })
  writeFileSync(join(filesDir(storage), year, name), bytes, { flag: 'wx' })
  return {
    mimeType,
    sizeBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    storagePath: `files/${year}/${name}`,
  }
}

/** Resolves a stored path inside the data folder (refuses anything else). */
function absolute(storage: Storage, storagePath: string) {
  const root = normalize(storage.dataDir + sep)
  const full = normalize(join(storage.dataDir, storagePath))
  if (!full.startsWith(root)) throw new Error('File path escapes data dir')
  return full
}

export function readStoredFile(storage: Storage, storagePath: string) {
  const full = absolute(storage, storagePath)
  if (!existsSync(full)) {
    throw new DomainError('file_missing', 'The file is not on disk', 404)
  }
  return readFileSync(full)
}

export function removeStoredFile(storage: Storage, storagePath: string) {
  rmSync(absolute(storage, storagePath), { force: true })
}
