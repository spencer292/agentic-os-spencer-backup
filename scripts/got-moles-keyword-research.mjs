#!/usr/bin/env node
// Phase 3 keyword research: pull Keyword Planner data via Google Ads API
// for Got Moles paid-search seed queries. Geo-targets Washington state.
// Output: keyword ideas with avg monthly searches + CPC range + competition.
// Usage: node scripts/got-moles-keyword-research.mjs

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

const CID = '1665761172' // Got Moles
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

// Geo target constants:
//   2840 = United States
//   21178 = Washington (state)
const GEO_TARGETS = ['geoTargetConstants/21178']

// Seed queries — derived from GSC commercial-intent buried queries + standard service-business commercial themes
const SEEDS = [
  // Core commercial
  'mole removal',
  'mole exterminator',
  'mole control',
  'mole trapping',
  'professional mole removal',
  'professional mole control',
  // Action / problem-aware
  'get rid of moles',
  'how to get rid of moles',
  'kill moles',
  'mole damage',
  'moles in yard',
  'moles in lawn',
  'stop moles',
  // Pricing intent
  'mole removal cost',
  'mole removal price',
  'mole exterminator cost',
  // Near-me / geo
  'mole exterminator near me',
  'mole control near me',
  'mole removal near me',
  'mole catchers near me',
]

console.log(`Minting access token...`)
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
console.log('  OK')

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}

console.log(`\nGenerating keyword ideas for ${SEEDS.length} seeds, geo=WA state...`)
const url = `https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordIdeas`
const body = {
  language: 'languageConstants/1000', // English
  geoTargetConstants: GEO_TARGETS,
  keywordPlanNetwork: 'GOOGLE_SEARCH',
  includeAdultKeywords: false,
  keywordSeed: { keywords: SEEDS },
  pageSize: 1000,
}

const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
const data = await res.json()
if (!res.ok) {
  console.error('FAIL:', JSON.stringify(data, null, 2))
  process.exit(1)
}

console.log(`  Got ${data.results?.length || 0} keyword ideas`)

// Normalize results
const ideas = (data.results || []).map(r => {
  const m = r.keywordIdeaMetrics || {}
  return {
    keyword: r.text,
    avgMonthlySearches: m.avgMonthlySearches ? Number(m.avgMonthlySearches) : 0,
    competition: m.competition || 'UNSPECIFIED',
    competitionIndex: m.competitionIndex ? Number(m.competitionIndex) : null,
    lowTopBidMicros: m.lowTopOfPageBidMicros ? Number(m.lowTopOfPageBidMicros) : null,
    highTopBidMicros: m.highTopOfPageBidMicros ? Number(m.highTopOfPageBidMicros) : null,
  }
}).map(k => ({
  ...k,
  lowTopBidUSD: k.lowTopBidMicros ? +(k.lowTopBidMicros / 1_000_000).toFixed(2) : null,
  highTopBidUSD: k.highTopBidMicros ? +(k.highTopBidMicros / 1_000_000).toFixed(2) : null,
}))

// Sort by avg monthly searches desc
ideas.sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches)

const outPath = path.resolve(process.cwd(), 'projects/briefs/got-moles-paid-search/keyword-ideas-raw.json')
fs.writeFileSync(outPath, JSON.stringify(ideas, null, 2))
console.log(`\nRaw data saved: ${outPath}`)

// Print top 50 to console for quick scan
console.log(`\n--- TOP 50 BY VOLUME ---\n`)
console.log('searches/mo  comp   $low  $high  keyword')
console.log('-----------  -----  ----  -----  ' + '-'.repeat(40))
for (const k of ideas.slice(0, 50)) {
  const searches = String(k.avgMonthlySearches).padStart(11)
  const comp = (k.competition || '').padEnd(5)
  const low = String(k.lowTopBidUSD || '-').padStart(4)
  const high = String(k.highTopBidUSD || '-').padStart(5)
  console.log(`${searches}  ${comp}  ${low}  ${high}  ${k.keyword}`)
}

console.log(`\nTotal ideas: ${ideas.length}`)
console.log(`With volume >= 10/mo: ${ideas.filter(k => k.avgMonthlySearches >= 10).length}`)
console.log(`With volume >= 50/mo: ${ideas.filter(k => k.avgMonthlySearches >= 50).length}`)
console.log(`With volume >= 100/mo: ${ideas.filter(k => k.avgMonthlySearches >= 100).length}`)
