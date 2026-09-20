#!/usr/bin/env node
// Got Moles — market demand per serviceable city (Keyword Planner historical metrics).
// Answers Roy's funnel step 2: "is the keyword getting traffic / is anybody else bidding?"
// for every city we have content for (city-data.ts), independent of where we already rank.
//
// Pulls avg monthly searches + competition (index) + top-of-page bid range for
// "mole removal {city}" and "mole control {city}" across all serviceable cities.
// Read-only (Keyword Planner historical metrics; no plan is created/saved in the account).
//
// Usage: node scripts/got-moles-city-demand-planner.mjs
import fs from 'node:fs'
import path from 'node:path'

const env = {}
for (const line of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue
  let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}
const CID = '1665761172'

// --- serviceable cities (display names) from city-data.ts ---
const cityTs = fs.readFileSync(path.resolve('clients/got-moles/projects/briefs/website-rebuild-rebrand/site/src/lib/city-data.ts'), 'utf8')
const names = []
const seen = new Set()
const re = /\n  '?[a-z0-9-]+'?:\s*\{[\s\S]*?name:\s*'([^']+)'/g
let mm
while ((mm = re.exec(cityTs))) { const n = mm[1]; if (!seen.has(n)) { seen.add(n); names.push(n) } }

// build the keyword list (2 variants per city)
const kw = []
for (const n of names) { kw.push(`mole removal ${n.toLowerCase()}`); kw.push(`mole control ${n.toLowerCase()}`) }

// --- auth ---
const tk = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })
const at = (await tk.json()).access_token

// --- historical metrics (US geo, English) ---
const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordHistoricalMetrics`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, 'Content-Type': 'application/json' },
  body: JSON.stringify({ keywords: kw, geoTargetConstants: ['geoTargetConstants/2840'], language: 'languageConstants/1000', keywordPlanNetwork: 'GOOGLE_SEARCH', historicalMetricsOptions: { includeAverageCpc: true } }),
})
const j = await res.json()
if (j.error) { console.error('API error:', JSON.stringify(j.error).slice(0, 500)); process.exit(1) }

const metric = {}
for (const r of (j.results || [])) {
  const m = r.keywordMetrics || {}
  metric[(r.text || '').toLowerCase()] = {
    vol: m.avgMonthlySearches ? Number(m.avgMonthlySearches) : 0,
    comp: m.competition || '-',
    compIdx: m.competitionIndex != null ? Number(m.competitionIndex) : null,
    bidLo: m.lowTopOfPageBidMicros ? (Number(m.lowTopOfPageBidMicros) / 1e6) : null,
    bidHi: m.highTopOfPageBidMicros ? (Number(m.highTopOfPageBidMicros) / 1e6) : null,
  }
}

const rows = names.map((n) => {
  const rem = metric[`mole removal ${n.toLowerCase()}`] || { vol: 0 }
  const con = metric[`mole control ${n.toLowerCase()}`] || { vol: 0 }
  const best = rem.vol >= con.vol ? rem : con
  return { city: n, remVol: rem.vol, conVol: con.vol, maxVol: Math.max(rem.vol, con.vol), comp: best.comp, compIdx: best.compIdx, bidLo: best.bidLo, bidHi: best.bidHi }
}).sort((a, b) => b.maxVol - a.maxVol)

console.log(`Serviceable cities: ${names.length} | keywords probed: ${kw.length} | source: Keyword Planner (US, GOOGLE_SEARCH)\n`)
console.log('City'.padEnd(20), 'rmVol'.padStart(6), 'ctVol'.padStart(6), 'comp'.padStart(7), 'idx'.padStart(4), 'topBid$'.padStart(12))
for (const r of rows) {
  const bid = r.bidLo != null ? `${r.bidLo.toFixed(2)}-${(r.bidHi||0).toFixed(2)}` : '-'
  console.log(r.city.padEnd(20), String(r.remVol).padStart(6), String(r.conVol).padStart(6), String(r.comp).padStart(7), String(r.compIdx ?? '-').padStart(4), bid.padStart(12))
}
const withVol = rows.filter((r) => r.maxVol > 0)
console.log(`\nCities with ANY Planner volume (>0): ${withVol.length} / ${names.length}`)
console.log(`>= 10/mo: ${rows.filter(r => r.maxVol >= 10).length} | >= 50/mo: ${rows.filter(r => r.maxVol >= 50).length}`)
fs.writeFileSync('scripts/_got-moles-city-demand.json', JSON.stringify(rows, null, 2))
console.log('Saved scripts/_got-moles-city-demand.json')
