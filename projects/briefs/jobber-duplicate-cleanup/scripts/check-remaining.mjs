// How many of the junk-named records are still live in Jobber right now?
// Reads data/.remaining-ids.json and checks each against the API. READ-ONLY.
import { readFileSync } from 'fs'
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
  for (let a = 1; a <= 6; a++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query }),
    })
    const json = JSON.parse(await res.text())
    if (json.errors?.some((e) => /THROTTLED/i.test(e.message)) && a < 6) { await new Promise((r) => setTimeout(r, 15000 * a)); continue }
    return json.data || {}
  }
  return {}
}

const ids = JSON.parse(readFileSync(path.join(dataDir, '.remaining-ids.json'), 'utf8'))
let live = 0, gone = 0
const names = []
for (let i = 0; i < ids.length; i += 20) {
  const slice = ids.slice(i, i + 20)
  const q = slice.map((id, n) => `c${n}: client(id: ${JSON.stringify(id)}) { id name isArchived }`).join(' ')
  const data = await gql(`query { ${q} }`)
  slice.forEach((id, n) => { const c = data[`c${n}`]; if (c) { live++; names.push(c.name) } else gone++ })
  await new Promise((r) => setTimeout(r, 800))
}
console.log(`checked ${ids.length}`)
console.log(`still live: ${live}`)
console.log(`already gone: ${gone}`)
