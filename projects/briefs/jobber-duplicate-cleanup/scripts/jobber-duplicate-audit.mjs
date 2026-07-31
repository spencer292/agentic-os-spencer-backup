// Jobber duplicate-client audit.
//
// Paginates every client in the account and clusters them by normalized phone
// number and by email address, so we can see how many real humans hold more
// than one client record — and which system created each copy.
//
// Read-only. Writes a JSON report; mutates nothing.
//
// Usage:
//   node projects/briefs/jobber-duplicate-cleanup/scripts/jobber-duplicate-audit.mjs
//   node .../jobber-duplicate-audit.mjs --out report.json --page-size 100
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
const OUT = argOf('--out', path.join(here, '../data/duplicate-report.json'))

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
  for (let attempt = 1; attempt <= 5; attempt++) {
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
    // Throttled by the leaky-bucket cost budget — wait and retry.
    const throttled = json.errors?.some((e) => /THROTTLED|rate limit/i.test(e.message + JSON.stringify(e.extensions || {})))
    if (throttled && attempt < 5) {
      const wait = 2000 * attempt
      process.stderr.write(`  throttled, waiting ${wait}ms\n`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    if (json.errors?.length) throw new Error('GraphQL: ' + json.errors.map((e) => e.message).join('; '))
    return json.data
  }
  throw new Error('exhausted retries')
}

const normPhone = (p) => String(p || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1')
const normEmail = (e) => String(e || '').trim().toLowerCase()

// ---------- pull every client ----------
const clients = []
let cursor = null
let page = 0

while (true) {
  page++
  const after = cursor ? `, after: ${JSON.stringify(cursor)}` : ''
  const data = await gql(`query {
    clients(first: ${PAGE_SIZE}${after}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        name
        firstName
        lastName
        createdAt
        isLead
        isArchived
        emails { address }
        phones { number }
        billingAddress { street city postalCode }
      }
    }
  }`)
  const conn = data.clients
  clients.push(...conn.nodes)
  process.stderr.write(`page ${page}: ${clients.length} clients\r`)
  if (!conn.pageInfo.hasNextPage) break
  cursor = conn.pageInfo.endCursor
}
process.stderr.write(`\nfetched ${clients.length} clients\n`)

// ---------- classify how each record was probably created ----------
const JUNK_NAME = /^(wireless caller|unknown|unknown caller|no caller id|restricted|anonymous)$/i
const CITY_ONLY = /^[a-z .'-]+\s+(wa|or|id|ca|dc)$/i

function origin(c) {
  const name = (c.name || '').trim()
  const phoneRaw = c.phones?.[0]?.number || ''
  const hasEmail = (c.emails || []).length > 0
  const hasStreet = Boolean(c.billingAddress?.street)

  // CallRail's native integration writes caller-ID junk: "Wireless Caller",
  // "Kent Wa", "Smith,John N/A", always dash-formatted, never an email.
  if (JUNK_NAME.test(name) || CITY_ONLY.test(name) || /,.*\bN\/A\b/i.test(name)) return 'callrail-stub'
  // The website form posts the phone exactly as typed (usually bare digits or
  // +1…) and always has an email, never an address.
  if (hasEmail && !hasStreet && /^\+?\d{10,11}$/.test(phoneRaw.trim())) return 'website-form'
  if (hasStreet) return 'full-record'
  return 'other'
}

for (const c of clients) c._origin = origin(c)

// ---------- cluster ----------
function cluster(keyFn) {
  const map = new Map()
  for (const c of clients) {
    for (const k of keyFn(c)) {
      if (!k) continue
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(c)
    }
  }
  return [...map.entries()].filter(([, v]) => v.length > 1)
}

const byPhone = cluster((c) => [...new Set((c.phones || []).map((p) => normPhone(p.number)).filter((d) => d.length === 10))])
const byEmail = cluster((c) => [...new Set((c.emails || []).map((e) => normEmail(e.address)).filter(Boolean))])

// A cluster is only interesting if it holds more than one DISTINCT client id.
const dedupeClusters = (cl) => cl
  .map(([k, v]) => [k, [...new Map(v.map((c) => [c.id, c])).values()]])
  .filter(([, v]) => v.length > 1)

const phoneClusters = dedupeClusters(byPhone)
const emailClusters = dedupeClusters(byEmail)

// Union: one entry per real human, keyed by whichever signal grouped them.
const clusterKeyOf = new Map()
const groups = []
for (const [key, members] of [...phoneClusters, ...emailClusters]) {
  const existing = members.map((m) => clusterKeyOf.get(m.id)).find((g) => g !== undefined)
  if (existing !== undefined) {
    const g = groups[existing]
    for (const m of members) {
      if (!g.members.some((x) => x.id === m.id)) g.members.push(m)
      clusterKeyOf.set(m.id, existing)
    }
    g.keys.push(key)
  } else {
    const idx = groups.length
    groups.push({ keys: [key], members: [...members] })
    for (const m of members) clusterKeyOf.set(m.id, idx)
  }
}

for (const g of groups) {
  g.members.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  g.origins = g.members.map((m) => m._origin)
  g.activeCount = g.members.filter((m) => !m.isArchived).length
}

const liveGroups = groups.filter((g) => g.activeCount > 1)

// ---------- report ----------
const pairShape = {}
for (const g of liveGroups) {
  const shape = [...g.origins].sort().join(' + ')
  pairShape[shape] = (pairShape[shape] || 0) + 1
}

const originTotals = {}
for (const c of clients) originTotals[c._origin] = (originTotals[c._origin] || 0) + 1

console.log('\n=== JOBBER DUPLICATE AUDIT ===')
console.log('clients scanned            :', clients.length)
console.log('  archived                 :', clients.filter((c) => c.isArchived).length)
console.log('record origin (all)        :', JSON.stringify(originTotals))
console.log('')
console.log('duplicate groups (2+ live) :', liveGroups.length)
console.log('extra records to resolve   :', liveGroups.reduce((n, g) => n + g.activeCount - 1, 0))
console.log('  matched by phone         :', phoneClusters.length)
console.log('  matched by email         :', emailClusters.length)
console.log('')
console.log('duplicate shapes:')
for (const [shape, n] of Object.entries(pairShape).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${shape}`)
}

console.log('\n--- 25 most recent duplicate groups ---')
const recent = [...liveGroups].sort((a, b) =>
  b.members[b.members.length - 1].createdAt.localeCompare(a.members[a.members.length - 1].createdAt))
for (const g of recent.slice(0, 25)) {
  console.log(`\nkey: ${g.keys.join(' / ')}`)
  for (const m of g.members) {
    console.log(`   ${m.createdAt.slice(0, 16)}  ${String(m._origin).padEnd(14)}  ${(m.name || '').slice(0, 28).padEnd(28)}  ${m.isArchived ? '[archived]' : ''}`)
  }
}

writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totals: {
    clients: clients.length,
    duplicateGroups: liveGroups.length,
    extraRecords: liveGroups.reduce((n, g) => n + g.activeCount - 1, 0),
    originTotals,
    pairShape,
  },
  groups: liveGroups.map((g) => ({
    keys: g.keys,
    members: g.members.map((m) => ({
      id: m.id,
      numericId: Buffer.from(m.id, 'base64').toString('utf8').split('/').pop(),
      name: m.name,
      origin: m._origin,
      createdAt: m.createdAt,
      isLead: m.isLead,
      isArchived: m.isArchived,
      emails: (m.emails || []).map((e) => e.address),
      phones: (m.phones || []).map((p) => p.number),
      street: m.billingAddress?.street || '',
    })),
  })),
}, null, 2))

console.log(`\nreport written: ${OUT}`)
