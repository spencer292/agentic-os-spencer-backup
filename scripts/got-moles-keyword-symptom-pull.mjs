#!/usr/bin/env node
// Symptom + problem-aware keyword pull (B2C deep dive)
// Targets users who haven't named "mole" yet but describe the symptoms

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

const SEEDS = [
  // Symptom-driven (no animal named)
  'tunnels in my lawn',
  'bumps in my yard',
  'mounds of dirt in my yard',
  'small holes in lawn',
  'something digging in my yard',
  'animal tunneling in lawn',
  // Problem-aware mole-named
  'moles destroying my lawn',
  'moles tearing up yard',
  'moles ruining lawn',
  'moles wrecking lawn',
  'mole damage repair',
  'mole infestation',
  // Solution-permanence
  'permanent mole removal',
  'stop moles permanently',
  'mole removal once and for all',
  'moles keep coming back',
  // Adjacent / category
  'lawn pest control',
  'yard pest service',
  'lawn damage animal',
  'underground pest control',
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
    geoTargetConstants: ['geoTargetConstants/21178'],
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
ideas.sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches)

console.log(`Total: ${ideas.length}\n`)
console.log('--- TOP 60 BY VOLUME ---\n')
console.log('searches/mo  comp     CPC range          keyword')
console.log('-'.repeat(90))
for (const k of ideas.slice(0, 60)) {
  const v = String(k.avgMonthlySearches).padStart(11)
  const c = (k.competition || '').padEnd(6)
  const cpc = `$${(k.lowTopBidUSD || 0).toFixed(2)}-$${(k.highTopBidUSD || 0).toFixed(2)}`.padEnd(16)
  console.log(`${v}  ${c}  ${cpc}  ${k.keyword}`)
}

const outPath = 'projects/briefs/got-moles-paid-search/keyword-ideas-symptom.json'
fs.writeFileSync(outPath, JSON.stringify(ideas, null, 2))
console.log(`\nSaved: ${outPath}`)
console.log(`\nWith volume >= 10/mo: ${ideas.filter(k => k.avgMonthlySearches >= 10).length}`)
console.log(`With volume >= 50/mo: ${ideas.filter(k => k.avgMonthlySearches >= 50).length}`)
console.log(`With volume >= 100/mo: ${ideas.filter(k => k.avgMonthlySearches >= 100).length}`)
