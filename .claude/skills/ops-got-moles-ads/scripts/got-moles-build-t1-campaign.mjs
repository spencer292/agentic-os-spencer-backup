#!/usr/bin/env node
// Build Got Moles T1 Buyer-Intent campaign via Google Ads API.
// Launches ENABLED. $30/day, manual CPC max $14.
// LP: https://got-moles.com/services/one-time-mole-removal
// 16 cleared keywords + extensive medical/cosmetic negatives.

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
const V = 'v23'

const geoData = JSON.parse(fs.readFileSync('projects/briefs/got-moles-paid-search/geo-targets-resolved.json', 'utf8'))
const GEO_TARGETS = geoData.resolved.map(r => r.resourceName)
console.log(`Loaded ${GEO_TARGETS.length} geo targets`)

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

async function call(resource, operations) {
  const url = `https://googleads.googleapis.com/${V}/customers/${CID}/${resource}:mutate`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ operations }) })
  const data = await res.json()
  if (!res.ok) {
    console.error(`FAIL on ${resource}:`, JSON.stringify(data, null, 2))
    process.exit(1)
  }
  return data.results || []
}

// ============================================================
// 1. BUDGET ($30/day)
// ============================================================
console.log('\n1. Creating budget...')
const budgetResults = await call('campaignBudgets', [{
  create: {
    name: `T1 Buyer-Intent - Daily $30 - ${Date.now()}`,
    amountMicros: '30000000',
    deliveryMethod: 'STANDARD',
    explicitlyShared: false,
  },
}])
const budgetRN = budgetResults[0].resourceName
console.log(`   ${budgetRN}`)

// ============================================================
// 2. CAMPAIGN (ENABLED on launch)
// ============================================================
console.log('\n2. Creating campaign (ENABLED)...')
const campaignResults = await call('campaigns', [{
  create: {
    name: 'T1 - Buyer Intent',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    campaignBudget: budgetRN,
    manualCpc: { enhancedCpcEnabled: false },
    networkSettings: {
      targetGoogleSearch: true,
      targetSearchNetwork: false,
      targetContentNetwork: false,
      targetPartnerSearchNetwork: false,
    },
    geoTargetTypeSetting: {
      positiveGeoTargetType: 'PRESENCE_OR_INTEREST',
      negativeGeoTargetType: 'PRESENCE',
    },
    containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
  },
}])
const campaignRN = campaignResults[0].resourceName
const campaignId = campaignRN.split('/').pop()
console.log(`   ${campaignRN}`)

// ============================================================
// 3. GEO + LANGUAGE + NEGATIVES
// ============================================================
console.log(`\n3a. Adding ${GEO_TARGETS.length} geo + English...`)
const geoOps = GEO_TARGETS.map(rn => ({
  create: { campaign: campaignRN, location: { geoTargetConstant: rn } },
}))
geoOps.push({
  create: { campaign: campaignRN, language: { languageConstant: 'languageConstants/1000' } },
})
await call('campaignCriteria', geoOps)
console.log(`   OK`)

console.log('\n3b. Adding negative keywords (medical/cosmetic + DIY + adjacent species)...')
const NEGATIVES = [
  // Skin/dermatology cluster
  'skin','skin mole','skin moles','dermatology','dermatologist','beauty','beauty mark','beauty spot',
  'face','facial','cosmetic','removal cream','mole cream','mole removal cream','wart','wart removal',
  'tag','skin tag','keratosis','melanoma','biopsy','laser','laser removal','at home','home remedy',
  // Pop culture / media / non-pest
  'whack a mole','whack-a-mole','game','games','toy','toys','spy','molenet','molly','molotov',
  'guacamole','recipe','sauce','mexican',
  // Adjacent rodents (separate intent)
  'gopher','gophers','vole','voles','rat','rats','mice','mouse','squirrel','raccoon','opossum',
  'bee','wasp','ant','spider',
  // DIY products / shopping
  'amazon','walmart','home depot','lowes','ebay','etsy','best buy',
  'trap','traps','traps for sale','cheap','diy','kit','spike','spikes',
  'poison','baits','pellet','pellets','granule','granules','spray','sprays',
  // Ingredient/poison brand queries
  'talpirid','bromethalin','strychnine','warfarin',
  // Recruitment
  'job','jobs','career','careers','employment','salary','hire me',
  // Free / cheap intent (low quality)
  'free','cheap','diy guide','how to make',
  // Sub-mole queries that won't convert
  'how many eyes','how big','what do they eat','baby mole','what do moles look like',
  'are moles blind','do moles bite','do moles carry',
  // Wrong location
  'uk','england','britain','scotland','australia','canada','europe',
  'florida','texas','california','oregon','idaho','arizona','colorado','new york',
  // Legal/research
  'i-713','wdfw','rcw','wac','law','legal','illegal','banned','ban','regulation',
  // Adjacent products
  'mole repellent','sonic','ultrasonic','solar','vinegar','castor','garlic','dawn',
]
const negOps = NEGATIVES.map(text => ({
  create: { campaign: campaignRN, negative: true, keyword: { text, matchType: 'BROAD' } },
}))
await call('campaignCriteria', negOps)
console.log(`   OK (${NEGATIVES.length} negatives)`)

// ============================================================
// 4. AD GROUP
// ============================================================
console.log('\n4. Creating ad group "T1 - Buyer Intent" (ENABLED, max CPC $14)...')
const adGroupResults = await call('adGroups', [{
  create: {
    name: 'T1 - Buyer Intent',
    campaign: campaignRN,
    status: 'ENABLED',
    type: 'SEARCH_STANDARD',
    cpcBidMicros: '14000000',
  },
}])
const adGroupRN = adGroupResults[0].resourceName
console.log(`   ${adGroupRN}`)

// ============================================================
// 5. KEYWORDS — 16 cleared T1 candidates from 15-policy-preflight.md
// ============================================================
console.log('\n5. Adding keywords...')
const KEYWORDS = [
  { text: 'mole removal', matchType: 'PHRASE' },
  { text: 'mole exterminator', matchType: 'PHRASE' },
  { text: 'mole control', matchType: 'PHRASE' },
  { text: 'mole removal near me', matchType: 'PHRASE' },
  { text: 'mole exterminator near me', matchType: 'PHRASE' },
  { text: 'pest control for moles', matchType: 'PHRASE' },
  { text: 'exterminator for moles', matchType: 'PHRASE' },
  { text: 'mole removal cost', matchType: 'PHRASE' },
  { text: 'professional mole removal', matchType: 'PHRASE' },
  { text: 'mole catcher', matchType: 'PHRASE' },
  { text: 'mole trapper', matchType: 'PHRASE' },
  { text: 'mole catchers near me', matchType: 'PHRASE' },
  { text: 'companies that get rid of moles', matchType: 'PHRASE' },
  { text: 'best mole exterminator near me', matchType: 'PHRASE' },
  { text: 'mole removal services', matchType: 'PHRASE' },
  { text: 'mole removal company', matchType: 'PHRASE' },
]
const kwOps = KEYWORDS.map(k => ({
  create: { adGroup: adGroupRN, status: 'ENABLED', keyword: k },
}))
await call('adGroupCriteria', kwOps)
console.log(`   OK (${KEYWORDS.length} keywords)`)

// ============================================================
// 6. RSA — cleared headlines + descriptions from 15-policy-preflight.md
// ============================================================
console.log('\n6. Creating RSA...')
const HEADLINES = [
  { text: 'Got Moles — Mole Removal' },
  { text: 'Professional Mole Removal' },
  { text: 'Mole Exterminator in WA' },
  { text: 'Get Rid of Moles for Good' },
  { text: 'Same-Day Mole Removal' },
  { text: 'Western WA Mole Specialists' },
  { text: 'Free Mole Inspection' },
  { text: 'Chemical-Free Mole Removal' },
  { text: '5,000+ WA Properties Served' },
  { text: '219+ Five-Star Reviews' },
  { text: '15+ Years of Experience' },
  { text: 'No Poisons. No Chemicals.' },
  { text: 'Mole Removal Done Right' },
  { text: 'Stop Mole Damage' },
  { text: 'Call Got Moles Today' },
]
const DESCRIPTIONS = [
  { text: 'Professional mole removal in Western WA. Chemical-free, safe for pets & kids.' },
  { text: '5,000+ WA properties served. 219+ five-star reviews. Same-day free quote.' },
  { text: "Got Moles - Spencer's mole-removal team. WA since 2017. Inspection & removal." },
  { text: 'Free property inspection. No poisons or chemicals. Mole control done right.' },
]
await call('adGroupAds', [{
  create: {
    adGroup: adGroupRN,
    status: 'ENABLED',
    ad: {
      finalUrls: ['https://got-moles.com/services/one-time-mole-removal'],
      responsiveSearchAd: {
        headlines: HEADLINES,
        descriptions: DESCRIPTIONS,
        path1: 'Mole-Removal',
        path2: 'WA',
      },
    },
  },
}])
console.log(`   OK`)

// ============================================================
// 7. ASSETS — sitelinks, callouts, structured snippet, call asset
// ============================================================
console.log('\n7. Creating assets...')

const SITELINKS = [
  { linkText: 'Pricing & Guarantee', description1: '$450 flat. $150 if no mole.', description2: 'Veteran-owned guarantee.', finalUrl: 'https://got-moles.com/services/one-time-mole-removal' },
  { linkText: '219+ Reviews', description1: 'All five-star.', description2: 'Google-verified.', finalUrl: 'https://got-moles.com/reviews' },
  { linkText: 'Service Areas', description1: 'Tacoma · Seattle · Olympia.', description2: 'All Western WA.', finalUrl: 'https://got-moles.com/service-areas' },
  { linkText: 'How It Works', description1: 'Inspection, removal, report.', description2: 'Chemical-free process.', finalUrl: 'https://got-moles.com/how-it-works' },
  { linkText: 'Free Inspection', description1: 'Free property review.', description2: 'Same-day call-back.', finalUrl: 'https://got-moles.com/contact' },
  { linkText: 'FAQ', description1: 'Common mole questions.', description2: 'Answered by Spencer.', finalUrl: 'https://got-moles.com/faq' },
]
const sitelinkOps = SITELINKS.map((sl, i) => ({
  create: {
    name: `T1 Sitelink - ${sl.linkText} - ${Date.now()}-${i}`,
    finalUrls: [sl.finalUrl],
    sitelinkAsset: { linkText: sl.linkText, description1: sl.description1, description2: sl.description2 },
  },
}))
const sitelinkResults = await call('assets', sitelinkOps)
console.log(`   ${sitelinkResults.length} sitelinks created`)

const CALLOUTS = [
  'Same-Day Reply', 'Free Inspection', '$450 Flat Rate', '219+ Five-Star Reviews',
  '15+ Years Experience', 'Chemical-Free Methods', 'Veteran-Owned', 'Western WA Specialists',
]
const calloutOps = CALLOUTS.map((text, i) => ({
  create: {
    name: `T1 Callout - ${text} - ${Date.now()}-${i}`,
    calloutAsset: { calloutText: text },
  },
}))
const calloutResults = await call('assets', calloutOps)
console.log(`   ${calloutResults.length} callouts created`)

const snippetResults = await call('assets', [{
  create: {
    name: `T1 Snippet - Service catalog - ${Date.now()}`,
    structuredSnippetAsset: {
      header: 'Service catalog',
      values: ['Mole Removal', 'Year-Round Protection', 'Property Inspection', 'Written Report'],
    },
  },
}])
console.log(`   1 structured snippet created`)

console.log('   Creating call asset (253-750-0211)...')
const callResults = await call('assets', [{
  create: {
    name: `T1 Call - Got Moles - ${Date.now()}`,
    callAsset: {
      countryCode: 'US',
      phoneNumber: '2537500211',
      callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION',
    },
  },
}])
console.log(`   1 call asset created`)

// ============================================================
// 8. LINK ASSETS
// ============================================================
console.log('\n8. Linking assets to campaign...')
const linkOps = [
  ...sitelinkResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'SITELINK' } })),
  ...calloutResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALLOUT' } })),
  ...snippetResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'STRUCTURED_SNIPPET' } })),
  ...callResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALL' } })),
]
await call('campaignAssets', linkOps)
console.log(`   OK (${linkOps.length} asset links)`)

console.log('\n✅ T1 BUYER-INTENT CAMPAIGN LIVE')
console.log(`Campaign: ${campaignRN}`)
console.log(`ID: ${campaignId}`)
console.log(`Status: ENABLED, $30/day, max CPC $14`)
console.log(`LP: https://got-moles.com/services/one-time-mole-removal`)
console.log(`URL: https://ads.google.com/aw/campaigns?campaignId=${campaignId}&__c=${CID}`)
