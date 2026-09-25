#!/usr/bin/env node
// Got Moles — city demand from FIRST-PARTY account data (the reliable source).
// Pulls 90d keyword performance (impr/clicks/cost/conv) aggregated by city,
// plus the T1 campaign's budget-lost impression share (the budget-ceiling reality).
// Read-only. Usage: node scripts/_got-moles-city-demand-account.mjs
import fs from 'node:fs'
import path from 'node:path'

const env = {}
for (const line of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue
  let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}
const CID = '1665761172'
const tk = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })
const at = (await tk.json()).access_token
async function gaql(query) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const j = await r.json(); if (j.error) { console.error('ERR', JSON.stringify(j.error).slice(0, 400)); process.exit(1) }
  return j.results || []
}

// --- 1. Campaign budget reality (30d) ---
const camp = await gaql(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status='ENABLED' AND metrics.impressions > 0`)
console.log('=== CAMPAIGN BUDGET REALITY (last 30d) ===')
for (const c of camp) {
  const m = c.metrics
  console.log(`${c.campaign.name}`)
  console.log(`  cost $${(Number(m.costMicros)/1e6).toFixed(0)} | clicks ${m.clicks} | conv ${Number(m.conversions).toFixed(1)} | IS ${(Number(m.searchImpressionShare||0)*100).toFixed(0)}% | LOST-to-BUDGET ${(Number(m.searchBudgetLostImpressionShare||0)*100).toFixed(0)}% | lost-to-rank ${(Number(m.searchRankLostImpressionShare||0)*100).toFixed(0)}%`)
}

// --- 2. Keyword performance 90d, aggregated by city ---
const kws = await gaql(`SELECT ad_group_criterion.keyword.text, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE segments.date DURING LAST_90_DAYS AND campaign.status != 'REMOVED' AND metrics.impressions > 0`)
const CITY_RE = /\b(seattle|tacoma|kent|bellevue|kirkland|redmond|renton|tukwila|woodinville|shoreline|maple valley|burien|issaquah|enumclaw|puyallup|buckley|covington|fife|federal way|sammamish|south hill|kenmore|des moines|bothell|auburn|lakewood|olympia|everett|bremerton|gig harbor|mercer island|seatac|sumner|bonney lake|algona)\b/
const byCity = {}
let nonCity = { impr: 0, clk: 0, cost: 0, conv: 0 }
for (const k of kws) {
  const t = (k.adGroupCriterion?.keyword?.text || '').toLowerCase()
  const m = k.metrics
  const rec = { impr: Number(m.impressions), clk: Number(m.clicks), cost: Number(m.costMicros) / 1e6, conv: Number(m.conversions) }
  const cm = t.match(CITY_RE)
  if (cm) { const c = cm[1]; byCity[c] = byCity[c] || { impr: 0, clk: 0, cost: 0, conv: 0 }; for (const f of ['impr','clk','cost','conv']) byCity[c][f] += rec[f] }
  else { for (const f of ['impr','clk','cost','conv']) nonCity[f] += rec[f] }
}
const rows = Object.entries(byCity).sort((a, b) => b[1].impr - a[1].impr)
console.log('\n=== CITY DEMAND (account keyword_view, last 90d, by city term) ===')
console.log('city'.padEnd(16), 'impr'.padStart(6), 'clk'.padStart(5), 'cost'.padStart(8), 'conv'.padStart(5))
for (const [c, v] of rows) console.log(c.padEnd(16), String(v.impr).padStart(6), String(v.clk).padStart(5), ('$'+v.cost.toFixed(0)).padStart(8), v.conv.toFixed(1).padStart(5))
console.log('NON-CITY (broad/junk)'.padEnd(16), String(nonCity.impr).padStart(6), String(nonCity.clk).padStart(5), ('$'+nonCity.cost.toFixed(0)).padStart(8), nonCity.conv.toFixed(1).padStart(5))
const cityCost = rows.reduce((s, [,v]) => s + v.cost, 0)
console.log(`\nCity-term spend: $${cityCost.toFixed(0)} | Broad/non-city spend: $${nonCity.cost.toFixed(0)} (${(nonCity.cost/(cityCost+nonCity.cost)*100).toFixed(0)}% of total)`)
