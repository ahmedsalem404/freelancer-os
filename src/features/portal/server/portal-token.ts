import { createHash, randomBytes } from 'node:crypto'

/** 32 random bytes → 43 base64url characters. */
const TOKEN_BYTES = 32
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
/** Characters of the token shown to the owner to recognise a link. */
const HINT_LENGTH = 4

export function newPortalToken() {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  return { token, hash: hashToken(token), hint: token.slice(-HINT_LENGTH) }
}

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

/** Cheap shape check before touching the database. */
export const isWellFormedToken = (token: string) => TOKEN_PATTERN.test(token)
