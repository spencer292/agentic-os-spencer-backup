#!/usr/bin/env node
// Reclassify the full keyword universe into 4 funnel tiers
// Every query where the user could become a customer is a target — at the right bid

import fs from 'node:fs'
const ideas = JSON.parse(fs.readFileSync('projects/briefs/got-moles-paid-search/keyword-ideas-raw.json', 'utf8'))

// HARD NEGATIVES (never bid):
//   - Wrong species standalone (vole, gopher only, no "mole" reference)
//   - Cosmetic/skin moles
//   - Legal/regulatory research (I-713, WDFW)
//   - Curiosity-only with no commercial path (e.g. "how many eyes does a mole have")
//   - DIY-purchase intent ("best mole trap to buy", "amazon mole trap" — they're shopping equipment, not service)
const HARD_NEG = [
  /\b(vole|voles)\b(?!.*\bmole)/i, // vole queries that don't also mention mole
  /\b(gopher|gophers)\b(?!.*\bmole)/i,
  /\b(skin|beauty|face|cosmetic|skin tag|freckle|dermatologist|doctor|medical)\b/i,
  /\b(i-?713|initiative 713|wdfw|wildlife law|trap.*law|legal.*trap)\b/i,
  /\b(how many eyes|how many babies|how long.*live|life span|gestation|pregnant)\b/i,
  /\b(amazon|ebay|walmart|home depot|lowes|best.*trap|buy.*trap|where to buy)\b/i,
  /\btalpirid\b/i,
  /\bbromethalin\b/i,
]

// TIER 1 — Bottom of funnel (highest bid, direct conversion)
//   Buyer-ready queries. Already looking for a service.
const TIER1 = [
  /\b(mole removal|mole exterminator|mole control|pest control for moles|exterminator for moles)\b/i,
  /\b(near me|near you|local)\b/i,
  /\b(cost|price|pricing|quote|estimate|fee|how much)\b/i,
  /\b(emergency|same day|immediate|urgent|asap)\b/i,
  /\b(monthly|year[- ]?round|annual|maintenance|prevention|preventive)\b/i,
  /\b(specialist|specialists|company|companies|service|services|professional|pro|expert)\b/i,
  /\b(catcher|trapper|catchers|trappers)\b/i,
  /\b(moles in yard removal|professional mole)\b/i,
]

// TIER 2 — Problem-aware (mid bid, dual-purpose: form fill OR quiz)
//   User has a mole problem, hasn't decided on solution
const TIER2 = [
  /\bmoles in (my |the |your )?(yard|lawn|garden|grass|backyard|property)\b/i,
  /\bmoles? (destroy|destroying|tearing|wrecking|ruining|damaging|killing).*\b(yard|lawn|garden|grass)\b/i,
  /\bmole damage\b/i,
  /\bmole infestation\b/i,
  /\bmole problem\b/i,
  /\bmole hole(s)?\b/i,
  /\bmole mound(s)?\b/i,
  /\bmole tunnel(s)?\b/i,
  /\bmoles? keep coming back\b/i,
  /\bpermanent.*mole|mole.*permanent\b/i,
  /\bstop moles\b/i,
  /\bsigns of moles\b/i,
  /\bdo i have moles\b/i,
  /\bidentify mole\b/i,
  /\bactive mole tunnels?\b/i,
]

// TIER 3 — Solution research (low bid, quiz + educational LP)
//   How-to queries — they're trying to solve it themselves
const TIER3 = [
  /^how (to|do|can|does) .*(get rid|remove|kill|stop|exterminate).*\bmole/i,
  /^how (to|do|can|does) .*\bmole.*(get rid|remove|kill|stop|exterminate)\b/i,
  /\bbest way.*\bmole/i,
  /\bnaturally.*\bmole|mole.*naturally\b/i,
  /\bremove moles\b/i,
  /\b(diy|home remedy|home).*\bmole/i,
  /\bvinegar.*\bmole|mole.*vinegar/i,
  /\bcastor.*\bmole|mole.*castor/i,
  /\b(repell|repel).*\bmole|mole.*(repell|repel)/i,
  /\bsonic.*\bmole|mole.*sonic/i,
  /\bdeter.*\bmole|mole.*deter/i,
  /\bget rid of (moles|mole)\b/i,
  /\bkill (moles|mole)\b/i,
]

// TIER 4 — Awareness / curiosity (lowest bid, pure brand-building + quiz)
//   They're learning about moles. May or may not have a problem yet.
const TIER4 = [
  /^(do|are|can|will|does)\s+(moles?|the mole)\s+\w+/i, // "do moles bite", "are moles blind"
  /^what (do|are|kind|attracts|eats?)\s+.*\bmole/i,
  /\bvs\s+(mole|gopher|vole)|mole\s+vs\b/i,
  /\bdifference between\s+(moles?|voles?|gophers?)/i,
  /\bmole\s+(diet|food|behavior|habit|species|eyes|teeth|claws|sleep|active|nocturnal|hibernate|swim)\b/i,
  /\b(what is|what's)\s+a?\s*mole\b/i,
  /\bmole\s+(facts?|information|guide)\b/i,
]

const BRANDED = [/\bgot moles\b/i]

function classify(kw) {
  const text = kw.keyword.toLowerCase()
  if (HARD_NEG.some(r => r.test(text))) return 'NEG'
  if (BRANDED.some(r => r.test(text))) return 'BRAND'
  if (TIER1.some(r => r.test(text))) return 'T1'
  if (TIER2.some(r => r.test(text))) return 'T2'
  if (TIER3.some(r => r.test(text))) return 'T3'
  if (TIER4.some(r => r.test(text))) return 'T4'
  return 'UNCLASSIFIED'
}

const buckets = { BRAND: [], T1: [], T2: [], T3: [], T4: [], NEG: [], UNCLASSIFIED: [] }
for (const k of ideas) buckets[classify(k)].push(k)
for (const b in buckets) buckets[b].sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches)

const totals = {}
for (const b in buckets) totals[b] = buckets[b].reduce((s, k) => s + k.avgMonthlySearches, 0)

console.log('=== KEYWORD UNIVERSE — 4-Tier Funnel Classification ===\n')
console.log('Tier      | Count | Total vol/mo | Bid posture          | Conversion')
console.log('----------|-------|--------------|----------------------|-----------')
console.log(`BRAND     | ${String(buckets.BRAND.length).padStart(5)} | ${String(totals.BRAND).padStart(12)} | exact match, $5 cap  | direct call/form`)
console.log(`T1 buyer  | ${String(buckets.T1.length).padStart(5)} | ${String(totals.T1).padStart(12)} | $10-15, top of page  | direct call/form`)
console.log(`T2 prob   | ${String(buckets.T2.length).padStart(5)} | ${String(totals.T2).padStart(12)} | $3-5, page 1         | call/form OR quiz`)
console.log(`T3 solu   | ${String(buckets.T3.length).padStart(5)} | ${String(totals.T3).padStart(12)} | $1-2, broad page 1+  | quiz/email capture`)
console.log(`T4 aware  | ${String(buckets.T4.length).padStart(5)} | ${String(totals.T4).padStart(12)} | $0.50-1, presence    | quiz + remarketing tag`)
console.log(`NEG       | ${String(buckets.NEG.length).padStart(5)} | ${String(totals.NEG).padStart(12)} | n/a — never bid      | n/a`)
console.log(`Unclass   | ${String(buckets.UNCLASSIFIED.length).padStart(5)} | ${String(totals.UNCLASSIFIED).padStart(12)} | review manually      | TBD`)
console.log('-'.repeat(70))
console.log(`TOTAL     | ${String(ideas.length).padStart(5)} | ${String(ideas.reduce((s,k)=>s+k.avgMonthlySearches,0)).padStart(12)} |`)

// Show top of each tier
for (const tier of ['T1', 'T2', 'T3', 'T4']) {
  console.log(`\n--- ${tier} top 15 ---`)
  for (const k of buckets[tier].slice(0, 15)) {
    const v = String(k.avgMonthlySearches).padStart(5)
    const cpc = `$${(k.lowTopBidUSD || 0).toFixed(2)}-$${(k.highTopBidUSD || 0).toFixed(2)}`.padEnd(14)
    console.log(`  ${v}  ${cpc}  ${k.keyword}`)
  }
}

console.log(`\n--- Unclassified sample (top 30 — to manually review) ---`)
for (const k of buckets.UNCLASSIFIED.slice(0, 30)) {
  console.log(`  ${String(k.avgMonthlySearches).padStart(5)}  ${k.keyword}`)
}

const outPath = 'projects/briefs/got-moles-paid-search/keyword-funnel-tiers.json'
fs.writeFileSync(outPath, JSON.stringify({ totals, buckets }, null, 2))
console.log(`\nSaved: ${outPath}`)
