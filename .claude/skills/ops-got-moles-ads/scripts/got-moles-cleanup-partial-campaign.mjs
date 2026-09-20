#!/usr/bin/env node
// Remove the partial Branded campaign from a failed build
// Args: pass the campaign ID(s) to remove

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

const CID = '1665761172'
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

const CAMPAIGNS_TO_REMOVE = process.argv.slice(2)
if (!CAMPAIGNS_TO_REMOVE.length) {
  console.error('Usage: node scripts/got-moles-cleanup-partial-campaign.mjs <campaignId> [<campaignId>...]')
  process.exit(1)
}

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

const ops = CAMPAIGNS_TO_REMOVE.map(id => ({
  remove: `customers/${CID}/campaigns/${id}`,
}))

const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/campaigns:mutate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ operations: ops }),
})
const data = await res.json()
if (!res.ok) {
  console.error('FAIL:', JSON.stringify(data, null, 2))
  process.exit(1)
}
console.log('Removed:')
for (const r of data.results || []) console.log(`  ${r.resourceName}`)
