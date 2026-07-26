#!/usr/bin/env node
// rr-fund-campaign.mjs — one-off: fund the Route Ready launch campaign (24059425574) to a
// level that can actually win auctions. Budget $2.47/day -> $8.00/day; MaxClicks CPC
// ceiling $1.25 -> $3.00. Reason: 3 days ENABLED with 0 impressions and <10% impression
// share — everything eligible/approved, just priced out of the auction.
//
// Uses ROUTE_READY_ADS_* creds only — never GOOGLE_ADS_* (those are Got Moles).
// Prints month-to-date spend against the $75/mo policy cap before mutating.
// Usage: node projects/briefs/zero-touch-business/scripts/rr-fund-campaign.mjs [--dry-run]
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
  const j = await r.json(); if (!r.ok) { console.error(JSON.stringify(j).slice(0, 600)); process.exit(1) }
  return j.results || []
}

const mtd = await search(`SELECT metrics.cost_micros FROM campaign WHERE segments.date DURING THIS_MONTH`)
const spentUsd = mtd.reduce((s, r) => s + Number(r.metrics?.costMicros || 0), 0) / 1e6
console.log(`month-to-date spend: $${spentUsd.toFixed(2)} of $75.00 policy cap`)

const [camp] = await search(`SELECT campaign.id, campaign.name, campaign.bidding_strategy_type, campaign.target_spend.cpc_bid_ceiling_micros, campaign_budget.id, campaign_budget.amount_micros FROM campaign WHERE campaign.id = 24059425574`)
console.log('before: ' + JSON.stringify({
  budgetPerDay: Number(camp.campaignBudget.amountMicros) / 1e6,
  cpcCeiling: Number(camp.campaign.targetSpend?.cpcBidCeilingMicros || 0) / 1e6,
  strategy: camp.campaign.biddingStrategyType,
}))

if (DRY) { console.log('dry run — no mutations applied'); process.exit(0) }

const budgetRes = await fetch(`${API}/campaignBudgets:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({ operations: [{ update: { resourceName: camp.campaignBudget.resourceName, amountMicros: '8000000' }, updateMask: 'amount_micros' }] }),
})
const budgetJson = await budgetRes.json()
console.log('budget mutate: ' + (budgetRes.ok ? JSON.stringify(budgetJson.results) : JSON.stringify(budgetJson).slice(0, 800)))

const campRes = await fetch(`${API}/campaigns:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({ operations: [{ update: { resourceName: camp.campaign.resourceName, targetSpend: { cpcBidCeilingMicros: '3000000' } }, updateMask: 'target_spend.cpc_bid_ceiling_micros' }] }),
})
const campJson = await campRes.json()
console.log('campaign mutate: ' + (campRes.ok ? JSON.stringify(campJson.results) : JSON.stringify(campJson).slice(0, 800)))

const [after] = await search(`SELECT campaign.id, campaign.status, campaign.primary_status, campaign.target_spend.cpc_bid_ceiling_micros, campaign_budget.amount_micros FROM campaign WHERE campaign.id = 24059425574`)
console.log('after: ' + JSON.stringify({
  budgetPerDay: Number(after.campaignBudget.amountMicros) / 1e6,
  cpcCeiling: Number(after.campaign.targetSpend?.cpcBidCeilingMicros || 0) / 1e6,
  status: after.campaign.status,
  primaryStatus: after.campaign.primaryStatus,
}))
