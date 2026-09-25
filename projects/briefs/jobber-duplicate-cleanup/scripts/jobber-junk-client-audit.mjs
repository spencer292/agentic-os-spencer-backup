// Jobber junk-client audit.
//
// Finds the client records CallRail's native integration littered the account
// with: no real name, "Unknown", "Wireless Caller", caller-ID city stubs, and
// "Firstname N/A" shells. Then checks what is actually attached to each one so
// nothing holding real history is ever proposed for archiving.
//
// READ-ONLY. Writes a JSON report + a CSV. Mutates nothing.
//
// Usage:
//   node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-junk-client-audit.mjs
//   node .../jobber-junk-client-audit.mjs --page-size 100 --out data/junk-client-report.json
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
const PAGE_SIZE = Number(argOf('--page-size', 100))
const CHUNK = Number(argOf('--chunk', 5))
const OUT = path.resolve(here, '..', argOf('--out', 'data/junk-client-report.json'))
// The full sweep is ~47 throttled pages, and the per-client history pull can die
// halfway. Both are cached so a rerun resumes instead of starting over.
const SWEEP_CACHE = path.resolve(here, '../data/.junk-sweep-cache.json')
const HISTORY_CACHE = path.resolve(here, '../data/.junk-history-cache.json')
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
      // The cost bucket refills slowly; short waits just burn retries.
      const wait = 15000 * attempt
      process.stderr.write(`  throttled, waiting ${wait}ms\n`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    if (json.errors?.length) throw new Error('GraphQL: ' + json.errors.map((e) => e.message).join('; '))
    return json.data
  }
  throw new Error('exhausted retries')
}

// ---------- Phase 1: cheap sweep of every client ----------
let clients = []
let cursor = null
let page = 0
if (!REFRESH && existsSync(SWEEP_CACHE)) {
  const cached = JSON.parse(readFileSync(SWEEP_CACHE, 'utf8'))
  clients = cached.clients
  process.stderr.write(`sweep cache: ${clients.length} clients from ${cached.fetchedAt} (--refresh to re-pull)\n`)
}
const needSweep = clients.length === 0
while (needSweep) {
  page++
  const after = cursor ? `, after: ${JSON.stringify(cursor)}` : ''
  const data = await gql(`query {
    clients(first: ${PAGE_SIZE}${after}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id name firstName lastName companyName secondaryName title
        createdAt updatedAt isLead isArchived isCompany
        balance billingAddressPresent leadSource
        emails { address }
        phones { number }
        billingAddress { street street1 street2 city province postalCode }
      }
    }
  }`)
  clients.push(...data.clients.nodes)
  process.stderr.write(`sweep page ${page}: ${clients.length} clients\r`)
  if (!data.clients.pageInfo.hasNextPage) break
  cursor = data.clients.pageInfo.endCursor
}
if (page > 0) {
  writeFileSync(SWEEP_CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), clients }))
  process.stderr.write(`\nfetched ${clients.length} clients\n`)
}

// ---------- classification ----------
const clean = (s) => String(s || '').trim()
const squish = (s) => clean(s).replace(/\s+/g, ' ')
const digits = (s) => String(s || '').replace(/\D/g, '')

// Tokens that are never a real person's name.
const JUNK_TOKEN = /^(n\/a|na|n\.a\.|none|null|unknown|unkown|test|tbd|no name|noname|-{1,3}|\.|,|x|xx|xxx|\?+)$/i
const WIRELESS = /wireless\s*caller/i
const UNKNOWN = /\bunknown\b|\bunkown\b/i
const CALLER_JUNK = /^(restricted|anonymous|private|blocked|no caller id|caller id|unavailable|out of area|toll ?free|spam|scam likely|telemarketer|caller|conference|v\d+)$/i
// "Kent Wa", "Bellevue Wa" — CallRail writes the caller's city as the name.
const CITY_ONLY = /^[a-z .'-]{2,}\s+(wa|or|id|ca|az|tx|fl|ny|dc|mt|nv|ut)$/i
const US_STATE_ONLY = /^(wa|washington|or|oregon|ca|california)$/i

function classify(c) {
  const name = squish(c.name)
  const first = squish(c.firstName)
  const last = squish(c.lastName)
  const company = squish(c.companyName)
  const bare = name.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

  // A real company name is a real identity even with no person name on it.
  const hasCompany = company && !JUNK_TOKEN.test(company)

  if (!name && !hasCompany) return 'no-name'
  if (WIRELESS.test(name)) return 'wireless-caller'
  if (UNKNOWN.test(bare) && !hasCompany) return 'unknown'
  if (CALLER_JUNK.test(bare) && !hasCompany) return 'caller-id-junk'
  if (US_STATE_ONLY.test(bare) && !hasCompany) return 'caller-id-junk'
  // The whole name is a phone number.
  if (!hasCompany && digits(bare).length >= 7 && /^[\d\s()+-]+$/.test(bare)) return 'phone-as-name'
  if (CITY_ONLY.test(bare) && !hasCompany) return 'city-stub'

  // "Smith,John N/A" — an explicit junk token where a name belongs.
  const firstJunk = first && JUNK_TOKEN.test(first)
  const lastJunk = last && JUNK_TOKEN.test(last)
  if (!hasCompany && (firstJunk || lastJunk)) {
    if ((firstJunk || !first) && (lastJunk || !last)) return 'no-name'
    return 'half-name'
  }
  // A single bare word and nothing else — "Alison", "Justin". An EMPTY last name
  // is not itself junk: plenty of real records carry the whole name in the
  // first-name field ("John Green", "1st Baptist Church"), so test the rendered
  // name, not the field split.
  if (!hasCompany && bare.split(' ').filter(Boolean).length === 1) return 'first-name-only'
  return 'ok'
}

for (const c of clients) c._class = classify(c)

const CANDIDATE = new Set(['no-name', 'wireless-caller', 'unknown', 'caller-id-junk', 'phone-as-name', 'city-stub', 'half-name', 'first-name-only'])
const live = clients.filter((c) => !c.isArchived)
const candidates = live.filter((c) => CANDIDATE.has(c._class))

process.stderr.write(`live clients: ${live.length}; junk-name candidates: ${candidates.length}\n`)

// ---------- Phase 2: what is actually attached to each candidate ----------
const attached = new Map(
  !REFRESH && existsSync(HISTORY_CACHE) ? Object.entries(JSON.parse(readFileSync(HISTORY_CACHE, 'utf8'))) : []
)
const saveHistory = () => writeFileSync(HISTORY_CACHE, JSON.stringify(Object.fromEntries(attached)))
const todo = candidates.filter((c) => !attached.has(c.id))
process.stderr.write(`history: ${attached.size} cached, ${todo.length} to fetch\n`)
for (let i = 0; i < todo.length; i += CHUNK) {
  const slice = todo.slice(i, i + CHUNK)
  const parts = slice.map((c, n) => `c${n}: client(id: ${JSON.stringify(c.id)}) {
      id isArchivable balance
      jobs { totalCount }
      quotes { totalCount }
      invoices { totalCount }
      requests { totalCount }
      clientProperties { totalCount nodes { address { street street1 city postalCode } } }
      notes(first: 1) { totalCount }
  }`).join('\n')
  const data = await gql(`query { ${parts} }`)
  for (const key of Object.keys(data)) {
    const v = data[key]
    if (v) attached.set(v.id, v)
  }
  saveHistory()
  process.stderr.write(`history ${Math.min(i + CHUNK, todo.length)}/${todo.length}\r`)
  await new Promise((r) => setTimeout(r, 1200))
}
process.stderr.write('\n')

// ---------- verdicts ----------
const rows = candidates.map((c) => {
  const a = attached.get(c.id) || {}
  const jobs = a.jobs?.totalCount ?? 0
  const quotes = a.quotes?.totalCount ?? 0
  const invoices = a.invoices?.totalCount ?? 0
  const requests = a.requests?.totalCount ?? 0
  const notes = a.notes?.totalCount ?? 0
  const props = a.clientProperties?.nodes || []
  // A CallRail stub gets an auto-created city-only property, so a property is
  // only meaningful evidence when it carries an actual street address.
  const realAddress = props.some((p) => clean(p.address?.street1) || clean(p.address?.street))
  const balance = a.balance ?? c.balance ?? 0
  // Real work = a job, a quote, an invoice or money owed. A REQUEST is not that:
  // the CallRail integration files one per call, so a stub holding nothing but a
  // single request is still a stub — it just gets its own batch to sign off.
  const work = jobs + quotes + invoices
  let verdict
  if (work > 0 || balance !== 0) verdict = 'REVIEW-has-history'
  else if (realAddress) verdict = 'REVIEW-has-address'
  else if (requests > 0) verdict = 'REVIEW-request-only'
  else if (notes > 0) verdict = 'REVIEW-has-notes'
  else verdict = 'SAFE-archive'
  return {
    id: c.id,
    url: `https://secure.getjobber.com/clients/${Buffer.from(c.id, 'base64').toString().split('/').pop()}`,
    name: squish(c.name),
    firstName: squish(c.firstName),
    lastName: squish(c.lastName),
    company: squish(c.companyName),
    class: c._class,
    createdAt: c.createdAt,
    isLead: c.isLead,
    phone: (c.phones || []).map((p) => p.number).join(' | '),
    email: (c.emails || []).map((e) => e.address).join(' | '),
    city: clean(c.billingAddress?.city),
    propertyCount: props.length,
    realAddress,
    jobs, quotes, invoices, requests, notes, balance,
    isArchivable: a.isArchivable ?? null,
    verdict,
  }
})

rows.sort((x, y) => (x.verdict + x.class + x.createdAt).localeCompare(y.verdict + y.class + y.createdAt))

const tally = (key) => rows.reduce((m, r) => (m[r[key]] = (m[r[key]] || 0) + 1, m), {})
const report = {
  generatedAt: new Date().toISOString(),
  totalClients: clients.length,
  liveClients: live.length,
  archivedClients: clients.length - live.length,
  candidateCount: rows.length,
  byClass: tally('class'),
  byVerdict: tally('verdict'),
  rows,
}
writeFileSync(OUT, JSON.stringify(report, null, 2))

const csvOut = OUT.replace(/\.json$/, '.csv')
const cols = ['verdict', 'class', 'name', 'company', 'phone', 'email', 'city', 'createdAt', 'jobs', 'quotes', 'invoices', 'requests', 'notes', 'balance', 'propertyCount', 'realAddress', 'url']
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
writeFileSync(csvOut, [cols.join(','), ...rows.map((r) => cols.map((k) => esc(r[k])).join(','))].join('\n'))

console.log(JSON.stringify({
  totalClients: report.totalClients,
  liveClients: report.liveClients,
  candidateCount: report.candidateCount,
  byClass: report.byClass,
  byVerdict: report.byVerdict,
  out: OUT,
  csv: csvOut,
}, null, 2))
