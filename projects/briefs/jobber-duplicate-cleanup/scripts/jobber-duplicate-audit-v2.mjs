// Full-account duplicate-client audit, v2.
//
// Supersedes jobber-duplicate-audit.mjs (2026-07-29), which predates the junk
// cleanup and only reported group shapes. This one also decides, per group,
// WHICH record should survive and how confident the identity match is, and
// emits pairs in the same schema as merge-pairs.json so jobber-merge-run.mjs
// can consume them directly.
//
// Two rules carried over from the junk merges, both learned the hard way:
//   * the keeper is whichever record holds the WORK (jobs/quotes/invoices/
//     balance) — never the one holding the text thread, and never just the one
//     with the more human-looking name
//   * a shared phone number is not proof of identity; household members and
//     reassigned numbers are common, so anything short of a name match is
//     flagged for a human
//
// READ-ONLY. Writes data/duplicate-report-v2.json and data/duplicate-pairs.json.
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const dataDir = path.resolve(here, '../data')
const argOf = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d }
const PAGE_SIZE = Number(argOf('--page-size', 100))
const REFRESH = process.argv.includes('--refresh')
const SWEEP_CACHE = path.join(dataDir, '.dup-sweep-cache.json')
const DETAIL_CACHE = path.join(dataDir, '.dup-detail-cache.json')

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const API = 'https://api.getjobber.com/api'
const res0 = await fetch(`${API}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.JOBBER_CLIENT_ID,
    client_secret: process.env.JOBBER_CLIENT_SECRET,
    refresh_token: process.env.JOBBER_REFRESH_TOKEN,
  }),
})
const token = (await res0.json()).access_token

async function gql(query) {
  for (let a = 1; a <= 6; a++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query }),
    })
    const body = await res.text()
    let json
    try { json = JSON.parse(body) } catch { throw new Error(`non-JSON (${res.status}): ${body.slice(0, 200)}`) }
    if (json.errors?.some((e) => /THROTTLED/i.test(e.message)) && a < 6) {
      process.stderr.write(`  throttled, waiting ${15 * a}s\n`)
      await new Promise((r) => setTimeout(r, 15000 * a)); continue
    }
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
    return json.data
  }
  throw new Error('exhausted retries')
}

// ---------- sweep ----------
let clients = []
if (!REFRESH && existsSync(SWEEP_CACHE)) {
  const c = JSON.parse(readFileSync(SWEEP_CACHE, 'utf8'))
  clients = c.clients
  process.stderr.write(`sweep cache: ${clients.length} from ${c.fetchedAt} (--refresh to re-pull)\n`)
}
if (clients.length === 0) {
  let cursor = null, page = 0
  while (true) {
    page++
    const after = cursor ? `, after: ${JSON.stringify(cursor)}` : ''
    const data = await gql(`query {
      clients(first: ${PAGE_SIZE}${after}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id name firstName lastName companyName createdAt isArchived isCompany isLead
          emails { address } phones { number }
          billingAddress { street street1 city province postalCode }
        }
      }
    }`)
    clients.push(...data.clients.nodes)
    process.stderr.write(`sweep page ${page}: ${clients.length}\r`)
    if (!data.clients.pageInfo.hasNextPage) break
    cursor = data.clients.pageInfo.endCursor
  }
  writeFileSync(SWEEP_CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), clients }))
  process.stderr.write(`\nfetched ${clients.length}\n`)
}

const live = clients.filter((c) => !c.isArchived)
process.stderr.write(`live clients: ${live.length}\n`)

// ---------- cluster ----------
const normPhone = (p) => String(p || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1')
const normEmail = (e) => String(e || '').trim().toLowerCase()
// Shared inboxes and office lines link unrelated people — never cluster on them.
const GENERIC_EMAIL = /^(info|office|admin|contact|billing|sales|no-?reply)@/i
// OUR OWN staff addresses sit on client records so notifications reach the team.
// Clustering on them chained six unrelated commercial accounts into one group
// (Tino Perrina + Waters Edge + City of Olympia + ...), which would have merged
// away 15 jobs and 53 invoices. Never a customer identity.
const STAFF_EMAIL = /@(got-moles|gotmoles|rainierpowerwash)\.com$/i

const nameTokens = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 2))
// A key is a "hub" — an office line, a staff address, or a spam bot cycling
// aliases — when it links three or more records whose names share nothing.
// Five records all called "Jennifer Obrien" is a duplicate; five records under
// five different names on one number is not.
function isHub(members) {
  if (members.length < 3) return false
  const sets = members.map((m) => nameTokens(m.name))
  const distinct = []
  for (const s of sets) {
    if (!distinct.some((d) => [...s].some((w) => d.has(w)))) distinct.push(s)
  }
  return distinct.length >= 3
}

function clusterBy(keyFn) {
  const map = new Map()
  for (const c of live) {
    for (const k of keyFn(c)) {
      if (!k) continue
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(c)
    }
  }
  return [...map.entries()].filter(([, v]) => v.length > 1)
}
const rawPhone = clusterBy((c) => [...new Set((c.phones || []).map((p) => normPhone(p.number)).filter((d) => d.length === 10))])
const rawEmail = clusterBy((c) => [...new Set((c.emails || []).map((e) => normEmail(e.address)).filter((a) => a && !GENERIC_EMAIL.test(a) && !STAFF_EMAIL.test(a)))])

const hubs = [...rawPhone, ...rawEmail].filter(([, v]) => isHub(v))
const byPhone = rawPhone.filter(([, v]) => !isHub(v))
const byEmail = rawEmail.filter(([, v]) => !isHub(v))
process.stderr.write(`hub keys excluded (office lines / staff / alias spam): ${hubs.length}\n`)
for (const [k, v] of hubs) process.stderr.write(`   ${k} -> ${v.length} records: ${v.map((x) => x.name).slice(0, 6).join(', ')}\n`)

// Merge phone- and email-linked clusters into connected components, so one
// person split across three records by two different keys is a single group.
const parent = new Map()
const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x) } return x }
const union = (a, b) => { const [ra, rb] = [find(a), find(b)]; if (ra !== rb) parent.set(ra, rb) }
for (const c of live) parent.set(c.id, c.id)
for (const [, members] of [...byPhone, ...byEmail]) {
  for (let i = 1; i < members.length; i++) union(members[0].id, members[i].id)
}
const groups = new Map()
for (const c of live) {
  const r = find(c.id)
  if (!groups.has(r)) groups.set(r, [])
  groups.get(r).push(c)
}
const dupGroups = [...groups.values()].filter((g) => g.length > 1)
process.stderr.write(`duplicate groups: ${dupGroups.length}; records involved: ${dupGroups.reduce((s, g) => s + g.length, 0)}\n`)

// ---------- detail ----------
const detail = new Map(!REFRESH && existsSync(DETAIL_CACHE) ? Object.entries(JSON.parse(readFileSync(DETAIL_CACHE, 'utf8'))) : [])
const need = dupGroups.flat().map((c) => c.id).filter((id) => !detail.has(id))
process.stderr.write(`detail: ${detail.size} cached, ${need.length} to fetch\n`)
for (let i = 0; i < need.length; i += 6) {
  const slice = need.slice(i, i + 6)
  const q = slice.map((id, n) => `c${n}: client(id: ${JSON.stringify(id)}) {
    id name createdAt balance
    jobs { totalCount } quotes { totalCount } invoices { totalCount } requests { totalCount }
    messages { totalCount }
    clientProperties { nodes { address { street street1 city postalCode } } }
  }`).join('\n')
  const data = await gql(`query { ${q} }`)
  for (const k of Object.keys(data)) if (data[k]) detail.set(data[k].id, data[k])
  writeFileSync(DETAIL_CACHE, JSON.stringify(Object.fromEntries(detail)))
  process.stderr.write(`${Math.min(i + 6, need.length)}/${need.length}\r`)
  await new Promise((r) => setTimeout(r, 1100))
}
process.stderr.write('\n')

// ---------- grade ----------
const cleanName = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
const tokens = (s) => new Set(cleanName(s).split(' ').filter((w) => w.length > 1))
const CALLER_ID = /^(wireless caller|unknown|private|restricted|unavailable|.*\bwa$|.*\bca$|.*\bny$)/i
const work = (d) => (d.jobs?.totalCount || 0) + (d.quotes?.totalCount || 0) + (d.invoices?.totalCount || 0)
const addrs = (d) => (d.clientProperties?.nodes || []).map((p) => [p.address?.street1, p.address?.street, p.address?.city, p.address?.postalCode].filter(Boolean).join(' ')).filter(Boolean)
const slim = (c, d) => ({
  id: c.id, name: c.name,
  // Jobber prints "Lead" or "Active" on each row of the merge dropdown, which is
  // often the ONLY thing separating two otherwise identical duplicate records.
  isLead: c.isLead,
  url: `https://secure.getjobber.com/clients/${Buffer.from(c.id, 'base64').toString().split('/').pop()}`,
  created: c.createdAt.slice(0, 10),
  jobs: d.jobs.totalCount, quotes: d.quotes.totalCount, invoices: d.invoices.totalCount,
  requests: d.requests.totalCount, messages: d.messages.totalCount, balance: d.balance,
  addresses: addrs(d),
  phones: (c.phones || []).map((p) => p.number),
  emails: (c.emails || []).map((e) => e.address),
})

const pairs = []
const groupsOut = []
for (const g of dupGroups) {
  const withDetail = g.map((c) => ({ c, d: detail.get(c.id) })).filter((x) => x.d)
  if (withDetail.length < 2) continue
  withDetail.sort((a, b) => work(b.d) - work(a.d) || new Date(a.c.createdAt) - new Date(b.c.createdAt))
  const keeper = withDetail[0]
  const others = withDetail.slice(1)

  // Union-find chains A-B and B-C into one group even when A and C are
  // unrelated — a staff cell on one client plus a property manager's email on
  // another is enough (Waters Edge -> Cory Ventura -> Forest Creek). If three
  // or more members share no name tokens at all, the group is an artefact of
  // chaining, not one person. Report it, but emit no merge pairs.
  const distinctNames = []
  for (const x of withDetail.map((v) => nameTokens(v.c.name))) {
    if (!distinctNames.some((d) => [...x].some((w) => d.has(w)))) distinctNames.push(x)
  }
  const chained = distinctNames.length >= 3
  groupsOut.push({ size: withDetail.length, chained, members: withDetail.map((x) => slim(x.c, x.d)) })
  if (chained) continue

  for (const o of others) {
    const kt = tokens(keeper.c.name)
    const ot = tokens(o.c.name)
    const shared = [...ot].filter((w) => kt.has(w))
    const otherIsCallerId = CALLER_ID.test(String(o.c.name).trim())
    const zipK = new Set(addrs(keeper.d).join(' ').match(/\b9\d{4}\b/g) || [])
    const zipO = new Set(addrs(o.d).join(' ').match(/\b9\d{4}\b/g) || [])
    const sameZip = [...zipO].some((z) => zipK.has(z))
    const sameEmail = (o.c.emails || []).some((e) => (keeper.c.emails || []).some((k) => normEmail(k.address) && normEmail(k.address) === normEmail(e.address)))

    let confidence, why
    if (sameEmail && shared.length >= 1) { confidence = 'STRONG'; why = 'same email and name' }
    else if (shared.length >= 2) { confidence = 'STRONG'; why = 'full name matches' }
    else if (otherIsCallerId && sameZip) { confidence = 'STRONG'; why = 'caller-ID stub, same zip' }
    else if (sameEmail) { confidence = 'LIKELY'; why = 'same email address' }
    else if (otherIsCallerId) { confidence = 'LIKELY'; why = 'caller-ID stub carries no name to contradict' }
    else if (shared.length === 1) { confidence = 'REVIEW'; why = `only "${shared[0]}" matches — may be a household member` }
    else { confidence = 'CONFLICT'; why = 'different names on a shared phone/email' }

    // Never merge away a record that holds work — Jobber disables autopay on
    // any job moved to the keeper, and saved payment methods do not travel.
    const absorbHasWork = work(o.d) > 0 || o.d.balance !== 0
    pairs.push({
      confidence, why, absorbHasWork,
      number: (o.c.phones || []).map((p) => normPhone(p.number)).find((x) => x.length === 10) || '',
      keep: slim(keeper.c, keeper.d),
      absorb: slim(o.c, o.d),
    })
  }
}

const tally = (arr, k) => arr.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {})
writeFileSync(path.join(dataDir, 'duplicate-report-v2.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  liveClients: live.length,
  hubKeys: hubs.map(([k, v]) => ({ key: k, count: v.length, names: v.map((x) => x.name) })),
  groups: groupsOut.length,
  recordsInvolved: groupsOut.reduce((s, g) => s + g.size, 0),
  extraRecords: groupsOut.reduce((s, g) => s + g.size - 1, 0),
  bySize: tally(groupsOut.map((g) => ({ size: g.size })), 'size'),
  groups_detail: groupsOut,
}, null, 2))
writeFileSync(path.join(dataDir, 'duplicate-pairs.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  byConfidence: tally(pairs, 'confidence'),
  absorbWithWork: pairs.filter((p) => p.absorbHasWork).length,
  rows: pairs.map((p) => ({ ...p, keeperIsJunk: false })),
}, null, 2))

console.log(JSON.stringify({
  liveClients: live.length,
  duplicateGroups: groupsOut.length,
  extraRecords: groupsOut.reduce((s, g) => s + g.size - 1, 0),
  groupSizes: tally(groupsOut.map((g) => ({ size: g.size })), 'size'),
  pairs: pairs.length,
  byConfidence: tally(pairs, 'confidence'),
  absorbHoldsWork: pairs.filter((p) => p.absorbHasWork).length,
}, null, 2))
