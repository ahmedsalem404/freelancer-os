import { type Storage, vaultKeyFile } from '@/shared/server/storage'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const ALGO = 'aes-256-gcm'
const KEY_BYTES = 32
const NONCE_BYTES = 12
const TAG_BYTES = 16

export type Sealed = { ciphertext: string; nonce: string }

/**
 * The vault key: 32 random bytes in `data/vault.key`, created on the first
 * save. Owner decision (2026-09-27): signing in is enough to open the vault,
 * so the key lives on the server. Encryption protects a leaked database
 * file; only the owner reaches the vault routes.
 */
export function vaultKey(storage: Storage, { create = false } = {}): Buffer {
  const file = vaultKeyFile(storage)
  if (existsSync(file)) {
    const key = readFileSync(file)
    if (key.length !== KEY_BYTES) throw new Error('vault.key is damaged')
    return key
  }
  if (!create) throw new Error('vault.key is missing')
  const key = randomBytes(KEY_BYTES)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, key, { mode: 0o600, flag: 'wx' })
  return key
}

/** AES-256-GCM; the row id is the AAD, so ciphertext can't move rows. */
export function seal(key: Buffer, rowId: string, plain: string): Sealed {
  const nonce = randomBytes(NONCE_BYTES)
  const cipher = createCipheriv(ALGO, key, nonce)
  cipher.setAAD(Buffer.from(rowId))
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return {
    ciphertext: Buffer.concat([body, cipher.getAuthTag()]).toString('base64'),
    nonce: nonce.toString('base64'),
  }
}

/** Reverses `seal`; throws if the data, nonce, key or row id don't match. */
export function open(key: Buffer, rowId: string, sealed: Sealed): string {
  const data = Buffer.from(sealed.ciphertext, 'base64')
  const decipher = createDecipheriv(
    ALGO,
    key,
    Buffer.from(sealed.nonce, 'base64')
  )
  decipher.setAAD(Buffer.from(rowId))
  decipher.setAuthTag(data.subarray(data.length - TAG_BYTES))
  return Buffer.concat([
    decipher.update(data.subarray(0, data.length - TAG_BYTES)),
    decipher.final(),
  ]).toString('utf8')
}
