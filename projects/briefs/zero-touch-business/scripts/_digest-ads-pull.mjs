#!/usr/bin/env node
// _digest-ads-pull.mjs — read-only last-7-day spend/clicks/conversions pull
// for the weekly Route Ready digest. Never mutates anything.
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

const required = ['ROUTE_READY_ADS_CLIENT_ID', 'ROUTE_READY_ADS_CLIENT_SECRET', 'ROUTE_READY_ADS_REFRESH_TOKEN', 'ROUTE_READY_ADS_DEVELOPER_TOKEN', 'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID', 'ROUTE_READY_ADS_CUSTOMER_ID']
const missing = required.filter(k => !env[k])
if (missing.length) { console.log(JSON.stringify({ error: 'ads not live', missing })); process.exit(0) }

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID

try {
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
  if (!tokenData.access_token) { console.log(JSON.stringify({ error: 'OAuth refresh failed', detail: tokenData.error_description || tokenData.error })); process.exit(0) }

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
    if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 500))
    return data
  }

  const rows = await gaqlSearch(CID, `
    SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.conversions, metrics.impressions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS AND campaign.status != 'REMOVED'
  `)

  let spend = 0, clicks = 0, conversions = 0, impressions = 0
  const campaigns = []
  for (const r of rows.results || []) {
    const costUsd = (Number(r.metrics.costMicros || 0)) / 1e6
    spend += costUsd
    clicks += Number(r.metrics.clicks || 0)
    conversions += Number(r.metrics.conversions || 0)
    impressions += Number(r.metrics.impressions || 0)
    campaigns.push({ name: r.campaign.name, status: r.campaign.status, spend: costUsd, clicks: Number(r.metrics.clicks || 0), conversions: Number(r.metrics.conversions || 0) })
  }

  console.log(JSON.stringify({ ok: true, last_7_days: { spend, clicks, conversions, impressions }, campaigns }, null, 2))
} catch (e) {
  console.log(JSON.stringify({ error: 'GAQL request failed', detail: String(e.message || e).slice(0, 500) }))
}
