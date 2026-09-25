// Phase 6 — Step 1: build 3 NEW city ad groups + RSAs (Bothell, Woodinville, Des Moines).
// ADDITIVE ONLY. No keywords (ad groups stay inert until Step 2). No budget touched. No deletes/pauses.
// Plan: projects/briefs/got-moles-paid-search/2026-05-24_phase6-campaign-restructure-plan.md
import fs from 'node:fs'; import path from 'node:path'
const env = {}; for (const l of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v }
const V = 'v23', CUST = '1665761172', MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, CAMP = '23815936218'
const at = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })).json()).access_token
async function call(endpoint, ops) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${endpoint}:mutate`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': MCC, 'Content-Type': 'application/json' }, body: JSON.stringify({ operations: ops }) })
  const j = await r.json(); if (!r.ok) { console.error(`${endpoint} FAIL:`, JSON.stringify(j, null, 2)); process.exit(1) }
  return j
}
// LIVE, phone-free shared headlines (H2-H14) — matches the approved live city RSAs (NO phone in text).
const SHARED_H = ['No Catch, No Charge', 'Same-Day Call-Back', 'Tunnels in Your Yard?', 'Speak with Spencer', '219+ 5-Star Reviews', 'Safe for Pets & Kids', 'Year-Round Protection', 'Mole Damage? Call Now', 'Veteran-Owned Local', '$150 Deposit, $450 Max', 'Year-Round $100/Mo', "Spencer's 15+ Years", 'No Poisons, No Chemicals']
const D1 = 'Got Moles: $150 deposit, 4-5 week trapping. No moles caught? You pay nothing more.'
const D2 = '$150 deposit. If we catch moles in 4-5 weeks, total $450. If not, no extra charge.'
const D4 = 'Year-round protection $100/month. Unlimited visits. No extra charges.'

const CITIES = [
  { name: 'Bothell', path2: 'Bothell', cpc: 14.0, lp: 'https://got-moles.com/lp/bothell/' },
  { name: 'Woodinville', path2: 'Woodinville', cpc: 14.0, lp: 'https://got-moles.com/lp/woodinville/' },
  { name: 'Des Moines', path2: 'Des-Moines', cpc: 14.0, lp: 'https://got-moles.com/lp/des-moines/' },
]

console.log('=== Phase 6 Step 1: creating 3 ad groups (ENABLED, no keywords = inert) ===')
const agJ = await call('adGroups', CITIES.map(c => ({ create: { campaign: `customers/${CUST}/campaigns/${CAMP}`, name: c.name, status: 'ENABLED', type: 'SEARCH_STANDARD', cpcBidMicros: String(Math.round(c.cpc * 1e6)) } })))
const created = {}
agJ.results.forEach((r, i) => { created[CITIES[i].name] = r.resourceName; console.log(`  ${CITIES[i].name} -> ${r.resourceName.split('/').pop()}`) })

console.log('\n=== Step 1: creating 3 RSAs -> /lp/{city}/ (phone-free) ===')
const rsaJ = await call('adGroupAds', CITIES.map(c => {
  const D3 = `Mole tunnels in your yard? Peak season in ${c.name}. Call Got Moles today.`
  const headlines = [{ text: `Mole Removal ${c.name}`, pinnedField: 'HEADLINE_1' }, ...SHARED_H.map(t => ({ text: t })), { text: `Mole Control ${c.name}` }]
  return { create: { adGroup: created[c.name], status: 'ENABLED', ad: { responsiveSearchAd: { headlines, descriptions: [{ text: D1 }, { text: D2 }, { text: D3 }, { text: D4 }], path1: 'Mole-Removal', path2: c.path2 }, finalUrls: [c.lp] } } }
}))
rsaJ.results.forEach((r, i) => console.log(`  ${CITIES[i].name} RSA -> ${r.resourceName.split('/').pop()}`))
console.log('\nStep 1 complete. Ad groups have NO keywords yet → they cannot serve. Budget untouched.')
