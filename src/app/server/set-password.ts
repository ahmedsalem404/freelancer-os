import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  hashPassword,
  replacePassword,
} from '@/features/auth/server'
import { openDatabase, runMigrations } from './db'
import { readEnv } from './env'

/**
 * `npm run auth:set-password -- <login>`: sets a team member's password
 * from this machine's terminal. Done here, not in the browser, so nobody
 * who reaches the site before the owner can claim the account.
 */
const ENTER = new Set(['\r', '\n'])
const CTRL_C = '\u0003'
const BACKSPACE = new Set(['\u0008', '\u007f'])

/** Reads a line without echoing it. */
function askHidden(question: string) {
  const { stdin, stdout } = process
  if (!stdin.isTTY) throw new Error('Run this in an interactive terminal.')
  stdout.write(question)
  stdin.setRawMode(true)
  stdin.resume()
  stdin.setEncoding('utf8')
  return new Promise<string>((resolve, reject) => {
    let value = ''
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ENTER.has(ch)) {
          stdin.off('data', onData)
          stdin.setRawMode(false)
          stdin.pause()
          stdout.write('\n')
          resolve(value)
          return
        }
        if (ch === CTRL_C) {
          stdin.setRawMode(false)
          reject(new Error('Cancelled.'))
          return
        }
        value = BACKSPACE.has(ch) ? value.slice(0, -1) : value + ch
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  const login = process.argv[2]?.trim()
  if (!login) throw new Error('Usage: npm run auth:set-password -- <login>')
  const password = await askHidden('New password: ')
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new Error(`Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`)
  }
  if ((await askHidden('Repeat it: ')) !== password) {
    throw new Error('The two passwords differ. Nothing changed.')
  }

  const env = readEnv()
  const { db, close } = openDatabase(env.DB_FILE)
  try {
    runMigrations(db, env.MIGRATIONS_DIR)
    if (!replacePassword(db, login, await hashPassword(password))) {
      throw new Error(`No team member signs in as ${login}.`)
    }
  } finally {
    close()
  }
  process.stdout.write(
    `Password set for ${login}. Every earlier session was signed out.\n`
  )
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exit(1)
})
