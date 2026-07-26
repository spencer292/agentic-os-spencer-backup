#!/usr/bin/env node
// rr-budget-guard.mjs — enforce the $75/month Route Ready ad-spend policy cap.
//
// Why this exists: the campaign budget was raised from $2.47/day to $8.00/day (2026-07-26)
// so it could actually enter auctions. At $8/day the $75 monthly cap can be consumed in
// ~9 serving days, and ztb-ads-manager only runs on Tuesdays — a weekly check is too coarse
// to hold the cap. This runs daily and pauses the campaign the moment the cap is reached.
//
// Rules:
//   - month-to-date spend >= CAP        -> pause campaign (idempotent), report PAUSED_AT_CAP
//   - month-to-date spend >= 80% of CAP -> report WARNING, no mutation
//   - first run of a new month          -> re-enable a campaign that this guard paused
//
// Uses ROUTE_READY_ADS_* creds only — never GOOGLE_ADS_* (those are Got Moles).
// Usage: node projects/briefs/zero-touch-business/scripts/rr-budget-guard.mjs [--dry-run]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DRY = process.argv.includes('--dry-run')
const CAP_USD = 75
const CAMPAIGN_ID = '24059425574'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const envPath = resolve(here, '..', '..', '..', '..', '.env')
const ledgerPath = resolve(projectRoot, 'runs', 'budget-guard-ledger.json')

const env = {}
for (const l of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue
  let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}
const REQUIRED = ['ROUTE_READY_ADS_CLIENT_ID', 'ROUTE_READY_ADS_CLIENT_SECRET', 'ROUTE_READY_ADS_REFRESH_TOKEN', 'ROUTE_READY_ADS_DEVELOPER_TOKEN', 'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID', 'ROUTE_READY_ADS_CUSTOMER_ID']
const missing = REQUIRED.filter(k => !env[k])
if (missing.length) { console.log(JSON.stringify({ status: 'SKIPPED', reason: 'missing .env keys', missing })); process.exit(0) }

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
  if (!r.ok) { console.log(JSON.stringify({ status: 'ERROR', reason: 'GAQL_FAILED', detail: JSON.stringify(j).slice(0, 400) })); process.exit(1) }
  return j.results || []
}

const setStatus = async (resourceName, status) => {
  const r = await fetch(`${API}/campaigns:mutate`, {
    method: 'POST', headers,
    body: JSON.stringify({ operations: [{ update: { resourceName, status }, updateMask: 'status' }] }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 400))
  return j.results
}

const rows = await search(`SELECT metrics.cost_micros FROM campaign WHERE segments.date DURING THIS_MONTH`)
const spent = rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0), 0) / 1e6

const [camp] = await search(`SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`)
if (!camp) { console.log(JSON.stringify({ status: 'ERROR', reason: 'campaign not found', campaignId: CAMPAIGN_ID })); process.exit(1) }

const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : { pausedByGuardMonth: null }
const month = new Date().toISOString().slice(0, 7)
const dailyBudget = Number(camp.campaignBudget.amountMicros) / 1e6
const remaining = Math.max(0, CAP_USD - spent)

const out = {
  checked_at: new Date().toISOString(),
  month, capUsd: CAP_USD, spentUsd: Number(spent.toFixed(2)), remainingUsd: Number(remaining.toFixed(2)),
  dailyBudgetUsd: dailyBudget,
  daysOfRunwayLeft: dailyBudget > 0 ? Number((remaining / dailyBudget).toFixed(1)) : null,
  campaignStatus: camp.campaign.status,
  action: 'none',
  dryRun: DRY,
}

if (spent >= CAP_USD && camp.campaign.status === 'ENABLED') {
  out.status = 'PAUSED_AT_CAP'
  out.action = DRY ? 'would pause campaign' : 'paused campaign'
  if (!DRY) {
    await setStatus(camp.campaign.resourceName, 'PAUSED')
    fs.writeFileSync(ledgerPath, JSON.stringify({ ...ledger, pausedByGuardMonth: month }, null, 2))
    out.campaignStatus = 'PAUSED'
  }
} else if (ledger.pausedByGuardMonth && ledger.pausedByGuardMonth !== month && camp.campaign.status === 'PAUSED') {
  out.status = 'NEW_MONTH_RESUME'
  out.action = DRY ? 'would re-enable campaign (new month, cap reset)' : 're-enabled campaign (new month, cap reset)'
  if (!DRY) {
    await setStatus(camp.campaign.resourceName, 'ENABLED')
    fs.writeFileSync(ledgerPath, JSON.stringify({ ...ledger, pausedByGuardMonth: null }, null, 2))
    out.campaignStatus = 'ENABLED'
  }
} else if (spent >= CAP_USD * 0.8) {
  out.status = 'WARNING_NEAR_CAP'
} else {
  out.status = 'OK'
}

console.log(JSON.stringify(out, null, 2))
