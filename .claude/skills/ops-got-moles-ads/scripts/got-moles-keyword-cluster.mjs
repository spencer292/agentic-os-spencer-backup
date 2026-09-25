#!/usr/bin/env node
// Phase 3 keyword clustering: classify the 1000 ideas into commercial-intent
// (target for paid) vs informational (negative cluster) vs branded.
// Then cluster commercial into ad groups for LP mapping.

import fs from 'node:fs'
import path from 'node:path'

const ideas = JSON.parse(fs.readFileSync('projects/briefs/got-moles-paid-search/keyword-ideas-raw.json', 'utf8'))

// Intent classification rules
const INFO_PATTERNS = [
  /^how (to|do|can|does|much)/i,
  /^what (is|are|do|does|kind|attracts|eats|happens)/i,
  /^why (do|does|are)/i,
  /^when (do|does|are)/i,
  /^where (do|does|are)/i,
  /^do (moles|voles|mole|vole)/i,
  /^are (moles|voles|mole|vole)/i,
  /^can (moles|voles|mole|vole|you|i)/i,
  /^will (moles|voles)/i,
  /\b(eat|food|diet|babies|species|nocturnal|venomous|poisonous|blind|carry|rabies|hibernate|swim|dig|deep|tunnel|hole|mound|burrow|live|sleep|see|eyes|bite|teeth|carry|disease|life|long|hibernate|active|gestation|pregnant|breed)\b/i,
  /\b(vole vs|vs mole|gopher vs|vs gopher|vs vole|difference between)\b/i,
  /\b(diy|home remedy|natural|repellent|repeller|sonic|vinegar|castor|grub|poison|bait|traps?|trap.*home|trap.*best|best.*trap|amazon)\b/i,
  /\bvinegar\b/i,
  /\bcastor\b/i,
  /\bsonic\b/i,
  /\bgrub\b/i,
  /\btalpirid\b/i,
  /\bbromethalin\b/i,
  /\b(rid|kill|stop)\b.*\b(home|diy|yourself|own|natural)\b/i,
]

const COMMERCIAL_PATTERNS = [
  /\b(exterminator|extermination|exterminating)\b/i,
  /\b(pest control|pest service)\b/i,
  /\b(removal|remove|removing)\b/i,
  /\b(control|controlling)\b.*\b(service|company|professional|near|cost)\b/i,
  /\b(near me|near you|local)\b/i,
  /\b(cost|price|pricing|quote|estimate|fee)\b/i,
  /\b(service|services|company|companies|professional|pro|expert)\b/i,
  /\b(emergency|same day|immediate|fast|urgent)\b/i,
  /\b(commercial|hoa|business|property management)\b/i,
  /\b(monthly|year[- ]?round|protection|maintenance|prevention|preventive)\b/i,
  /\b(specialist|specialists|specializing)\b/i,
]

const BRANDED_PATTERNS = [
  /\bgot moles\b/i,
  /\bspencer\b.*\bmole/i,
]

const GEO_PATTERNS = [
  /\b(seattle|tacoma|olympia|bellevue|kirkland|redmond|sammamish|renton|kent|auburn|federal way|bothell|lakewood|puyallup|everett|marysville|lynnwood|bremerton|spokane|vancouver|washington|wa|king county|pierce county|snohomish|thurston|kitsap)\b/i,
]

function classify(kw) {
  const text = kw.keyword.toLowerCase()
  if (BRANDED_PATTERNS.some(r => r.test(text))) return 'branded'
  if (GEO_PATTERNS.some(r => r.test(text))) return 'geo'
  if (INFO_PATTERNS.some(r => r.test(text))) return 'info'
  if (COMMERCIAL_PATTERNS.some(r => r.test(text))) return 'commercial'
  return 'unclear'
}

// Cluster commercial ideas by theme
function clusterCommercial(kw) {
  const t = kw.keyword.toLowerCase()
  if (/\b(cost|price|pricing|quote|estimate|fee|how much)\b/.test(t)) return 'A_pricing'
  if (/\b(near me|near you|local)\b/.test(t)) return 'B_near_me'
  if (/\b(emergency|same day|immediate|fast|urgent|asap)\b/.test(t)) return 'C_emergency'
  if (/\b(commercial|hoa|business|golf|school|property management|farm)\b/.test(t)) return 'D_commercial'
  if (/\b(monthly|year[- ]?round|protection|maintenance|prevention|preventive|annual)\b/.test(t)) return 'E_recurring'
  if (/\b(exterminator|extermination|exterminating)\b/.test(t)) return 'F_exterminator'
  if (/\b(removal|remove|removing)\b/.test(t)) return 'G_removal'
  if (/\b(control|controlling)\b/.test(t)) return 'H_control'
  if (/\b(pest control|pest service)\b/.test(t)) return 'I_pest_control'
  if (/\b(trapping|trapper)\b/.test(t)) return 'J_trapping'
  if (/\b(specialist|specialists|specializing|professional|pro|expert|company|companies|service|services)\b/.test(t)) return 'K_pro_service'
  return 'Z_other_commercial'
}

// Categorize all
const buckets = { branded: [], geo: [], commercial: [], info: [], unclear: [] }
for (const k of ideas) {
  buckets[classify(k)].push(k)
}

// Cluster commercial
const commercialClusters = {}
for (const k of buckets.commercial) {
  const c = clusterCommercial(k)
  if (!commercialClusters[c]) commercialClusters[c] = []
  commercialClusters[c].push(k)
}

// Sort each cluster by volume desc
for (const c in commercialClusters) {
  commercialClusters[c].sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches)
}

// Sort other buckets
for (const b in buckets) buckets[b].sort((a, b2) => b2.avgMonthlySearches - a.avgMonthlySearches)

// Stats summary
console.log('=== KEYWORD UNIVERSE — Phase 3 Classification ===\n')
console.log(`Total ideas pulled: ${ideas.length}`)
console.log(`  Commercial: ${buckets.commercial.length} (target for paid)`)
console.log(`  Geo-modified: ${buckets.geo.length} (need separate clustering)`)
console.log(`  Branded: ${buckets.branded.length}`)
console.log(`  Informational: ${buckets.info.length} (NEGATIVES)`)
console.log(`  Unclear: ${buckets.unclear.length} (review manually)\n`)

console.log('=== Commercial clusters (ad-group seeds) ===\n')
for (const [name, kws] of Object.entries(commercialClusters).sort()) {
  const totalVol = kws.reduce((s, k) => s + k.avgMonthlySearches, 0)
  const avgLow = kws.filter(k => k.lowTopBidUSD).reduce((s, k) => s + k.lowTopBidUSD, 0) / kws.filter(k => k.lowTopBidUSD).length
  const avgHigh = kws.filter(k => k.highTopBidUSD).reduce((s, k) => s + k.highTopBidUSD, 0) / kws.filter(k => k.highTopBidUSD).length
  console.log(`${name} — ${kws.length} kws, total ${totalVol}/mo, CPC range $${(avgLow || 0).toFixed(2)}–$${(avgHigh || 0).toFixed(2)}`)
  for (const k of kws.slice(0, 8)) {
    console.log(`  ${String(k.avgMonthlySearches).padStart(4)}/mo  ${(k.competition || '').padEnd(6)}  $${(k.lowTopBidUSD || 0).toFixed(2)}-$${(k.highTopBidUSD || 0).toFixed(2)}  ${k.keyword}`)
  }
  if (kws.length > 8) console.log(`  ... +${kws.length - 8} more`)
  console.log('')
}

console.log('=== Geo cluster (top 30 by volume) ===\n')
for (const k of buckets.geo.slice(0, 30)) {
  console.log(`  ${String(k.avgMonthlySearches).padStart(4)}/mo  $${(k.lowTopBidUSD || 0).toFixed(2)}-$${(k.highTopBidUSD || 0).toFixed(2)}  ${k.keyword}`)
}

console.log('\n=== Top 30 informational queries (NEGATIVES priority) ===\n')
for (const k of buckets.info.slice(0, 30)) {
  console.log(`  ${String(k.avgMonthlySearches).padStart(4)}/mo  ${k.keyword}`)
}

console.log('\n=== Branded queries ===\n')
for (const k of buckets.branded.slice(0, 10)) {
  console.log(`  ${String(k.avgMonthlySearches).padStart(4)}/mo  ${k.keyword}`)
}

// Save full clustered output
const out = {
  meta: {
    pulled: new Date().toISOString(),
    geoTarget: 'Washington state',
    seedCount: 20,
    totalIdeas: ideas.length,
  },
  buckets: {
    commercial: { count: buckets.commercial.length, items: buckets.commercial },
    geo: { count: buckets.geo.length, items: buckets.geo },
    branded: { count: buckets.branded.length, items: buckets.branded },
    info: { count: buckets.info.length, items: buckets.info },
    unclear: { count: buckets.unclear.length, items: buckets.unclear },
  },
  commercialClusters,
}
const outPath = 'projects/briefs/got-moles-paid-search/keyword-ideas-clustered.json'
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`\nClustered data saved: ${outPath}`)
