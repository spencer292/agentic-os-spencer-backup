// Confirm every id in the delete logs really is gone from Jobber.
// A deleted client returns null; anything that comes back with data survived.
// READ-ONLY.
import { readFileSync, readdirSync } from 'fs'
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

const entries = []
for (const f of readdirSync(dataDir).filter((n) => /^delete-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) entries.push(e)
  }
}
console.log(`ids marked deleted: ${entries.length}`)

const survivors = []
for (let i = 0; i < entries.length; i += 25) {
  const slice = entries.slice(i, i + 25)
  const q = slice.map((e, n) => `c${n}: client(id: ${JSON.stringify(e.id)}) { id name }`).join(' ')
  const data = await gql(`query { ${q} }`)
  slice.forEach((e, n) => { if (data[`c${n}`]) survivors.push({ ...e, live: data[`c${n}`] }) })
  process.stderr.write(`${Math.min(i + 25, entries.length)}/${entries.length}\r`)
  await new Promise((r) => setTimeout(r, 800))
}
process.stderr.write('\n')
console.log(`confirmed gone: ${entries.length - survivors.length}`)
console.log(`still present:  ${survivors.length}`)
for (const s of survivors.slice(0, 20)) console.log(`   - ${s.name} ${s.id}`)
