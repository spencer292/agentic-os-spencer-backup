// Jobber junk-client archive (and undo).
//
// Consumes the report from jobber-junk-client-audit.mjs and archives the rows
// it marked SAFE-archive. Jobber has NO client-delete mutation — clientArchive
// is the only bulk route, and clientUnarchive reverses it, so every archive is
// logged to a JSONL that --undo can replay.
//
// DRY RUN BY DEFAULT. Nothing is written without --execute.
//
// Usage:
//   node .../jobber-junk-client-archive.mjs                          # dry run, everything safe
//   node .../jobber-junk-client-archive.mjs --class wireless-caller  # one bucket at a time
//   node .../jobber-junk-client-archive.mjs --limit 25 --execute     # small live batch first
//   node .../jobber-junk-client-archive.mjs --undo data/archive-log-<stamp>.jsonl --execute
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const API = 'https://api.getjobber.com/api'
const VERSION = '2025-04-16'
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : dflt
}
const EXECUTE = process.argv.includes('--execute')
const REPORT = path.resolve(here, '..', argOf('--report', 'data/junk-client-report.json'))
const ONLY_CLASS = argOf('--class', null)
const VERDICT = argOf('--verdict', 'SAFE-archive')
const LIMIT = Number(argOf('--limit', 0)) || Infinity
const UNDO = argOf('--undo', null)

async function accessToken() {
  const res = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.JOBBER_CLIENT_ID,
      client_secret: process.env.JOBBER_CLIENT_SECRET,
      refresh_token: process.env.JOBBER_REFRESH_TOKEN,
    }),
  })
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${(await res.text()).slice(0, 300)}`)
  return (await res.json()).access_token
}
const token = await accessToken()

async function gql(query, variables) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': VERSION,
      },
      body: JSON.stringify({ query, variables }),
    })
    const body = await res.text()
    let json
    try { json = JSON.parse(body) } catch { throw new Error(`non-JSON (${res.status}): ${body.slice(0, 300)}`) }
    const throttled = json.errors?.some((e) => /THROTTLED|rate limit/i.test(e.message + JSON.stringify(e.extensions || {})))
    if (throttled && attempt < 6) {
      await new Promise((r) => setTimeout(r, 15000 * attempt))
      continue
    }
    if (json.errors?.length) throw new Error('GraphQL: ' + json.errors.map((e) => e.message).join('; '))
    return json.data
  }
  throw new Error('exhausted retries')
}

const ARCHIVE = `mutation ($clientId: EncodedId!) {
  clientArchive(clientId: $clientId) {
    client { id name isArchived }
    userErrors { message path }
  }
}`
const UNARCHIVE = `mutation ($clientId: EncodedId!) {
  clientUnarchive(clientId: $clientId) {
    client { id name isArchived }
    userErrors { message path }
  }
}`

// ---------- undo mode ----------
if (UNDO) {
  const logPath = path.resolve(here, '..', UNDO)
  const entries = readFileSync(logPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
  const archived = entries.filter((e) => e.ok)
  console.log(`${EXECUTE ? 'UNARCHIVING' : 'DRY RUN — would unarchive'} ${archived.length} clients from ${path.basename(logPath)}`)
  if (!EXECUTE) process.exit(0)
  let done = 0
  for (const e of archived) {
    const data = await gql(UNARCHIVE, { clientId: e.id })
    const errs = data.clientUnarchive?.userErrors || []
    if (errs.length) console.log(`  FAIL ${e.name}: ${errs.map((x) => x.message).join('; ')}`)
    else done++
    await new Promise((r) => setTimeout(r, 400))
  }
  console.log(`unarchived ${done}/${archived.length}`)
  process.exit(0)
}

// ---------- archive mode ----------
if (!existsSync(REPORT)) throw new Error(`no report at ${REPORT} — run jobber-junk-client-audit.mjs first`)
const report = JSON.parse(readFileSync(REPORT, 'utf8'))

// Anything a previous batch already archived is skipped, so the report can be
// worked through in --limit slices without re-hitting what is already done.
const dataDir = path.resolve(here, '../data')
const alreadyDone = new Set()
for (const f of readdirSync(dataDir).filter((n) => /^archive-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) alreadyDone.add(e.id)
  }
}

let targets = report.rows.filter((r) => r.verdict === VERDICT)
if (ONLY_CLASS) targets = targets.filter((r) => r.class === ONLY_CLASS)
const skipped = targets.filter((r) => alreadyDone.has(r.id)).length
targets = targets.filter((r) => !alreadyDone.has(r.id)).slice(0, LIMIT)
if (skipped) console.log(`skipping ${skipped} already archived in an earlier batch`)

// Belt and braces: the report is a snapshot, so re-assert the safety rule here.
// A job, quote, invoice or an outstanding balance is real work — those never get
// archived no matter which verdict was asked for or what the file says.
const unsafe = targets.filter((r) => r.jobs || r.quotes || r.invoices || r.balance)
if (unsafe.length) throw new Error(`refusing to run: ${unsafe.length} targets hold real work — regenerate the report`)

const byClass = targets.reduce((m, r) => (m[r.class] = (m[r.class] || 0) + 1, m), {})
console.log(`report: ${path.basename(REPORT)} (generated ${report.generatedAt})`)
console.log(`${EXECUTE ? 'ARCHIVING' : 'DRY RUN — would archive'} ${targets.length} clients (verdict ${VERDICT}${ONLY_CLASS ? `, class ${ONLY_CLASS}` : ''})`)
console.log(JSON.stringify(byClass, null, 2))

if (!EXECUTE) {
  for (const r of targets.slice(0, 20)) console.log(`  ${r.class.padEnd(16)} ${(r.name || '(no name)').padEnd(28)} ${r.phone || ''}`)
  if (targets.length > 20) console.log(`  … and ${targets.length - 20} more (see the CSV)`)
  console.log('\nre-run with --execute to write. Nothing has been changed.')
}

// Everything below writes. Guarded rather than process.exit()-ed above, because
// exiting mid-event-loop on Windows trips a libuv assertion that reads like a crash.
if (EXECUTE) {
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const LOG = path.resolve(here, `../data/archive-log-${stamp}.jsonl`)
let ok = 0
let failed = 0
for (const [i, r] of targets.entries()) {
  let entry
  try {
    const data = await gql(ARCHIVE, { clientId: r.id })
    const errs = data.clientArchive?.userErrors || []
    if (errs.length) {
      failed++
      entry = { id: r.id, name: r.name, class: r.class, url: r.url, ok: false, error: errs.map((x) => x.message).join('; ') }
    } else {
      ok++
      entry = { id: r.id, name: r.name, class: r.class, url: r.url, ok: true, at: new Date().toISOString() }
    }
  } catch (err) {
    failed++
    entry = { id: r.id, name: r.name, class: r.class, url: r.url, ok: false, error: String(err.message).slice(0, 200) }
  }
  appendFileSync(LOG, JSON.stringify(entry) + '\n')
  if (!entry.ok) console.log(`  FAIL ${r.name || '(no name)'}: ${entry.error}`)
  process.stderr.write(`${i + 1}/${targets.length} archived=${ok} failed=${failed}\r`)
  await new Promise((r2) => setTimeout(r2, 400))
}
process.stderr.write('\n')
console.log(`archived ${ok}, failed ${failed}`)
console.log(`log: ${LOG}`)
console.log(`undo: node ${path.relative(root, fileURLToPath(import.meta.url))} --undo data/${path.basename(LOG)} --execute`)
}
