#!/usr/bin/env node
// Got Moles T3 Solution-Research (Stream 2) campaign.
// $10/day, manual CPC max $4. LP: score.got-moles.com.
// 9 LOW-risk T3 keywords. Medium-risk (eliminate/eradicate/exterminate) deferred.

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
    client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token',
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
  const res = await fetch(`https://googleads.googleapis.com/${V}/customers/${CID}/${resource}:mutate`, {
    method: 'POST', headers, body: JSON.stringify({ operations }),
  })
  const data = await res.json()
  if (!res.ok) { console.error(`FAIL ${resource}:`, JSON.stringify(data, null, 2)); process.exit(1) }
  return data.results || []
}

console.log('\n1. Budget...')
const budgetRN = (await call('campaignBudgets', [{
  create: { name: `T3 Solution-Research - $10/day - ${Date.now()}`, amountMicros: '10000000', deliveryMethod: 'STANDARD', explicitlyShared: false },
}]))[0].resourceName
console.log(`   ${budgetRN}`)

console.log('\n2. Campaign (ENABLED)...')
const campaignRN = (await call('campaigns', [{
  create: {
    name: 'T3 - Solution Research (Stream 2)',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    campaignBudget: budgetRN,
    manualCpc: { enhancedCpcEnabled: false },
    networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
    geoTargetTypeSetting: { positiveGeoTargetType: 'PRESENCE_OR_INTEREST', negativeGeoTargetType: 'PRESENCE' },
    containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
  },
}]))[0].resourceName
const campaignId = campaignRN.split('/').pop()
console.log(`   ${campaignRN}`)

console.log(`\n3a. Geo + English...`)
const geoOps = GEO_TARGETS.map(rn => ({ create: { campaign: campaignRN, location: { geoTargetConstant: rn } } }))
geoOps.push({ create: { campaign: campaignRN, language: { languageConstant: 'languageConstants/1000' } } })
await call('campaignCriteria', geoOps)
console.log(`   OK`)

console.log('\n3b. Negatives (extra heavy on medical/cosmetic for "how to remove moles" overlap)...')
const NEGATIVES = [
  // Skin/dermatology — extra critical for T3
  'skin','skin mole','skin moles','dermatology','dermatologist','beauty','beauty mark','beauty spot',
  'face','facial','cosmetic','cream','removal cream','mole cream','wart','wart removal',
  'skin tag','keratosis','melanoma','biopsy','laser','laser removal','at home','home remedy',
  'naturally','from skin','from face','from body','natural removal',
  // Pop culture
  'whack a mole','whack-a-mole','game','games','toy','spy','molly','molotov',
  'guacamole','recipe','sauce','mexican',
  // Adjacent rodents
  'gopher','vole','rat','mice','mouse','squirrel','raccoon','opossum',
  'bee','wasp','ant','spider',
  // High-risk drops (kill verbs explicitly negated)
  'kill','poison','baits','pellet','granule','spray',
  'talpirid','bromethalin','strychnine','warfarin',
  // Recruitment / ID
  'job','jobs','career','employment','salary',
  // Sub-mole / animal-curiosity
  'how many eyes','how big','baby mole','what do moles look like','are moles blind','do moles bite','do moles carry',
  // Wrong location
  'uk','england','britain','scotland','australia','canada','europe',
  'florida','texas','california','oregon','idaho','arizona','colorado','new york',
  // Legal
  'i-713','wdfw','rcw','wac','illegal','banned','regulation',
]
const negOps = NEGATIVES.map(text => ({ create: { campaign: campaignRN, negative: true, keyword: { text, matchType: 'BROAD' } } }))
await call('campaignCriteria', negOps)
console.log(`   OK (${NEGATIVES.length} negatives)`)

console.log('\n4. Ad group...')
const adGroupRN = (await call('adGroups', [{
  create: { name: 'T3 - Solution Research', campaign: campaignRN, status: 'ENABLED', type: 'SEARCH_STANDARD', cpcBidMicros: '4000000' },
}]))[0].resourceName
console.log(`   ${adGroupRN}`)

console.log('\n5. Keywords (9 LOW-risk only)...')
const KEYWORDS = [
  { text: 'how to get rid of moles', matchType: 'PHRASE' },
  { text: 'best way to get rid of moles', matchType: 'PHRASE' },
  { text: 'how to remove moles', matchType: 'PHRASE' },
  { text: 'how to control moles', matchType: 'PHRASE' },
  { text: 'how to stop moles', matchType: 'PHRASE' },
  { text: 'vinegar to deter moles', matchType: 'PHRASE' },
  { text: 'castor oil for moles', matchType: 'PHRASE' },
  { text: 'mole repellent', matchType: 'PHRASE' },
  { text: 'sonic mole repeller', matchType: 'PHRASE' },
]
const kwOps = KEYWORDS.map(k => ({ create: { adGroup: adGroupRN, status: 'ENABLED', keyword: k } }))
await call('adGroupCriteria', kwOps)
console.log(`   OK (${KEYWORDS.length} keywords)`)

console.log('\n6. RSA...')
const HEADLINES = [
  { text: 'Tried DIY? Time for a Pro' },
  { text: 'Vinegar Did Not Work?' },
  { text: 'Castor Oil Did Not Work?' },
  { text: 'Why DIY Mole Methods Fail' },
  { text: 'Why Sonic Repellers Fail' },
  { text: 'Get Rid of Moles for Good' },
  { text: 'Professional Mole Removal' },
  { text: 'Take Our Free Mole Quiz' },
  { text: 'Free Mole-Damage Assessment' },
  { text: 'Mole Removal in Western WA' },
  { text: '219+ Five-Star Reviews' },
  { text: '15+ Years on WA Mole Damage' },
  { text: 'See Your Mole Risk Score' },
  { text: 'Free 2-Min Quiz' },
  { text: 'Get a Personalized Report' },
]
const DESCRIPTIONS = [
  { text: 'Free 2-min quiz reveals why moles keep coming back. Personalized report. No card needed.' },
  { text: 'Western WA mole specialists since 2017. 219+ five-star reviews. Take the free quiz.' },
  { text: 'DIY methods rarely work long-term. Take the free risk quiz to see what is missing.' },
  { text: 'Free assessment. See if moles are the cause + how to stop them coming back for good.' },
]
await call('adGroupAds', [{
  create: {
    adGroup: adGroupRN, status: 'ENABLED',
    ad: {
      finalUrls: ['https://score.got-moles.com/'],
      responsiveSearchAd: { headlines: HEADLINES, descriptions: DESCRIPTIONS, path1: 'Mole-Risk', path2: 'Quiz' },
    },
  },
}])
console.log(`   OK`)

console.log('\n7. Assets...')
const SITELINKS = [
  { linkText: 'Take the Quiz', description1: 'Free 2-min mole risk score.', description2: 'Personalized report.', finalUrl: 'https://score.got-moles.com/' },
  { linkText: '219+ Reviews', description1: 'All five-star.', description2: 'Google-verified.', finalUrl: 'https://got-moles.com/reviews' },
  { linkText: 'How It Works', description1: 'Inspection, removal, report.', description2: 'Chemical-free.', finalUrl: 'https://got-moles.com/how-it-works' },
  { linkText: 'Service Areas', description1: 'Tacoma · Seattle · Olympia.', description2: 'All Western WA.', finalUrl: 'https://got-moles.com/service-areas' },
  { linkText: 'Pricing', description1: '$450 flat one-time.', description2: 'Or year-round program.', finalUrl: 'https://got-moles.com/services/one-time-mole-removal' },
  { linkText: 'FAQ', description1: 'Common mole questions.', description2: 'Answered by Spencer.', finalUrl: 'https://got-moles.com/faq' },
]
const sitelinkResults = await call('assets', SITELINKS.map((sl, i) => ({
  create: {
    name: `T3 Sitelink - ${sl.linkText} - ${Date.now()}-${i}`,
    finalUrls: [sl.finalUrl],
    sitelinkAsset: { linkText: sl.linkText, description1: sl.description1, description2: sl.description2 },
  },
})))
console.log(`   ${sitelinkResults.length} sitelinks`)

const CALLOUTS = ['Free 2-Min Quiz', 'No Card Required', 'Personalized Report', '219+ Five-Star Reviews', '15+ Years Experience', 'Chemical-Free Methods', 'Veteran-Owned', 'Western WA Specialists']
const calloutResults = await call('assets', CALLOUTS.map((text, i) => ({
  create: { name: `T3 Callout - ${text} - ${Date.now()}-${i}`, calloutAsset: { calloutText: text } },
})))
console.log(`   ${calloutResults.length} callouts`)

const snippetResults = await call('assets', [{
  create: { name: `T3 Snippet - ${Date.now()}`, structuredSnippetAsset: { header: 'Service catalog', values: ['Free Mole Quiz', 'Mole Removal', 'Year-Round Protection', 'Property Inspection'] } },
}])

const callResults = await call('assets', [{
  create: { name: `T3 Call - ${Date.now()}`, callAsset: { countryCode: 'US', phoneNumber: '2537500211', callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION' } },
}])

console.log('\n8. Linking assets...')
const linkOps = [
  ...sitelinkResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'SITELINK' } })),
  ...calloutResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALLOUT' } })),
  ...snippetResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'STRUCTURED_SNIPPET' } })),
  ...callResults.map(r => ({ create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALL' } })),
]
await call('campaignAssets', linkOps)
console.log(`   OK (${linkOps.length} links)`)

console.log('\n✅ T3 SOLUTION-RESEARCH (STREAM 2) LIVE')
console.log(`Campaign ${campaignId}, $10/day, max CPC $4, LP score.got-moles.com`)
console.log(`URL: https://ads.google.com/aw/campaigns?campaignId=${campaignId}&__c=${CID}`)
