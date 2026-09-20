#!/usr/bin/env node
// Enable the Got Moles Branded campaign + ad group

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
const CAMPAIGN_ID = '23819590031'
const AD_GROUP_ID = '196657777816'

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

console.log('Enabling campaign...')
const c = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/campaigns:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({
    operations: [{
      update: { resourceName: `customers/${CID}/campaigns/${CAMPAIGN_ID}`, status: 'ENABLED' },
      updateMask: 'status',
    }],
  }),
})
const cd = await c.json()
if (!c.ok) { console.error('FAIL campaign:', JSON.stringify(cd, null, 2)); process.exit(1) }
console.log('  OK:', cd.results[0].resourceName)

console.log('Enabling ad group...')
const a = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/adGroups:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({
    operations: [{
      update: { resourceName: `customers/${CID}/adGroups/${AD_GROUP_ID}`, status: 'ENABLED' },
      updateMask: 'status',
    }],
  }),
})
const ad = await a.json()
if (!a.ok) { console.error('FAIL adGroup:', JSON.stringify(ad, null, 2)); process.exit(1) }
console.log('  OK:', ad.results[0].resourceName)

console.log('\n✅ Branded campaign LIVE')
console.log(`   Campaign: customers/${CID}/campaigns/${CAMPAIGN_ID}`)
console.log(`   Ad group: customers/${CID}/adGroups/${AD_GROUP_ID}`)
console.log(`   View:     https://ads.google.com/aw/campaigns?campaignId=${CAMPAIGN_ID}&__c=${CID}`)
