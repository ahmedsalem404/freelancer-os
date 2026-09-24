// Enforces the per-file line budget from ARCHITECTURE.md §1.
// Counts code lines only (blank and comment-only lines are skipped).
// Usage: node scripts/check-file-size.mjs   → exits 1 when a file is over budget.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const MAX_LINES = 250
const WARN_LINES = 200
const ROOT = 'src'
const SOURCE = /\.(ts|tsx|mjs|js)$/
const EXEMPT = [
  /\.test\.tsx?$/,
  /\.seed\.ts$/,
  /^src\/app\/server\/seed\//,
  /^src\/routeTree\.gen\.ts$/,
  /^src\/(components|shared)\/ui\//,
]

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (SOURCE.test(name)) yield path
  }
}

function codeLines(text) {
  let inBlock = false
  let count = 0
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (inBlock) {
      if (line.includes('*/')) inBlock = false
      continue
    }
    if (line === '' || line.startsWith('//')) continue
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlock = true
      continue
    }
    count += 1
  }
  return count
}

const over = []
const near = []
for (const file of walk(ROOT)) {
  const rel = relative('.', file).split(sep).join('/')
  if (EXEMPT.some((rule) => rule.test(rel))) continue
  const lines = codeLines(readFileSync(file, 'utf8'))
  if (lines > MAX_LINES) over.push([rel, lines])
  else if (lines > WARN_LINES) near.push([rel, lines])
}

const byLines = (a, b) => b[1] - a[1]
for (const [file, lines] of near.sort(byLines)) {
  process.stdout.write(`warn  ${lines}\t${file} (split soon)\n`)
}
for (const [file, lines] of over.sort(byLines)) {
  process.stdout.write(`ERROR ${lines}\t${file} (> ${MAX_LINES})\n`)
}
process.stdout.write(
  `\n${over.length} file(s) over ${MAX_LINES} lines, ${near.length} near the limit.\n`
)
process.exit(over.length > 0 ? 1 : 0)
