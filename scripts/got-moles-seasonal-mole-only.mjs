#!/usr/bin/env node
// Filter the seasonal pull to MOLE-only commercial queries

import fs from 'node:fs'
const ideas = JSON.parse(fs.readFileSync('projects/briefs/got-moles-paid-search/keyword-ideas-seasonal.json', 'utf8'))

// Mole queries only (must contain "mole" not as part of other word)
const MOLE_RX = /\bmole(s)?\b/i
const COMMERCIAL_RX = /(removal|exterminator|control|professional|near me|cost|pest control|catcher|trapper)/i
const INFO_RX = /(how to|how do|how can|why do|what (do|are|eat|attract|kill)|do moles|are moles|vs mole|skin|beauty|face|vinegar|castor|repell|sonic|grub|diy|home remedy|natural|kill moles)/i

const moleCommercial = ideas.filter(k => MOLE_RX.test(k.keyword) && COMMERCIAL_RX.test(k.keyword) && !INFO_RX.test(k.keyword))

moleCommercial.sort((a, b) => b.peakAvg - a.peakAvg)

console.log(`Mole-specific commercial queries: ${moleCommercial.length}\n`)
console.log('peak/mo  off/mo  ratio   avg/yr  $cpc    keyword')
console.log('-'.repeat(85))
for (const k of moleCommercial.slice(0, 40)) {
  const peak = String(k.peakAvg).padStart(7)
  const off = String(k.offAvg).padStart(6)
  const ratio = (k.peakRatio ? `${k.peakRatio}x` : '-').padStart(6)
  const avg = String(k.avgMonthlySearches).padStart(6)
  const cpc = `$${(k.avgCpcUSD || 0).toFixed(2)}`.padStart(6)
  console.log(`${peak}  ${off}  ${ratio}  ${avg}  ${cpc}  ${k.keyword}`)
}

// Monthly trends for top 5 mole-commercial
console.log('\n--- MONTHLY TRENDS (top 5 mole-commercial) ---\n')
for (const k of moleCommercial.slice(0, 5)) {
  console.log(`\n  ${k.keyword}:`)
  const sorted = [...k.monthly].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  for (const mv of sorted) {
    const bar = '█'.repeat(Math.min(40, Math.round(mv.volume / 5)))
    console.log(`    ${mv.year}-${String(mv.month).padStart(2,'0')}  ${String(mv.volume).padStart(4)}  ${bar}`)
  }
}

const peakTotal = moleCommercial.reduce((s, k) => s + k.peakAvg, 0)
const offTotal = moleCommercial.reduce((s, k) => s + k.offAvg, 0)
console.log(`\n--- MOLE-SPECIFIC COMMERCIAL TOTALS ---`)
console.log(`Peak season (Jun-Sep) avg: ${peakTotal}/mo`)
console.log(`Off-season (Oct-May) avg:  ${offTotal}/mo`)
console.log(`Peak vs off ratio: ${offTotal > 0 ? (peakTotal/offTotal).toFixed(2) : 'n/a'}x`)

// Best months specifically
const monthTotals = {}
for (const k of moleCommercial) {
  for (const mv of k.monthly) {
    const key = `${mv.year}-${String(mv.month).padStart(2,'0')}`
    monthTotals[key] = (monthTotals[key] || 0) + mv.volume
  }
}
console.log('\n--- TOTAL MOLE-COMMERCIAL VOLUME BY MONTH ---\n')
for (const [m, v] of Object.entries(monthTotals).sort()) {
  const bar = '█'.repeat(Math.min(60, Math.round(v / 30)))
  console.log(`  ${m}  ${String(v).padStart(4)}  ${bar}`)
}
