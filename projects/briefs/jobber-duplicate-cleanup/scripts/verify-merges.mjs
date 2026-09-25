// Confirm every merge landed the right way round.
//
// Two things must hold for each logged merge: the absorbed record is gone, and
// the keeper still holds its work. A keeper that lost jobs, or an absorbed
// record still present, means the merge went the wrong way.
// READ-ONLY.
import { readFileSync, readdirSync, existsSync } from 'fs'
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
    return json.data || {}
  }
  return {}
}

// Pre-merge snapshots live in both pair files — the junk-stub set and the
// duplicate set — so load whichever exist.
const before = new Map()
for (const f of ['merge-pairs.json', 'duplicate-pairs.json']) {
  const p = path.join(dataDir, f)
  if (!existsSync(p)) continue
  for (const r of JSON.parse(readFileSync(p, 'utf8')).rows) before.set(r.absorb.id, r)
}
const merges = []
for (const f of readdirSync(dataDir).filter((n) => /^merge-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) merges.push(e)
  }
}
console.log(`merges logged: ${merges.length}`)

const problems = []
for (let i = 0; i < merges.length; i += 8) {
  const slice = merges.slice(i, i + 8)
  const q = slice.map((m, n) => `
    k${n}: client(id: ${JSON.stringify(m.keepId)}) { id name jobs { totalCount } quotes { totalCount } invoices { totalCount } messages { totalCount } balance clientProperties { totalCount } }
    a${n}: client(id: ${JSON.stringify(m.absorbId)}) { id name }`).join('\n')
  const data = await gql(`query { ${q} }`)
  slice.forEach((m, n) => {
    const keep = data[`k${n}`]
    const absorbed = data[`a${n}`]
    const prior = before.get(m.absorbId)
    if (absorbed) problems.push(`${m.absorbName}: absorbed record STILL EXISTS`)
    if (!keep) { problems.push(`${m.keepName}: KEEPER IS GONE — merge went the wrong way`); return }
    if (prior) {
      const lost = ['jobs', 'quotes', 'invoices'].filter((k) => keep[k].totalCount < prior.keep[k])
      if (lost.length) problems.push(`${m.keepName}: keeper lost ${lost.join('/')}`)
    }
    console.log(`  OK  ${String(m.keepName).padEnd(20)} j${keep.jobs.totalCount} q${keep.quotes.totalCount} i${keep.invoices.totalCount} msg${keep.messages.totalCount} bal${keep.balance} props${keep.clientProperties.totalCount}  (absorbed "${m.absorbName}")`)
  })
  await new Promise((r) => setTimeout(r, 900))
}
console.log(`\nproblems: ${problems.length}`)
for (const p of problems) console.log(`  !! ${p}`)
