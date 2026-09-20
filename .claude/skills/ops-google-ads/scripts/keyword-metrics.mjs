#!/usr/bin/env node
// keyword-metrics.mjs — pull exact historical search-volume metrics for a precise
// keyword list via KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics.
// READ-ONLY: generates metrics, never touches the account. Uses the requesting
// account only as the API caller — volumes are geo/language driven, not account data.
//
// Usage:
//   node .claude/skills/ops-google-ads/scripts/keyword-metrics.mjs <geoConstant> [keywordsFile]
//   geoConstant: 2840 = US (default), 2826 = UK
//   keywordsFile: optional path to a newline-delimited keyword list; else uses built-in set.
//
// Run from the repo root so .env resolves.

import fs from 'node:fs'
import { loadEnv, API_VERSION } from './lib/ads-client.mjs'

const BASE = `https://googleads.googleapis.com/${API_VERSION}`
const geo = (process.argv[2] || '2840').replace(/\D/g, '')
const kwFile = process.argv[3]
const LANG = 'languageConstants/1000' // English

const DEFAULT_KEYWORDS = [
  // individual / cert-seeker intent (expected higher volume, wrong buyer)
  'cisco training', 'ccna training', 'ccna certification', 'cisco certification',
  'ccnp training', 'ccnp certification', 'cisco courses', 'ccna course',
  'cisco online training', 'cisco bootcamp',
  // enterprise / credits / buyer-side intent (the people Firefly actually wants)
  'cisco learning credits', 'redeem cisco learning credits', 'cisco learning partner',
  'cisco authorized training', 'cisco corporate training', 'cisco training for teams',
  'cisco enterprise training', 'cisco training provider',
  // branded / competitor
  'fast lane cisco training', 'global knowledge cisco',
]

const keywords = kwFile
  ? fs.readFileSync(kwFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  : DEFAULT_KEYWORDS

const env = loadEnv()
const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '')
const loginCustomerId = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')

// Mint access token
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
if (!tokenRes.ok || !tokenData.access_token) throw new Error(`Token mint failed: ${JSON.stringify(tokenData)}`)

const headers = {
  'Authorization': `Bearer ${tokenData.access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': loginCustomerId,
  'Content-Type': 'application/json',
}

// Account currency (for labelling CPC bid estimates)
let currency = '?'
try {
  const r = await fetch(`${BASE}/customers/${customerId}/googleAds:search`, {
    method: 'POST', headers,
    body: JSON.stringify({ query: 'SELECT customer.currency_code FROM customer LIMIT 1' }),
  })
  const j = await r.json()
  currency = j?.results?.[0]?.customer?.currencyCode || '?'
} catch { /* non-fatal */ }

// Pull historical metrics for the exact keyword list
const res = await fetch(`${BASE}/customers/${customerId}:generateKeywordHistoricalMetrics`, {
  method: 'POST', headers,
  body: JSON.stringify({
    keywords,
    language: LANG,
    geoTargetConstants: [`geoTargetConstants/${geo}`],
    keywordPlanNetwork: 'GOOGLE_SEARCH',
    includeAdultKeywords: false,
  }),
})
const data = await res.json()
if (!res.ok) throw new Error(`generateKeywordHistoricalMetrics ${res.status}: ${JSON.stringify(data)}`)

const geoName = geo === '2840' ? 'United States' : geo === '2826' ? 'United Kingdom' : `geo ${geo}`
const micros = v => (v == null ? null : Number(v) / 1e6)
const fmtBid = v => (v == null ? '—' : `${currency} ${micros(v).toFixed(2)}`)

const rows = (data.results || []).map(r => ({
  kw: r.text,
  vol: r.keywordMetrics?.avgMonthlySearches != null ? Number(r.keywordMetrics.avgMonthlySearches) : null,
  comp: r.keywordMetrics?.competition || '—',
  idx: r.keywordMetrics?.competitionIndex != null ? Number(r.keywordMetrics.competitionIndex) : null,
  low: r.keywordMetrics?.lowTopOfPageBidMicros,
  high: r.keywordMetrics?.highTopOfPageBidMicros,
})).sort((a, b) => (b.vol ?? -1) - (a.vol ?? -1))

console.log(`\nGoogle Ads — historical monthly search volume`)
console.log(`Geo: ${geoName} (${geo})   Network: Google Search   Lang: English   Bid currency: ${currency}`)
console.log(`Source account (caller only): ${customerId}\n`)
const pad = (s, n) => String(s).padEnd(n)
const padL = (s, n) => String(s).padStart(n)
console.log(pad('Keyword', 32) + padL('Avg/mo', 9) + '  ' + pad('Competition', 13) + pad('Top-of-page bid (low–high)', 28))
console.log('-'.repeat(82))
for (const r of rows) {
  const vol = r.vol == null ? 'no data' : r.vol.toLocaleString()
  const comp = r.comp + (r.idx != null ? ` (${r.idx})` : '')
  const bid = `${fmtBid(r.low)} – ${fmtBid(r.high)}`
  console.log(pad(r.kw, 32) + padL(vol, 9) + '  ' + pad(comp, 13) + bid)
}
console.log('')
