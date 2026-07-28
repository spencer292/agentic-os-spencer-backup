#!/usr/bin/env node
// rr-keyword-demand.mjs — pull real search volume for the kit keywords from Google's
// KeywordPlanIdeaService. Answers "is there demand for this?" with numbers rather than
// vibes. Read-only.
//
// Usage: node .../rr-keyword-demand.mjs [--seeds "a,b,c"]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf(k); return i === -1 ? d : argv[i + 1] }

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

const SEEDS = (arg('--seeds') || [
  'cleaning business contract template',
  'lawn care contract template',
  'pressure washing contract template',
  'cleaning business forms',
  'lawn care invoice template',
  'pressure washing estimate template',
  'cleaning business startup kit',
  'lawn care business forms',
].join(',')).split(',').map(s => s.trim()).filter(Boolean)

const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordIdeas`, {
  method: 'POST', headers,
  body: JSON.stringify({
    language: 'languageConstants/1000',        // English
    geoTargetConstants: ['geoTargetConstants/2840'], // United States
    keywordPlanNetwork: 'GOOGLE_SEARCH',
    keywordSeed: { keywords: SEEDS },
  }),
})
const j = await res.json()
if (!res.ok) { console.error('FAILED: ' + JSON.stringify(j).slice(0, 700)); process.exit(1) }

const rows = (j.results || []).map(r => ({
  keyword: r.text,
  monthly: Number(r.keywordIdeaMetrics?.avgMonthlySearches || 0),
  competition: r.keywordIdeaMetrics?.competition || 'UNKNOWN',
  lowBid: r.keywordIdeaMetrics?.lowTopOfPageBidMicros ? Number(r.keywordIdeaMetrics.lowTopOfPageBidMicros) / 1e6 : null,
  highBid: r.keywordIdeaMetrics?.highTopOfPageBidMicros ? Number(r.keywordIdeaMetrics.highTopOfPageBidMicros) / 1e6 : null,
})).filter(r => r.monthly > 0).sort((a, b) => b.monthly - a.monthly)

const total = rows.reduce((s, r) => s + r.monthly, 0)
console.log(JSON.stringify({
  seeds: SEEDS.length,
  ideasReturned: rows.length,
  totalMonthlySearches: total,
  top40: rows.slice(0, 40),
}, null, 2))
process.exit(0)
