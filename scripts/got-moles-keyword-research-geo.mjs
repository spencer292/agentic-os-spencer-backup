#!/usr/bin/env node
// Phase 3 keyword research — geo-modified pass.
// Keyword Planner needs explicit geo seeds to surface "[term] [city]" patterns.
// Usage: node scripts/got-moles-keyword-research-geo.mjs

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

const CID = '1665761172'
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

// Geo-modified seeds — top 7 WA metros + the most commercial bases
// 20 seed limit, so prioritising
const SEEDS = [
  'mole removal seattle',
  'mole exterminator seattle',
  'mole control seattle',
  'mole removal tacoma',
  'mole exterminator tacoma',
  'mole control tacoma',
  'mole removal olympia',
  'mole exterminator olympia',
  'mole control olympia',
  'mole removal bellevue',
  'mole exterminator bellevue',
  'mole removal everett',
  'mole control everett',
  'mole removal puyallup',
  'mole removal renton',
  'mole removal kent',
  'mole removal redmond',
  'mole removal bremerton',
  'mole removal washington',
  'mole exterminator washington',
]

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

const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordIdeas`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': MCC,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    language: 'languageConstants/1000',
    geoTargetConstants: ['geoTargetConstants/21178'], // WA state
    keywordPlanNetwork: 'GOOGLE_SEARCH',
    includeAdultKeywords: false,
    keywordSeed: { keywords: SEEDS },
    pageSize: 1000,
  }),
})
const data = await res.json()
if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2)); process.exit(1) }

const ideas = (data.results || []).map(r => {
  const m = r.keywordIdeaMetrics || {}
  return {
    keyword: r.text,
    avgMonthlySearches: m.avgMonthlySearches ? Number(m.avgMonthlySearches) : 0,
    competition: m.competition || 'UNSPECIFIED',
    lowTopBidUSD: m.lowTopOfPageBidMicros ? +(Number(m.lowTopOfPageBidMicros) / 1_000_000).toFixed(2) : null,
    highTopBidUSD: m.highTopOfPageBidMicros ? +(Number(m.highTopOfPageBidMicros) / 1_000_000).toFixed(2) : null,
  }
})

// Filter: must contain a city or "washington/wa"
const GEO_CITIES = ['seattle', 'tacoma', 'olympia', 'bellevue', 'kirkland', 'redmond', 'sammamish', 'renton', 'kent', 'auburn', 'federal way', 'bothell', 'lakewood', 'puyallup', 'everett', 'marysville', 'lynnwood', 'bremerton', 'spokane', 'vancouver', 'washington', ' wa', 'wa ', 'king county', 'pierce county', 'snohomish', 'thurston', 'kitsap', 'poulsbo', 'silverdale', 'bainbridge', 'edmonds', 'shoreline', 'kenmore', 'mercer island', 'issaquah', 'maple valley', 'covington', 'des moines', 'seatac', 'tukwila', 'snoqualmie', 'north bend', 'duvall', 'newcastle', 'burien', 'fife', 'milton', 'sumner', 'bonney lake', 'enumclaw', 'graham', 'spanaway', 'parkland', 'university place', 'gig harbor', 'mill creek', 'mukilteo', 'monroe', 'snohomish', 'arlington', 'stanwood', 'lake stevens', 'lacey', 'tumwater', 'yelm', 'centralia', 'eatonville']
const geoOnly = ideas.filter(k => GEO_CITIES.some(c => k.keyword.toLowerCase().includes(c)))

geoOnly.sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches)

console.log(`Total ideas: ${ideas.length}`)
console.log(`Geo-modified: ${geoOnly.length}\n`)

console.log('--- TOP 50 GEO QUERIES BY VOLUME ---\n')
console.log('searches/mo  comp     CPC range          keyword')
console.log('-'.repeat(80))
for (const k of geoOnly.slice(0, 50)) {
  const v = String(k.avgMonthlySearches).padStart(11)
  const c = (k.competition || '').padEnd(6)
  const cpc = `$${(k.lowTopBidUSD || 0).toFixed(2)}-$${(k.highTopBidUSD || 0).toFixed(2)}`.padEnd(16)
  console.log(`${v}  ${c}  ${cpc}  ${k.keyword}`)
}

const outPath = 'projects/briefs/got-moles-paid-search/keyword-ideas-geo.json'
fs.writeFileSync(outPath, JSON.stringify({ all: ideas, geoOnly }, null, 2))
console.log(`\nSaved: ${outPath}`)
