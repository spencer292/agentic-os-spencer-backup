#!/usr/bin/env node
// Smoke test: read Got Moles account state via MCC.
// Usage: node scripts/test-got-moles-ads-access.mjs

import fs from 'node:fs'
import path from 'node:path'

const env = {}
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const GOT_MOLES_ID = '1665761172'
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})
const { access_token } = await tokenRes.json()

async function gaqlSearch(query) {
  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${GOT_MOLES_ID}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': MCC,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('FAIL:', JSON.stringify(data, null, 2))
    process.exit(1)
  }
  return data
}

console.log('1. Account info...')
const info = await gaqlSearch('SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.auto_tagging_enabled FROM customer LIMIT 1')
console.log('  ', info.results[0].customer)

console.log('\n2. Active campaigns...')
const camps = await gaqlSearch(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
  FROM campaign
  WHERE campaign.status != 'REMOVED'
`)
console.log(`   Found ${camps.results?.length || 0} campaigns`)
for (const r of camps.results || []) {
  console.log(`   - [${r.campaign.status}] ${r.campaign.name} (${r.campaign.advertisingChannelType}, started ${r.campaign.startDate})`)
}

console.log('\n3. Last 30d performance summary...')
const perf = await gaqlSearch(`
  SELECT customer.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
  FROM customer
  WHERE segments.date DURING LAST_30_DAYS
`)
const totals = (perf.results || []).reduce((a, r) => ({
  impr: a.impr + Number(r.metrics?.impressions || 0),
  clicks: a.clicks + Number(r.metrics?.clicks || 0),
  cost: a.cost + Number(r.metrics?.costMicros || 0),
  conv: a.conv + Number(r.metrics?.conversions || 0),
}), { impr: 0, clicks: 0, cost: 0, conv: 0 })
console.log(`   Impressions: ${totals.impr.toLocaleString()}`)
console.log(`   Clicks: ${totals.clicks.toLocaleString()}`)
console.log(`   Spend: $${(totals.cost / 1_000_000).toFixed(2)}`)
console.log(`   Conversions: ${totals.conv.toFixed(1)}`)

console.log('\nAll checks passed. Got Moles API access is live.')
