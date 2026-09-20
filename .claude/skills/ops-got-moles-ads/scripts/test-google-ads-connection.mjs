#!/usr/bin/env node
// Connectivity test for Google Ads API.
// Reads creds from .env, mints an access token, calls listAccessibleCustomers.
// Usage: node scripts/test-google-ads-connection.mjs

import fs from 'node:fs'
import path from 'node:path'

const ENV_PATH = path.resolve(process.cwd(), '.env')
if (!fs.existsSync(ENV_PATH)) {
  console.error(`No .env found at ${ENV_PATH}`)
  process.exit(1)
}

const env = {}
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const need = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  'GOOGLE_ADS_CUSTOMER_ID',
]
const missing = need.filter(k => !env[k])
if (missing.length) {
  console.error('Missing in .env:', missing.join(', '))
  process.exit(1)
}

const VERSION = 'v23'

console.log('1. Minting access token from refresh token…')
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
const tokenData = await tokenRes.json()
if (!tokenRes.ok || !tokenData.access_token) {
  console.error('  FAIL:', tokenData)
  process.exit(1)
}
console.log('  OK — access token minted (expires in', tokenData.expires_in, 's)')

console.log(`2. Calling listAccessibleCustomers (${VERSION})…`)
const listRes = await fetch(`https://googleads.googleapis.com/${VERSION}/customers:listAccessibleCustomers`, {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  },
})
const listData = await listRes.json()
if (!listRes.ok) {
  console.error('  FAIL:', JSON.stringify(listData, null, 2))
  process.exit(1)
}
console.log('  OK — accessible customers:')
for (const r of (listData.resourceNames || [])) console.log('    -', r)

const targetId = env.GOOGLE_ADS_CUSTOMER_ID
console.log(`3. Querying customer info for advertiser ${targetId} via MCC ${env.GOOGLE_ADS_LOGIN_CUSTOMER_ID}…`)
const queryRes = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/googleAds:search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1',
  }),
})
const queryData = await queryRes.json()
if (!queryRes.ok) {
  console.error('  FAIL:', JSON.stringify(queryData, null, 2))
  process.exit(1)
}
console.log('  OK — customer details:')
console.log(JSON.stringify(queryData, null, 2))

console.log('\nAll three checks passed. Google Ads API is wired up and working.')
