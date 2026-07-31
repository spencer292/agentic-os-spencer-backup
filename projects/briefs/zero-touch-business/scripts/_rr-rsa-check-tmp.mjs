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

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID.replace(/-/g, '')
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')

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
const headers = {
  'Authorization': `Bearer ${tokenData.access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}
const q = `SELECT ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, ad_group.name FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'`
const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`, { method: 'POST', headers, body: JSON.stringify({ query: q }) })
const j = await r.json()
if (!r.ok) { console.log('ERROR', JSON.stringify(j)); process.exit(1) }
for (const row of j.results || []) {
  console.log(row.adGroup.name, '-', row.adGroupAd.status, '-', row.adGroupAd.policySummary.approvalStatus)
}
