#!/usr/bin/env node
// Seasonal keyword pull — get monthly search volumes for the past 12 months
// Filter to peak season (June-September) to see real demand at launch time

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

// Top commercial seeds — the ones that registered volume in the broad pull
const SEEDS = [
  'mole removal',
  'mole exterminator',
  'mole control',
  'mole trapping',
  'pest control for moles',
  'exterminator for moles',
  'professional mole removal',
  'mole removal cost',
  'mole removal near me',
  'mole exterminator near me',
  'mole control near me',
  'get rid of moles',
  'how to get rid of moles',
  'moles in yard',
  'moles in lawn',
  'moles destroying lawn',
  'mole damage',
  'permanent mole removal',
  'lawn pest control',
  'lawn exterminator',
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
    pageSize: 500,
    historicalMetricsOptions: {
      yearMonthRange: {
        start: { year: 2025, month: 'MAY' },
        end:   { year: 2026, month: 'APRIL' },
      },
      includeAverageCpc: true,
    },
  }),
})
const data = await res.json()
if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2)); process.exit(1) }

const MONTH_INDEX = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
}

const ideas = (data.results || []).map(r => {
  const m = r.keywordIdeaMetrics || {}
  const monthly = (m.monthlySearchVolumes || []).map(mv => ({
    year: Number(mv.year),
    month: MONTH_INDEX[mv.month] || mv.month,
    volume: Number(mv.monthlySearches || 0),
  }))
  // Peak season: June-September of any year in the window
  const peakVolumes = monthly.filter(mv => mv.month >= 6 && mv.month <= 9).map(mv => mv.volume)
  const offVolumes = monthly.filter(mv => mv.month < 6 || mv.month > 9).map(mv => mv.volume)
  const peakAvg = peakVolumes.length ? peakVolumes.reduce((s,v) => s+v, 0) / peakVolumes.length : 0
  const offAvg = offVolumes.length ? offVolumes.reduce((s,v) => s+v, 0) / offVolumes.length : 0
  const peakRatio = offAvg > 0 ? peakAvg / offAvg : null
  return {
    keyword: r.text,
    avgMonthlySearches: m.avgMonthlySearches ? Number(m.avgMonthlySearches) : 0,
    competition: m.competition || 'UNSPECIFIED',
    competitionIndex: m.competitionIndex ? Number(m.competitionIndex) : null,
    lowTopBidUSD: m.lowTopOfPageBidMicros ? +(Number(m.lowTopOfPageBidMicros) / 1_000_000).toFixed(2) : null,
    highTopBidUSD: m.highTopOfPageBidMicros ? +(Number(m.highTopOfPageBidMicros) / 1_000_000).toFixed(2) : null,
    avgCpcUSD: m.averageCpcMicros ? +(Number(m.averageCpcMicros) / 1_000_000).toFixed(2) : null,
    monthly,
    peakAvg: Math.round(peakAvg),
    offAvg: Math.round(offAvg),
    peakRatio: peakRatio ? +peakRatio.toFixed(2) : null,
  }
})

ideas.sort((a, b) => b.peakAvg - a.peakAvg)

console.log(`Total ideas: ${ideas.length}\n`)
console.log('--- TOP 30 BY PEAK-SEASON (Jun-Sep) AVERAGE ---\n')
console.log('peak/mo  off/mo  ratio   avg/yr  $cpc    keyword')
console.log('-'.repeat(85))
for (const k of ideas.slice(0, 30)) {
  const peak = String(k.peakAvg).padStart(7)
  const off = String(k.offAvg).padStart(6)
  const ratio = (k.peakRatio ? `${k.peakRatio}x` : '-').padStart(6)
  const avg = String(k.avgMonthlySearches).padStart(6)
  const cpc = `$${(k.avgCpcUSD || 0).toFixed(2)}`.padStart(6)
  console.log(`${peak}  ${off}  ${ratio}  ${avg}  ${cpc}  ${k.keyword}`)
}

// Show monthly trend for the top 3 by peak volume
console.log('\n--- MONTHLY TRENDS (top 5 by peak volume) ---\n')
for (const k of ideas.slice(0, 5)) {
  console.log(`\n  ${k.keyword}:`)
  const sorted = [...k.monthly].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  for (const mv of sorted) {
    const bar = '█'.repeat(Math.min(40, Math.round(mv.volume / 50)))
    console.log(`    ${mv.year}-${String(mv.month).padStart(2,'0')}  ${String(mv.volume).padStart(4)}  ${bar}`)
  }
}

// Total peak vs off-peak for commercial-intent set
const COMMERCIAL_RX = /(removal|exterminator|control|professional|near me|cost|pest control)/i
const INFO_RX = /(how to|how do|how can|why|what|do moles|are moles|vs |vinegar|castor|grub|sonic|repell|diy|home|natural|skin|beauty|face)/i
const commercial = ideas.filter(k => COMMERCIAL_RX.test(k.keyword) && !INFO_RX.test(k.keyword))

const peakTotal = commercial.reduce((s, k) => s + k.peakAvg, 0)
const offTotal = commercial.reduce((s, k) => s + k.offAvg, 0)
console.log(`\n--- COMMERCIAL-INTENT TOTALS ---`)
console.log(`Peak season (Jun-Sep) avg: ${peakTotal}/mo`)
console.log(`Off-season (Oct-May) avg:  ${offTotal}/mo`)
console.log(`Peak vs off ratio: ${offTotal > 0 ? (peakTotal/offTotal).toFixed(2) : 'n/a'}x`)

const outPath = 'projects/briefs/got-moles-paid-search/keyword-ideas-seasonal.json'
fs.writeFileSync(outPath, JSON.stringify(ideas, null, 2))
console.log(`\nSaved: ${outPath}`)
