#!/usr/bin/env node
// rr-pause-all.mjs — shut down Route Ready ads: pause every ENABLED campaign in the account
// and report spend by month since launch (the budget guard was blind from 2026-07-30).
// Uses ROUTE_READY_ADS_* creds only — never GOOGLE_ADS_* (those are Got Moles).
// Usage: node projects/briefs/zero-touch-business/scripts/rr-pause-all.mjs [--dry-run]
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
if (!t.access_token) { console.log(JSON.stringify({ status: 'ERROR', reason: 'AUTH_FAILED', detail: t.error_description || t.error })); process.exit(1) }

const headers = {
  Authorization: `Bearer ${t.access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC, 'Content-Type': 'application/json',
}
const API = `https://googleads.googleapis.com/v23/customers/${CID}`
const search = async (query) => {
  const r = await fetch(`${API}/googleAds:search`, { method: 'POST', headers, body: JSON.stringify({ query }) })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 400))
  return j.results || []
}

const camps = await search(`SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name FROM campaign WHERE campaign.status != 'REMOVED'`)
const spendRows = await search(`SELECT segments.month, metrics.cost_micros, metrics.clicks, metrics.impressions FROM customer WHERE segments.date BETWEEN '2026-07-01' AND '2026-12-31'`)
const spendByMonth = spendRows.map(r => ({
  month: r.segments.month, spendUsd: +(Number(r.metrics.costMicros || 0) / 1e6).toFixed(2),
  clicks: Number(r.metrics.clicks || 0), impressions: Number(r.metrics.impressions || 0),
}))

const toPause = camps.filter(c => c.campaign.status === 'ENABLED')
if (!DRY && toPause.length) {
  const r = await fetch(`${API}/campaigns:mutate`, {
    method: 'POST', headers,
    body: JSON.stringify({ operations: toPause.map(c => ({ update: { resourceName: c.campaign.resourceName, status: 'PAUSED' }, updateMask: 'status' })) }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 400))
}
const after = DRY ? camps : await search(`SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'`)

console.log(JSON.stringify({
  dryRun: DRY,
  paused: toPause.map(c => c.campaign.name),
  campaignsNow: after.map(c => ({ id: c.campaign.id, name: c.campaign.name, status: c.campaign.status })),
  spendByMonth,
  totalSpendUsd: +spendByMonth.reduce((s, m) => s + m.spendUsd, 0).toFixed(2),
}, null, 2))
