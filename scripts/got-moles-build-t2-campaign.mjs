#!/usr/bin/env node
// Build Got Moles T2 Problem-Aware (Stream 2) campaign via Google Ads API.
// Launches ENABLED. $15/day, manual CPC max $5.
// LP: score.got-moles.com (quiz → email capture).
// 16 cleared T2 problem-aware keywords + same negative stack as T1.

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

console.log('\n1. Creating budget...')
const budgetResults = await call('campaignBudgets', [{
  create: {
    name: `T2 Problem-Aware - Daily $15 - ${Date.now()}`,
    amountMicros: '15000000',
    deliveryMethod: 'STANDARD',
    explicitlyShared: false,
  },
}])
const budgetRN = budgetResults[0].resourceName
console.log(`   ${budgetRN}`)

console.log('\n2. Creating campaign (ENABLED)...')
const campaignResults = await call('campaigns', [{
  create: {
    name: 'T2 - Problem Aware (Stream 2)',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    campaignBudget: budgetRN,
    manualCpc: { enhancedCpcEnabled: false },
    networkSettings: {
      targetGoogleSearch: true, targetSearchNetwork: false,
      targetContentNetwork: false, targetPartnerSearchNetwork: false,
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

console.log(`\n3a. Adding ${GEO_TARGETS.length} geo + English...`)
const geoOps = GEO_TARGETS.map(rn => ({ create: { campaign: campaignRN, location: { geoTargetConstant: rn } } }))
geoOps.push({ create: { campaign: campaignRN, language: { languageConstant: 'languageConstants/1000' } } })
await call('campaignCriteria', geoOps)
console.log(`   OK`)

console.log('\n3b. Adding negatives...')
const NEGATIVES = [
  // Skin/dermatology
  'skin','skin mole','skin moles','dermatology','dermatologist','beauty','beauty mark','beauty spot',
  'face','facial','cosmetic','removal cream','mole cream','mole removal cream','wart','wart removal',
  'tag','skin tag','keratosis','melanoma','biopsy','laser','laser removal','at home','home remedy',
  // Pop culture
  'whack a mole','whack-a-mole','game','games','toy','toys','spy','molly','molotov',
  'guacamole','recipe','sauce','mexican',
  // Adjacent rodents
  'gopher','gophers','vole','voles','rat','rats','mice','mouse','squirrel','raccoon','opossum',
  'bee','wasp','ant','spider',
  // DIY products / shopping
  'amazon','walmart','home depot','lowes','ebay','etsy',
  'cheap','diy','kit','spike','spikes',
  'poison','baits','pellet','pellets','granule','granules','spray','sprays',
  'talpirid','bromethalin','strychnine','warfarin',
  // Recruitment
  'job','jobs','career','careers','employment','salary',
  // Sub-mole / animal-curiosity
  'how many eyes','how big','what do they eat','baby mole','what do moles look like',
  'are moles blind','do moles bite','do moles carry',
  // Wrong location
  'uk','england','britain','scotland','australia','canada','europe',
  'florida','texas','california','oregon','idaho','arizona','colorado','new york',
  // Legal
  'i-713','wdfw','rcw','wac','illegal','banned','regulation',
]
const negOps = NEGATIVES.map(text => ({
  create: { campaign: campaignRN, negative: true, keyword: { text, matchType: 'BROAD' } },
}))
await call('campaignCriteria', negOps)
console.log(`   OK (${NEGATIVES.length} negatives)`)

console.log('\n4. Creating ad group "T2 - Problem Aware" (ENABLED, max CPC $5)...')
const adGroupResults = await call('adGroups', [{
  create: {
    name: 'T2 - Problem Aware',
    campaign: campaignRN,
    status: 'ENABLED',
    type: 'SEARCH_STANDARD',
    cpcBidMicros: '5000000',
  },
}])
const adGroupRN = adGroupResults[0].resourceName
console.log(`   ${adGroupRN}`)

console.log('\n5. Adding keywords...')
const KEYWORDS = [
  { text: 'moles in yard', matchType: 'PHRASE' },
  { text: 'moles in lawn', matchType: 'PHRASE' },
  { text: 'moles in garden', matchType: 'PHRASE' },
  { text: 'mole damage', matchType: 'PHRASE' },
  { text: 'moles destroying lawn', matchType: 'PHRASE' },
  { text: 'moles ruining lawn', matchType: 'PHRASE' },
  { text: 'moles tearing up yard', matchType: 'PHRASE' },
  { text: 'mole holes', matchType: 'PHRASE' },
  { text: 'mole mounds', matchType: 'PHRASE' },
  { text: 'mole tunnels', matchType: 'PHRASE' },
  { text: 'mole infestation', matchType: 'PHRASE' },
  { text: 'signs of moles', matchType: 'PHRASE' },
  { text: 'moles keep coming back', matchType: 'PHRASE' },
  { text: 'permanent mole removal', matchType: 'PHRASE' },
  { text: 'stop moles', matchType: 'PHRASE' },
  { text: 'how to get rid of moles in your yard', matchType: 'PHRASE' },
]
const kwOps = KEYWORDS.map(k => ({ create: { adGroup: adGroupRN, status: 'ENABLED', keyword: k } }))
await call('adGroupCriteria', kwOps)
console.log(`   OK (${KEYWORDS.length} keywords)`)

console.log('\n6. Creating RSA...')
const HEADLINES = [
  { text: 'Stop Mole Damage to Your Lawn' },
  { text: 'Tunnels Ruining Your Yard?' },
  { text: 'Get Rid of Moles for Good' },
  { text: 'Western WA Mole Removal' },
  { text: 'Same-Day Free Inspection' },
  { text: 'Chemical-Free Mole Removal' },
  { text: '219+ 5-Star Google Reviews' },
  { text: '15+ Years on WA Mole Damage' },
  { text: 'Owner-Operated. WA Since 2017.' },
  { text: 'Save Your Lawn from Moles' },
  { text: 'Take a Free Mole Quiz' },
  { text: 'Get Your Mole Risk Score' },
  { text: 'Why Moles Keep Coming Back' },
  { text: 'Free 2-Min Mole Assessment' },
  { text: 'See If You Have Moles' },
]
const DESCRIPTIONS = [
  { text: 'Free 2-min quiz reveals what is damaging your yard. Personalized report. No card required.' },
  { text: 'Lawn tunnels & mounds? Take the free Got Moles risk quiz. See your score in 2 minutes.' },
  { text: '5,000+ WA properties served. 219+ five-star reviews. Free quiz. No call required.' },
  { text: 'Free risk assessment. See if moles are the cause + how to stop them coming back.' },
]
await call('adGroupAds', [{
  create: {
    adGroup: adGroupRN,
    status: 'ENABLED',
    ad: {
      finalUrls: ['https://score.got-moles.com/'],
      responsiveSearchAd: {
        headlines: HEADLINES,
        descriptions: DESCRIPTIONS,
        path1: 'Mole-Risk',
        path2: 'Quiz',
      },
    },
  },
}])
console.log(`   OK`)

console.log('\n7. Creating assets...')
const SITELINKS = [
  { linkText: 'Take the Quiz', description1: 'Free 2-min mole risk score.', description2: 'Personalized report.', finalUrl: 'https://score.got-moles.com/' },
  { linkText: '219+ Reviews', description1: 'All five-star.', description2: 'Google-verified.', finalUrl: 'https://got-moles.com/reviews' },
  { linkText: 'How It Works', description1: 'Inspection, removal, report.', description2: 'Chemical-free.', finalUrl: 'https://got-moles.com/how-it-works' },
  { linkText: 'Service Areas', description1: 'Tacoma · Seattle · Olympia.', description2: 'All Western WA.', finalUrl: 'https://got-moles.com/service-areas' },
  { linkText: 'Pricing', description1: '$450 flat one-time.', description2: 'Or year-round program.', finalUrl: 'https://got-moles.com/services/one-time-mole-removal' },
  { linkText: 'FAQ', description1: 'Common mole questions.', description2: 'Answered by Spencer.', finalUrl: 'https://got-moles.com/faq' },
]
const sitelinkOps = SITELINKS.map((sl, i) => ({
  create: {
    name: `T2 Sitelink - ${sl.linkText} - ${Date.now()}-${i}`,
    finalUrls: [sl.finalUrl],
    sitelinkAsset: { linkText: sl.linkText, description1: sl.description1, description2: sl.description2 },
  },
}))
const sitelinkResults = await call('assets', sitelinkOps)
console.log(`   ${sitelinkResults.length} sitelinks created`)

const CALLOUTS = [
  'Free 2-Min Quiz', 'No Card Required', 'Personalized Report', '219+ Five-Star Reviews',
  '15+ Years Experience', 'Chemical-Free Methods', 'Veteran-Owned', 'Western WA Specialists',
]
const calloutOps = CALLOUTS.map((text, i) => ({
  create: { name: `T2 Callout - ${text} - ${Date.now()}-${i}`, calloutAsset: { calloutText: text } },
}))
const calloutResults = await call('assets', calloutOps)
console.log(`   ${calloutResults.length} callouts created`)

const snippetResults = await call('assets', [{
  create: {
    name: `T2 Snippet - ${Date.now()}`,
    structuredSnippetAsset: {
      header: 'Service catalog',
      values: ['Free Mole Quiz', 'Mole Removal', 'Year-Round Protection', 'Property Inspection'],
    },
  },
}])

console.log('   Creating call asset (253-750-0211)...')
const callResults = await call('assets', [{
  create: {
    name: `T2 Call - Got Moles - ${Date.now()}`,
    callAsset: {
      countryCode: 'US',
      phoneNumber: '2537500211',
      callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION',
    },
  },
}])

console.log('\n8. Linking assets...')
const linkOps = [
  ...sitelinkResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'SITELINK' } })),
  ...calloutResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALLOUT' } })),
  ...snippetResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'STRUCTURED_SNIPPET' } })),
  ...callResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALL' } })),
]
await call('campaignAssets', linkOps)
console.log(`   OK (${linkOps.length} asset links)`)

console.log('\n✅ T2 PROBLEM-AWARE (STREAM 2) CAMPAIGN LIVE')
console.log(`Campaign: ${campaignRN}`)
console.log(`ID: ${campaignId}`)
console.log(`Status: ENABLED, $15/day, max CPC $5`)
console.log(`LP: https://score.got-moles.com/`)
console.log(`URL: https://ads.google.com/aw/campaigns?campaignId=${campaignId}&__c=${CID}`)
