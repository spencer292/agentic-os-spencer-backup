// Phase 6 NEW CAMPAIGN — Run D: assets (sitelinks, callouts, snippet, call) + observation audiences.
// Campaign 23876158925 stays PAUSED. Clean offer messaging, valid current URLs, Posture A.
import fs from 'node:fs'; import path from 'node:path'
const env = {}; for (const l of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v }
const CUST = '1665761172', MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, CAMP = `customers/${CUST}/campaigns/23876158925`
const at = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })).json()).access_token
async function mut(ep, ops) { const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': MCC, 'Content-Type': 'application/json' }, body: JSON.stringify({ operations: ops }) }); const j = await r.json(); if (!r.ok) { console.error(`${ep} FAIL:`, JSON.stringify(j, null, 2)); process.exit(1) } return j }
async function q(query) { const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CUST}/googleAds:search`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': MCC, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }); const j = await r.json(); if (j.error) { console.log('Q ERR', JSON.stringify(j.error).slice(0,160)); return [] } return j.results || [] }

// --- sitelinks (clean, valid current URLs) ---
const SL = [
  ['How It Works','/how-it-works/','Inspect, trap, weekly checks.','Chemical-free & pet safe.'],
  ['219+ 5-Star Reviews','/reviews/','Real Western WA homeowners.','Google-verified five-star.'],
  ['Year-Round Protection','/services/total-mole-control-program/','$100/month, unlimited visits.','Total Mole Control Program.'],
  ['One-Time Removal','/services/one-time-mole-removal/','$150 to start. $450 max.','Balance only if we catch.'],
  ['About Got Moles','/about/','Veteran-owned, WA since 2017.','Nearly 5,000 yards served.'],
  ['FAQ','/faq/','Common mole questions.','Answered by Spencer.'],
]
const CALLOUTS = ['Same-Day Call-Back','219+ Five-Star Reviews','Nearly 5,000 Yards','Veteran-Owned','Chemical-Free','Safe for Pets & Kids','Since 2017','$150 to Start','Balance Only If We Catch','Mole Specialists']
const SNIPPET = { header: 'Services', values: ['One-Time Mole Removal','Year-Round Protection','Commercial Control','Property Inspection'] }

// create assets
const assetOps = []
SL.forEach(([t,u,d1,d2]) => assetOps.push({ create: { sitelinkAsset: { linkText: t, description1: d1, description2: d2 }, finalUrls: [`https://got-moles.com${u}`] } }))
CALLOUTS.forEach(c => assetOps.push({ create: { calloutAsset: { calloutText: c } } }))
assetOps.push({ create: { structuredSnippetAsset: SNIPPET } })
const aJ = await mut('assets', assetOps)
const res = aJ.results.map(r => r.resourceName)
const slRes = res.slice(0, SL.length), coRes = res.slice(SL.length, SL.length + CALLOUTS.length), ssRes = res[res.length - 1]
console.log('assets created:', res.length, `(${SL.length} sitelinks, ${CALLOUTS.length} callouts, 1 snippet)`)

// link assets to campaign (+ reuse existing call asset)
const linkOps = []
slRes.forEach(a => linkOps.push({ create: { campaign: CAMP, asset: a, fieldType: 'SITELINK' } }))
coRes.forEach(a => linkOps.push({ create: { campaign: CAMP, asset: a, fieldType: 'CALLOUT' } }))
linkOps.push({ create: { campaign: CAMP, asset: ssRes, fieldType: 'STRUCTURED_SNIPPET' } })
linkOps.push({ create: { campaign: CAMP, asset: `customers/${CUST}/assets/350695210712`, fieldType: 'CALL' } })
const lJ = await mut('campaignAssets', linkOps)
console.log('assets linked to campaign:', lJ.results.length)

// --- observation audiences (bid-only, safe) ---
await mut('campaigns', [{ update: { resourceName: CAMP, targetingSetting: { targetRestrictions: [{ targetingDimension: 'AUDIENCE', bidOnly: true }] } }, updateMask: 'targeting_setting.target_restrictions' }])
const obs = await q("SELECT user_list.id, user_list.name FROM user_list WHERE user_list.name IN ('GM — All Consented Customers','GM — High LTV ($1,500+)','GM — Win-Back (Archived + 1+ jobs)')")
if (obs.length) { const o = obs.map(x => ({ create: { campaign: CAMP, userList: { userList: `customers/${CUST}/userLists/${x.userList.id}` } } })); const r = await mut('campaignCriteria', o); console.log('observation audiences added:', r.results.length, '(' + obs.map(x=>x.userList.name).join(', ') + ')') }

console.log('\nRun D complete. Campaign still PAUSED.')
