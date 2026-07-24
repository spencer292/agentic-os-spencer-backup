#!/usr/bin/env node
// rr-ads-smoke-test.mjs — verify live Google Ads API access to the Route Ready
// account (763-085-7815) via MCC 143-307-0544 using ROUTE_READY_ADS_* creds.
// Usage: node projects/briefs/zero-touch-business/scripts/rr-ads-smoke-test.mjs
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const missing = ['ROUTE_READY_ADS_CLIENT_ID', 'ROUTE_READY_ADS_CLIENT_SECRET', 'ROUTE_READY_ADS_REFRESH_TOKEN', 'ROUTE_READY_ADS_DEVELOPER_TOKEN', 'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID', 'ROUTE_READY_ADS_CUSTOMER_ID'].filter(k => !env[k])
if (missing.length) { console.error('FAIL: missing .env keys:', missing.join(', ')); process.exit(1) }

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.ROUTE_READY_ADS_CLIENT_ID,
    client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET,
    refresh_token: env.ROUTE_READY_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})
const tokenData = await tokenRes.json()
if (!tokenData.access_token) { console.error('FAIL: OAuth refresh failed:', tokenData.error, tokenData.error_description || ''); process.exit(1) }
console.log('0. OAuth refresh OK')

async function gaqlSearch(customerId, query) {
  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
      'login-customer-id': MCC,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2)); process.exit(1) }
  return data
}

console.log('1. MCC link check...')
const links = await gaqlSearch(MCC, `SELECT customer_client.client_customer, customer_client.status, customer_client.descriptive_name FROM customer_client WHERE customer_client.level = 1`)
for (const r of links.results || []) console.log('   -', r.customerClient.clientCustomer, r.customerClient.status, r.customerClient.descriptiveName || '')

console.log('2. Account info...')
const info = await gaqlSearch(CID, 'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1')
console.log('  ', JSON.stringify(info.results?.[0]?.customer))

console.log('3. Campaigns...')
const camps = await gaqlSearch(CID, `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'`)
console.log(`   ${camps.results?.length || 0} campaigns`)
for (const r of camps.results || []) console.log(`   - [${r.campaign.status}] ${r.campaign.name}`)

console.log('\nAll checks passed. Route Ready ads API access is live.')
