// Which junk client records are intercepting text messages?
//
// The name on an inbound text is whichever client record holds that phone
// number, so a "Wireless Caller" stub carrying a real customer's mobile makes
// their texts show up under the junk name. This pass pulls, for every junk
// candidate: its phone ids, whether SMS is allowed on them, how many messages
// it holds, and whether the same number sits on a real (non-junk) client.
//
// READ-ONLY. Writes data/junk-phone-report.json.
import { readFileSync, writeFileSync, existsSync } from 'fs'
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
const CHUNK = Number(argOf('--chunk', 5))
const REPORT = path.resolve(here, '../data/junk-client-report.json')
const SWEEP = path.resolve(here, '../data/.junk-sweep-cache.json')
const CACHE = path.resolve(here, '../data/.junk-phone-cache.json')
const OUT = path.resolve(here, '../data/junk-phone-report.json')
const REFRESH = process.argv.includes('--refresh')

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

async function gql(query) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': VERSION,
      },
      body: JSON.stringify({ query }),
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

const report = JSON.parse(readFileSync(REPORT, 'utf8'))
const sweep = JSON.parse(readFileSync(SWEEP, 'utf8')).clients
const junkIds = new Set(report.rows.map((r) => r.id))

// Phone book of every client that is NOT a junk candidate.
const norm = (p) => String(p || '').replace(/\D/g, '').slice(-10)
const book = new Map()
for (const c of sweep) {
  if (junkIds.has(c.id) || c.isArchived) continue
  for (const p of c.phones || []) {
    const d = norm(p.number)
    if (d.length === 10) {
      if (!book.has(d)) book.set(d, [])
      book.get(d).push({ id: c.id, name: c.name })
    }
  }
}

const cache = new Map(!REFRESH && existsSync(CACHE) ? Object.entries(JSON.parse(readFileSync(CACHE, 'utf8'))) : [])
const todo = report.rows.filter((r) => !cache.has(r.id))
process.stderr.write(`phones: ${cache.size} cached, ${todo.length} to fetch\n`)

for (let i = 0; i < todo.length; i += CHUNK) {
  const slice = todo.slice(i, i + CHUNK)
  const parts = slice.map((r, n) => `c${n}: client(id: ${JSON.stringify(r.id)}) {
    id name isArchived
    phones { id number primary smsAllowed }
    messages { totalCount }
  }`).join('\n')
  const data = await gql(`query { ${parts} }`)
  for (const k of Object.keys(data)) if (data[k]) cache.set(data[k].id, data[k])
  writeFileSync(CACHE, JSON.stringify(Object.fromEntries(cache)))
  process.stderr.write(`${Math.min(i + CHUNK, todo.length)}/${todo.length}\r`)
  await new Promise((r) => setTimeout(r, 1200))
}
process.stderr.write('\n')

const rows = report.rows.map((r) => {
  const live = cache.get(r.id) || {}
  const phones = (live.phones || []).map((p) => ({
    id: p.id,
    number: p.number,
    smsAllowed: p.smsAllowed,
    normalized: norm(p.number),
    onRealClient: book.get(norm(p.number)) || [],
  }))
  const messages = live.messages?.totalCount ?? 0
  const shared = phones.filter((p) => p.onRealClient.length > 0)
  let fix
  if (shared.length && messages > 0) fix = 'RENAME-holds-thread'   // real texts live here; renaming keeps them
  else if (shared.length) fix = 'STRIP-PHONE-duplicate'            // real client has the thread; take the number off the stub
  else if (messages > 0) fix = 'RENAME-unknown-thread'             // real texts, but no real record to take the name from
  else fix = 'NO-TEXT-TRAFFIC'                                     // never texted; archiving is enough
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    class: r.class,
    verdict: r.verdict,
    isArchived: live.isArchived ?? null,
    messages,
    phones,
    realMatch: shared.flatMap((p) => p.onRealClient.map((c) => c.name)),
    fix,
  }
})

const tally = (k) => rows.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {})
writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  byFix: tally('fix'),
  archivedStillHoldingMessages: rows.filter((r) => r.isArchived && r.messages > 0).length,
  totalMessagesOnJunkRecords: rows.reduce((s, r) => s + r.messages, 0),
  rows,
}, null, 2))

console.log(JSON.stringify({
  byFix: tally('fix'),
  archivedStillHoldingMessages: rows.filter((r) => r.isArchived && r.messages > 0).length,
  totalMessagesOnJunkRecords: rows.reduce((s, r) => s + r.messages, 0),
  out: OUT,
}, null, 2))
