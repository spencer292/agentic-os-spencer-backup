// Phase 6 NEW CAMPAIGN — Run A: skeleton. Budget + PAUSED campaign + geo + schedule + device + attach 6 neg lists.
// PAUSED = zero spend/serving. No effect on T1. Budget object is NEW $150 (only spends after swap, when T1 is paused).
import fs from 'node:fs'; import path from 'node:path'
const env = {}; for (const l of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v }
const V = 'v23', CUST = '1665761172', MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
const at = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })).json()).access_token
async function mut(ep, ops) { const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': MCC, 'Content-Type': 'application/json' }, body: JSON.stringify({ operations: ops }) }); const j = await r.json(); if (!r.ok) { console.error(`${ep} FAIL:`, JSON.stringify(j, null, 2)); process.exit(1) } return j }

// 1. budget (new, $150/day, not shared)
const budJ = await mut('campaignBudgets', [{ create: { name: 'T1 v2 — City Exact budget', amountMicros: '150000000', deliveryMethod: 'STANDARD', explicitlyShared: false } }])
const budget = budJ.results[0].resourceName
console.log('budget:', budget.split('/').pop(), '$150/day')

// 2. campaign — PAUSED, Search only, Manual CPC, PRESENCE geo
const campJ = await mut('campaigns', [{ create: {
  name: 'T1 v2 — City Exact', status: 'PAUSED', advertisingChannelType: 'SEARCH', campaignBudget: budget,
  manualCpc: { enhancedCpcEnabled: false },
  networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
  geoTargetTypeSetting: { positiveGeoTargetType: 'PRESENCE', negativeGeoTargetType: 'PRESENCE' },
} }])
const camp = campJ.results[0].resourceName
console.log('campaign:', camp.split('/').pop(), '(PAUSED)')

// 3. geo: 5 proximity (15mi) + 2 location exclusions (same as T1)
const PROX = [['Seattle',47.6062,-122.3321],['Tacoma',47.2529,-122.4443],['Kirkland',47.6815,-122.2087],['Kent',47.3809,-122.2348],['Bellevue',47.6101,-122.2015]]
const geoOps = PROX.map(([n,la,lo]) => ({ create: { campaign: camp, proximity: { radius: 15, radiusUnits: 'MILES', geoPoint: { latitudeInMicroDegrees: Math.round(la*1e6), longitudeInMicroDegrees: Math.round(lo*1e6) } } } }))
for (const gc of ['geoTargetConstants/21146','geoTargetConstants/21164']) geoOps.push({ create: { campaign: camp, negative: true, location: { geoTargetConstant: gc } } })
// 4. ad schedule
const SCHED = [['MONDAY',7,20],['TUESDAY',7,20],['WEDNESDAY',7,20],['THURSDAY',7,20],['FRIDAY',7,20],['SATURDAY',8,18],['SUNDAY',8,18]]
for (const [d,s,e] of SCHED) geoOps.push({ create: { campaign: camp, adSchedule: { dayOfWeek: d, startHour: s, startMinute: 'ZERO', endHour: e, endMinute: 'ZERO' } } })
// 5. device: mobile +20%
geoOps.push({ create: { campaign: camp, device: { type: 'MOBILE' }, bidModifier: 1.2 } })
const critJ = await mut('campaignCriteria', geoOps)
console.log('criteria added:', critJ.results.length, '(5 proximity + 2 geo-excl + 7 schedule + 1 device)')

// 6. attach 6 negative shared lists
const SETS = ['12095530373','12091490334','12093114868','12093114679','12095529419','12095530412']
const cssJ = await mut('campaignSharedSets', SETS.map(id => ({ create: { campaign: camp, sharedSet: `customers/${CUST}/sharedSets/${id}` } })))
console.log('negative lists attached:', cssJ.results.length, '/6')

console.log('\nRun A complete. Campaign PAUSED, zero spend. resource:', camp)
console.log('CAMPAIGN_ID=' + camp.split('/').pop())
