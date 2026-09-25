import { argon2, randomBytes, timingSafeEqual } from 'node:crypto'

/** OWASP minimum for argon2id: 19 MiB, 2 passes, 1 lane. */
const PARAMS = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 }
const SALT_BYTES = 16
const PHC_PATTERN =
  /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/

type Params = typeof PARAMS

function derive(password: string, salt: Buffer, params: Params) {
  return new Promise<Buffer>((resolve, reject) =>
    argon2(
      'argon2id',
      { message: password, nonce: salt, ...params },
      (error, key) => (error ? reject(error) : resolve(key))
    )
  )
}

const b64 = (buf: Buffer) => buf.toString('base64').replace(/=+$/, '')

/** argon2id in PHC string form: algorithm, parameters, salt and hash. */
export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES)
  const key = await derive(password, salt, PARAMS)
  const { memory: m, passes: t, parallelism: p } = PARAMS
  return `$argon2id$v=19$m=${m},t=${t},p=${p}$${b64(salt)}$${b64(key)}`
}

/** Constant-time check of `password` against a stored PHC string. */
export async function verifyPassword(password: string, stored: string) {
  const match = PHC_PATTERN.exec(stored)
  if (!match) return false
  const [, m, t, p, salt, hash] = match
  const expected = Buffer.from(hash, 'base64')
  const key = await derive(password, Buffer.from(salt, 'base64'), {
    memory: Number(m),
    passes: Number(t),
    parallelism: Number(p),
    tagLength: expected.length,
  })
  return timingSafeEqual(key, expected)
}

/**
 * Hash checked when the login is unknown, so a wrong login costs the same
 * time as a wrong password and does not reveal which accounts exist.
 */
let decoy: Promise<string> | undefined
export const decoyHash = () => (decoy ??= hashPassword('decoy-password'))
