// Remove the fake caller-ID properties the merges dragged across.
//
// A CallRail stub carries a city-only property ("Seattle, WA", "Chicago
// (Wabash), IL"). Merging moves it onto the real client, who now shows two
// properties. This deletes the city-only one — but only when it holds no jobs
// and no visits, so a property anything is actually booked against is never
// touched.
//
// Dry run by default. Uses the API (clientEdit propertiesToDelete), not the UI.
import { readFileSync, readdirSync, appendFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const dataDir = path.resolve(here, '../data')
const EXECUTE = process.argv.includes('--execute')

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

async function gql(query, variables) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query, variables }),
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

const keeperIds = new Set()
for (const f of readdirSync(dataDir).filter((n) => /^merge-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) keeperIds.add(e.keepId)
  }
}
const ids = [...keeperIds]
console.log(`keepers to inspect: ${ids.length}`)

const plan = []
for (let i = 0; i < ids.length; i += 6) {
  const slice = ids.slice(i, i + 6)
  const q = slice.map((id, n) => `c${n}: client(id: ${JSON.stringify(id)}) {
    id name
    clientProperties { nodes { id address { street street1 street2 city province postalCode } jobs { totalCount } } }
  }`).join('\n')
  const data = await gql(`query { ${q} }`)
  for (const k of Object.keys(data)) {
    const c = data[k]
    if (!c) continue
    const props = c.clientProperties.nodes
    if (props.length < 2) continue
    for (const p of props) {
      const hasStreet = Boolean((p.address?.street1 || '').trim() || (p.address?.street || '').trim())
      const jobs = p.jobs?.totalCount || 0
      // Only a street-less property with nothing booked against it is litter.
      if (!hasStreet && jobs === 0) {
        plan.push({ clientId: c.id, clientName: c.name, propertyId: p.id, label: [p.address?.city, p.address?.province].filter(Boolean).join(', ') })
      }
    }
  }
  await new Promise((r) => setTimeout(r, 900))
}

console.log(`${EXECUTE ? 'DELETING' : 'DRY RUN — would delete'} ${plan.length} caller-ID properties`)
for (const p of plan.slice(0, 25)) console.log(`  ${p.clientName.padEnd(20)} -> "${p.label}"`)
if (plan.length > 25) console.log(`  … and ${plan.length - 25} more`)

if (EXECUTE) {
  const LOG = path.join(dataDir, `property-clean-log-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`)
  let ok = 0, failed = 0
  for (const p of plan) {
    try {
      const data = await gql(
        `mutation ($clientId: EncodedId!, $input: ClientEditInput!) { clientEdit(clientId: $clientId, input: $input) { client { id clientProperties { totalCount } } userErrors { message } } }`,
        { clientId: p.clientId, input: { propertiesToDelete: [p.propertyId] } }
      )
      const errs = data.clientEdit?.userErrors || []
      if (errs.length) { failed++; appendFileSync(LOG, JSON.stringify({ ...p, ok: false, error: errs.map((e) => e.message).join('; ') }) + '\n'); console.log(`  FAIL ${p.clientName}: ${errs.map((e) => e.message).join('; ')}`) }
      else { ok++; appendFileSync(LOG, JSON.stringify({ ...p, ok: true, at: new Date().toISOString() }) + '\n') }
    } catch (err) {
      failed++
      appendFileSync(LOG, JSON.stringify({ ...p, ok: false, error: String(err.message).slice(0, 200) }) + '\n')
      console.log(`  FAIL ${p.clientName}: ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 600))
  }
  console.log(`removed ${ok}, failed ${failed}`)
  console.log(`log: ${LOG}`)
} else {
  console.log('\nre-run with --execute to remove them.')
}
