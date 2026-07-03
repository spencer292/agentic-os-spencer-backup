#!/usr/bin/env node
// Qualify deployed (and planned) keywords against Keyword Planner historical data
// Different from generateKeywordIdeas — this returns metrics for SPECIFIC keywords, no expansion

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

const KEYWORD_GROUPS = {
  'BRANDED (deployed in active campaign)': [
    'got moles',
    'got moles spencer',
    'got moles tacoma',
    'got moles seattle',
    'got moles olympia',
    'got moles wa',
    'got moles washington',
    'got moles reviews',
    'got moles website',
    'got moles phone',
    'got moles spencer andrews',
  ],
  'T1 BUYER-INTENT (planned)': [
    'mole removal',
    'mole exterminator',
    'mole control',
    'mole removal near me',
    'mole exterminator near me',
    'pest control for moles',
    'exterminator for moles',
    'mole removal cost',
    'professional mole removal',
    'mole catcher',
    'mole trapper',
  ],
  'T2 PROBLEM-AWARE (planned for Stream 2)': [
    'moles in yard',
    'moles in lawn',
    'mole damage',
    'moles destroying lawn',
    'mole hole',
    'mole mound',
    'mole tunnel',
    'how to get rid of moles in your yard',
    'how to get rid of moles in lawn',
  ],
  'T3 SOLUTION-RESEARCH (planned for Stream 2)': [
    'how to get rid of moles',
    'kill moles',
    'eliminate moles',
    'exterminate moles',
    'best way to get rid of moles',
  ],
}

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

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}

async function getMetrics(keywords) {
  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordHistoricalMetrics`, {
    method: 'POST', headers,
    body: JSON.stringify({
      keywords,
      language: 'languageConstants/1000',
      geoTargetConstants: ['geoTargetConstants/21178'],
      keywordPlanNetwork: 'GOOGLE_SEARCH',
      historicalMetricsOptions: {
        yearMonthRange: {
          start: { year: 2025, month: 'MAY' },
          end: { year: 2026, month: 'APRIL' },
        },
        includeAverageCpc: true,
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('FAIL:', JSON.stringify(data, null, 2))
    return []
  }
  return data.results || []
}

const allResults = {}

for (const [groupName, keywords] of Object.entries(KEYWORD_GROUPS)) {
  console.log(`\n=== ${groupName} ===\n`)
  const results = await getMetrics(keywords)
  console.log('searches/yr  searches/mo (peak/off)  comp     CPC range          $avgCpc  keyword')
  console.log('-'.repeat(110))

  const enriched = []
  for (const r of results) {
    const m = r.keywordMetrics || {}
    const monthly = (m.monthlySearchVolumes || []).map(mv => Number(mv.monthlySearches || 0))
    const peak = monthly.length ? monthly.reduce((s, v) => s + v, 0) / monthly.length : 0
    // peak vs off split (Jun-Sep vs other)
    const peakMonths = (m.monthlySearchVolumes || []).filter(mv => {
      const mi = { JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12 }[mv.month] || 0
      return mi >= 6 && mi <= 9
    })
    const offMonths = (m.monthlySearchVolumes || []).filter(mv => {
      const mi = { JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12 }[mv.month] || 0
      return !(mi >= 6 && mi <= 9)
    })
    const peakAvg = peakMonths.length ? peakMonths.reduce((s, mv) => s + Number(mv.monthlySearches || 0), 0) / peakMonths.length : 0
    const offAvg = offMonths.length ? offMonths.reduce((s, mv) => s + Number(mv.monthlySearches || 0), 0) / offMonths.length : 0

    enriched.push({
      keyword: r.text,
      avgMonthly: Number(m.avgMonthlySearches || 0),
      peakAvg: Math.round(peakAvg),
      offAvg: Math.round(offAvg),
      competition: m.competition || 'UNSPECIFIED',
      lowCpc: m.lowTopOfPageBidMicros ? +(Number(m.lowTopOfPageBidMicros) / 1_000_000).toFixed(2) : 0,
      highCpc: m.highTopOfPageBidMicros ? +(Number(m.highTopOfPageBidMicros) / 1_000_000).toFixed(2) : 0,
      avgCpc: m.averageCpcMicros ? +(Number(m.averageCpcMicros) / 1_000_000).toFixed(2) : 0,
    })
  }

  enriched.sort((a, b) => b.avgMonthly - a.avgMonthly)

  for (const k of enriched) {
    const yr = (k.avgMonthly * 12).toLocaleString().padStart(11)
    const mo = `${k.peakAvg}/${k.offAvg}`.padStart(11)
    const comp = (k.competition || '').padEnd(6)
    const cpcR = `$${k.lowCpc}-$${k.highCpc}`.padEnd(16)
    const avg = `$${k.avgCpc}`.padStart(8)
    console.log(`  ${yr}  ${mo}              ${comp}  ${cpcR}  ${avg}  ${k.keyword}`)
  }

  allResults[groupName] = enriched
}

const outPath = 'projects/briefs/got-moles-paid-search/keyword-qualification.json'
fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2))
console.log(`\nSaved: ${outPath}`)
