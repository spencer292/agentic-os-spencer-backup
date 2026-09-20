#!/usr/bin/env node
// Inspect Got Moles campaigns + budgets, pause any ENABLED campaign (placeholder safeguard).
// Usage: node scripts/got-moles-pause-placeholder.mjs [--dry-run]

import fs from 'node:fs'
import path from 'node:path'

const DRY_RUN = process.argv.includes('--dry-run')

const env = {}
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const CID = '1665761172'
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

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}

async function gaql(query) {
  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2)); process.exit(1) }
  return data
}

console.log('Inspecting campaigns + budgets…\n')
const camps = await gaql(`
  SELECT
    campaign.resource_name,
    campaign.id,
    campaign.name,
    campaign.status,
    campaign.advertising_channel_type,
    campaign_budget.amount_micros,
    campaign_budget.delivery_method
  FROM campaign
  WHERE campaign.status != 'REMOVED'
`)

const toPause = []
for (const r of camps.results || []) {
  const c = r.campaign
  const b = r.campaignBudget || {}
  const dollars = b.amountMicros ? `$${(Number(b.amountMicros) / 1_000_000).toFixed(2)}/day` : '(no budget)'
  console.log(`  [${c.status}] ${c.name}  (${c.advertisingChannelType})  budget: ${dollars}  delivery: ${b.deliveryMethod || '-'}`)
  if (c.status === 'ENABLED') toPause.push(c.resourceName)
}

if (!toPause.length) {
  console.log('\nNo ENABLED campaigns. Nothing to pause.')
  process.exit(0)
}

if (DRY_RUN) {
  console.log(`\n[DRY RUN] Would pause: ${toPause.join(', ')}`)
  process.exit(0)
}

console.log(`\nPausing ${toPause.length} campaign(s)…`)
const mutateRes = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/campaigns:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({
    operations: toPause.map(rn => ({
      update: { resourceName: rn, status: 'PAUSED' },
      updateMask: 'status',
    })),
  }),
})
const mutateData = await mutateRes.json()
if (!mutateRes.ok) { console.error('FAIL:', JSON.stringify(mutateData, null, 2)); process.exit(1) }
console.log('  OK — paused:', mutateData.results.map(r => r.resourceName).join(', '))

console.log('\nDone.')
