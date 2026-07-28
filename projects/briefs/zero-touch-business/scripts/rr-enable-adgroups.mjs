#!/usr/bin/env node
// rr-enable-adgroups.mjs — enable the PW + Lawn ad groups once their kits are purchasable.
// Gated deliberately: these stayed PAUSED from campaign build (2026-07-22) until the
// products existed, because advertising an unbuyable product is the 2026-07-20
// store-closed incident in reverse.
//
// Usage: node .../rr-enable-adgroups.mjs [--dry-run]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DRY = process.argv.includes('--dry-run')
const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')

const env = {}
for (const l of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue
  let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}
const CID = env.ROUTE_READY_ADS_CUSTOMER_ID.replace(/-/g, '')
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')

const t = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.ROUTE_READY_ADS_CLIENT_ID, client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET,
    refresh_token: env.ROUTE_READY_ADS_REFRESH_TOKEN, grant_type: 'refresh_token',
  }),
})).json()
if (!t.access_token) { console.error('AUTH_FAILED', t.error_description || t.error); process.exit(1) }

const headers = {
  Authorization: `Bearer ${t.access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC, 'Content-Type': 'application/json',
}
const API = `https://googleads.googleapis.com/v23/customers/${CID}`

const search = async (query) => {
  const r = await fetch(`${API}/googleAds:search`, { method: 'POST', headers, body: JSON.stringify({ query }) })
  const j = await r.json(); if (!r.ok) { console.error(JSON.stringify(j).slice(0, 500)); process.exit(1) }
  return j.results || []
}

const rows = await search(`SELECT ad_group.id, ad_group.name, ad_group.status FROM ad_group`)
const targets = rows
  .map(r => r.adGroup)
  .filter(a => /Pressure Washing|Lawn Care/i.test(a.name) && a.status === 'PAUSED')

console.log('before: ' + JSON.stringify(rows.map(r => ({ name: r.adGroup.name, status: r.adGroup.status }))))
if (!targets.length) { console.log('nothing to enable — both already ENABLED or missing'); process.exit(0) }
if (DRY) { console.log('dry run — would enable: ' + targets.map(a => a.name).join(', ')); process.exit(0) }

const res = await fetch(`${API}/adGroups:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({
    operations: targets.map(a => ({
      update: { resourceName: `customers/${CID}/adGroups/${a.id}`, status: 'ENABLED' },
      updateMask: 'status',
    })),
  }),
})
const j = await res.json()
if (!res.ok) { console.error('MUTATE FAILED: ' + JSON.stringify(j).slice(0, 500)); process.exit(1) }
console.log('enabled: ' + targets.map(a => a.name).join(', '))

const after = await search(`SELECT ad_group.name, ad_group.status, ad_group.primary_status FROM ad_group`)
console.log('after: ' + JSON.stringify(after.map(r => ({
  name: r.adGroup.name, status: r.adGroup.status, primary: r.adGroup.primaryStatus,
}))))
process.exit(0)
