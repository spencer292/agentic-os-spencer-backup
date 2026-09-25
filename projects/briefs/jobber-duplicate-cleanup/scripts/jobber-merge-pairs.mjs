// Build and grade the junk-stub -> real-client merge pairs.
//
// A shared phone number is NOT proof of identity. A number can be a household
// line, a reassigned mobile, or an office switchboard, so this pulls both sides
// of every pair in full and scores how confident the identity match is. Only
// STRONG pairs are safe to merge unattended; anything else is a human call.
//
// It also decides the KEEPER — the record that must survive the merge. That is
// always the one holding the real work (jobs/quotes/invoices/balance), never
// the caller-ID stub, whichever one happens to hold the text thread.
//
// READ-ONLY. Writes data/merge-pairs.json.
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const dataDir = path.resolve(here, '../data')

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
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query }),
    })
    const json = JSON.parse(await res.text())
    if (json.errors?.some((e) => /THROTTLED/i.test(e.message)) && attempt < 6) {
      await new Promise((r) => setTimeout(r, 15000 * attempt)); continue
    }
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
    return json.data
  }
  throw new Error('exhausted retries')
}

const phoneReport = JSON.parse(readFileSync(path.join(dataDir, 'junk-phone-report.json'), 'utf8'))
const sweep = JSON.parse(readFileSync(path.join(dataDir, '.junk-sweep-cache.json'), 'utf8')).clients
const norm = (p) => String(p || '').replace(/\D/g, '').slice(-10)

// Everything the phone audit flagged as sharing a number with a real client.
const pairs = []
for (const r of phoneReport.rows) {
  if (!['STRIP-PHONE-duplicate', 'RENAME-holds-thread'].includes(r.fix)) continue
  for (const p of r.phones) {
    for (const real of p.onRealClient) pairs.push({ junk: r, realId: real.id, realName: real.name, number: p.normalized })
  }
}

// Pull both sides in full.
const ids = [...new Set(pairs.flatMap((p) => [p.junk.id, p.realId]))]
const full = new Map()
for (let i = 0; i < ids.length; i += 10) {
  const slice = ids.slice(i, i + 10)
  const q = slice.map((id, n) => `c${n}: client(id: ${JSON.stringify(id)}) {
    id name firstName lastName companyName createdAt isArchived balance
    emails { address }
    phones { number }
    jobs { totalCount }
    quotes { totalCount }
    invoices { totalCount }
    requests { totalCount }
    messages { totalCount }
    clientProperties { nodes { address { street street1 city province postalCode } } }
  }`).join('\n')
  const data = await gql(`query { ${q} }`)
  for (const k of Object.keys(data)) if (data[k]) full.set(data[k].id, data[k])
  process.stderr.write(`${Math.min(i + 10, ids.length)}/${ids.length}\r`)
  await new Promise((r) => setTimeout(r, 900))
}
process.stderr.write('\n')

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
const tokens = (s) => new Set(clean(s).split(' ').filter((w) => w.length > 1))
const CALLER_ID_SHAPE = /^(wireless caller|.*\bwa$|private|restricted|unknown|businesscstmr)/i
const addrOf = (c) => (c.clientProperties?.nodes || []).map((p) => [p.address?.street1, p.address?.street, p.address?.city, p.address?.postalCode].filter(Boolean).join(' ')).filter(Boolean)
const work = (c) => (c.jobs?.totalCount || 0) + (c.quotes?.totalCount || 0) + (c.invoices?.totalCount || 0)

const rows = pairs.map((p) => {
  const j = full.get(p.junk.id)
  const r = full.get(p.realId)
  if (!j || !r) return null

  const jt = tokens(j.name)
  const rt = tokens(r.name)
  const shared = [...jt].filter((w) => rt.has(w))
  const junkIsCallerId = CALLER_ID_SHAPE.test(j.name.trim())

  // Do the two records point at the same place?
  const jAddr = addrOf(j).map(clean)
  const rAddr = addrOf(r).map(clean)
  const zipJ = new Set((addrOf(j).join(' ').match(/\b9\d{4}\b/g) || []))
  const zipR = new Set((addrOf(r).join(' ').match(/\b9\d{4}\b/g) || []))
  const sharedZip = [...zipJ].filter((z) => zipR.has(z))
  const cityJ = new Set(jAddr.flatMap((a) => a.split(' ')))
  const sameCity = rAddr.some((a) => a.split(' ').some((w) => w.length > 3 && cityJ.has(w)))

  let confidence, why
  if (shared.length >= 2) { confidence = 'STRONG'; why = 'full name matches' }
  else if (junkIsCallerId && sharedZip.length) { confidence = 'STRONG'; why = 'caller-ID stub, no name to contradict, same zip' }
  else if (junkIsCallerId && sameCity) { confidence = 'STRONG'; why = 'caller-ID stub, no name to contradict, same city' }
  else if (junkIsCallerId) { confidence = 'LIKELY'; why = 'caller-ID stub carries no name, so only the number links them' }
  else if (shared.length === 1) { confidence = 'REVIEW'; why = `only the surname matches (${shared[0]}) — could be a household member` }
  else { confidence = 'CONFLICT'; why = 'two different names on one number — do NOT merge without checking' }

  // The keeper is whichever record holds the real work. Messages must never
  // decide this: the stub often holds the thread and none of the history.
  const keeper = work(r) >= work(j) ? r : j
  const loser = keeper.id === r.id ? j : r
  const keeperIsJunk = keeper.id === j.id

  return {
    number: p.number,
    confidence,
    why,
    keeperIsJunk,
    keep: { id: keeper.id, name: keeper.name, url: `https://secure.getjobber.com/clients/${Buffer.from(keeper.id, 'base64').toString().split('/').pop()}`, jobs: keeper.jobs.totalCount, quotes: keeper.quotes.totalCount, invoices: keeper.invoices.totalCount, messages: keeper.messages.totalCount, balance: keeper.balance, created: keeper.createdAt.slice(0, 10), addresses: addrOf(keeper) },
    absorb: { id: loser.id, name: loser.name, url: `https://secure.getjobber.com/clients/${Buffer.from(loser.id, 'base64').toString().split('/').pop()}`, jobs: loser.jobs.totalCount, quotes: loser.quotes.totalCount, invoices: loser.invoices.totalCount, messages: loser.messages.totalCount, balance: loser.balance, created: loser.createdAt.slice(0, 10), addresses: addrOf(loser) },
  }
}).filter(Boolean)

// One number can carry several stubs; dedupe identical keep/absorb pairs.
const seen = new Set()
const deduped = rows.filter((r) => {
  const k = `${r.keep.id}|${r.absorb.id}`
  if (seen.has(k)) return false
  seen.add(k); return true
})

const tally = deduped.reduce((m, r) => (m[r.confidence] = (m[r.confidence] || 0) + 1, m), {})
writeFileSync(path.join(dataDir, 'merge-pairs.json'), JSON.stringify({ generatedAt: new Date().toISOString(), byConfidence: tally, keeperIsJunkCount: deduped.filter((r) => r.keeperIsJunk).length, rows: deduped }, null, 2))
console.log(JSON.stringify({ pairs: deduped.length, byConfidence: tally, keeperIsJunkCount: deduped.filter((r) => r.keeperIsJunk).length }, null, 2))
