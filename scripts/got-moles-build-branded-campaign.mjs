#!/usr/bin/env node
// Build the Got Moles Branded campaign via Google Ads API.
// Creates everything PAUSED — Roy enables in UI after review.
// Sequential: budget -> campaign -> geo + negatives -> ad group -> keywords -> RSA -> assets -> link assets

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

// Load resolved geo targets
const geoData = JSON.parse(fs.readFileSync('projects/briefs/got-moles-paid-search/geo-targets-resolved.json', 'utf8'))
const GEO_TARGETS = geoData.resolved.map(r => r.resourceName)
console.log(`Loaded ${GEO_TARGETS.length} geo targets`)

// Mint token
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
// 1. BUDGET
// ============================================================
console.log('\n1. Creating campaign budget...')
const budgetResults = await call('campaignBudgets', [{
  create: {
    name: `Brand - Daily $10 - ${Date.now()}`,
    amountMicros: '10000000',
    deliveryMethod: 'STANDARD',
    explicitlyShared: false,
  },
}])
const budgetRN = budgetResults[0].resourceName
console.log(`   ${budgetRN}`)

// ============================================================
// 2. CAMPAIGN
// ============================================================
console.log('\n2. Creating campaign (PAUSED)...')
const campaignResults = await call('campaigns', [{
  create: {
    name: 'Brand',
    status: 'PAUSED',
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
// 3. GEO + LANGUAGE + NEGATIVES (campaign criteria)
// ============================================================
console.log(`\n3a. Adding ${GEO_TARGETS.length} geo targets + English language...`)
const geoOps = GEO_TARGETS.map(rn => ({
  create: {
    campaign: campaignRN,
    location: { geoTargetConstant: rn },
  },
}))
// Add English language criterion
geoOps.push({
  create: {
    campaign: campaignRN,
    language: { languageConstant: 'languageConstants/1000' },
  },
})
await call('campaignCriteria', geoOps)
console.log(`   OK`)

console.log('\n3b. Adding campaign-level negative keywords...')
const NEGATIVES = [
  { text: 'in my yard', matchType: 'PHRASE' },
  { text: 'in my lawn', matchType: 'PHRASE' },
  { text: 'in your yard', matchType: 'PHRASE' },
  { text: 'in your lawn', matchType: 'PHRASE' },
  { text: 'do i have', matchType: 'PHRASE' },
  { text: 'signs of', matchType: 'PHRASE' },
  { text: 'how to tell', matchType: 'PHRASE' },
  { text: 'i think i have', matchType: 'PHRASE' },
  { text: 'have i got', matchType: 'PHRASE' },
  { text: 'yard', matchType: 'BROAD' },
  { text: 'lawn', matchType: 'BROAD' },
  { text: 'garden', matchType: 'BROAD' },
  { text: 'grass', matchType: 'BROAD' },
  { text: 'backyard', matchType: 'BROAD' },
  { text: 'bite', matchType: 'BROAD' },
  { text: 'eat', matchType: 'BROAD' },
  { text: 'eyes', matchType: 'BROAD' },
  { text: 'vinegar', matchType: 'BROAD' },
  { text: 'castor', matchType: 'BROAD' },
  { text: 'sonic', matchType: 'BROAD' },
  { text: 'gopher', matchType: 'BROAD' },
  { text: 'vole', matchType: 'BROAD' },
  { text: 'skin', matchType: 'BROAD' },
  { text: 'beauty', matchType: 'BROAD' },
  { text: 'face', matchType: 'BROAD' },
  { text: 'amazon', matchType: 'BROAD' },
  { text: 'walmart', matchType: 'BROAD' },
  { text: 'jobs', matchType: 'BROAD' },
  { text: 'careers', matchType: 'BROAD' },
  { text: 'employment', matchType: 'BROAD' },
]
const negOps = NEGATIVES.map(n => ({
  create: {
    campaign: campaignRN,
    negative: true,
    keyword: n,
  },
}))
await call('campaignCriteria', negOps)
console.log(`   OK (${NEGATIVES.length} negatives)`)

// ============================================================
// 4. AD GROUP
// ============================================================
console.log('\n4. Creating ad group "Brand" (PAUSED)...')
const adGroupResults = await call('adGroups', [{
  create: {
    name: 'Brand',
    campaign: campaignRN,
    status: 'PAUSED',
    type: 'SEARCH_STANDARD',
    cpcBidMicros: '3000000', // $3 max
  },
}])
const adGroupRN = adGroupResults[0].resourceName
console.log(`   ${adGroupRN}`)

// ============================================================
// 5. KEYWORDS
// ============================================================
console.log('\n5. Adding keywords...')
const KEYWORDS = [
  { text: 'got moles', matchType: 'EXACT' },
  { text: 'got moles spencer', matchType: 'PHRASE' },
  { text: 'got moles tacoma', matchType: 'PHRASE' },
  { text: 'got moles seattle', matchType: 'PHRASE' },
  { text: 'got moles olympia', matchType: 'PHRASE' },
  { text: 'got moles wa', matchType: 'PHRASE' },
  { text: 'got moles washington', matchType: 'PHRASE' },
  { text: 'got moles reviews', matchType: 'PHRASE' },
  { text: 'got moles website', matchType: 'PHRASE' },
  { text: 'got moles phone', matchType: 'PHRASE' },
  { text: 'got moles spencer andrews', matchType: 'PHRASE' },
]
const kwOps = KEYWORDS.map(k => ({
  create: {
    adGroup: adGroupRN,
    status: 'ENABLED',
    keyword: k,
  },
}))
await call('adGroupCriteria', kwOps)
console.log(`   OK (${KEYWORDS.length} keywords)`)

// ============================================================
// 6. RESPONSIVE SEARCH AD
// ============================================================
console.log('\n6. Creating RSA...')
const HEADLINES = [
  { text: 'Got Moles — Official Site', pinnedField: 'HEADLINE_1' },
  { text: 'Got Moles | Mole Removal' },
  { text: 'Got Moles WA' },
  { text: 'Got Moles — Same-Day Reply' },
  { text: 'Got Moles | 219+ Reviews' },
  { text: 'Got Moles — 5,000+ Customers' },
  { text: 'Got Moles | WA Since 2017' },
  { text: 'Got Moles | 15+ Years' },
  { text: 'Got Moles — Tacoma · Seattle' },
  { text: 'Western WA Mole Specialists' },
  { text: 'Get a Free Mole Inspection' },
  { text: 'Mole Removal — Got Moles' },
  { text: 'Chemical-Free Methods' },
  { text: 'Call Got Moles Today' },
  { text: 'Got Moles | Spencer Andrews' },
]
const DESCRIPTIONS = [
  { text: "Official Got Moles. Chemical-free mole removal across Western Washington since 2017." },
  { text: "5,000+ WA properties served. 219+ five-star Google reviews. Free inspection available." },
  { text: "Got Moles — Spencer's original mole-removal team. Same-day call-back, free quote." },
  { text: "Specialists in mole removal across Tacoma, Seattle & Olympia areas. Call or fill the form." },
]
await call('adGroupAds', [{
  create: {
    adGroup: adGroupRN,
    status: 'ENABLED',
    ad: {
      finalUrls: ['https://got-moles.com/'],
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
// 7. ASSETS — sitelinks, callouts, structured snippet, call
// ============================================================
console.log('\n7. Creating assets...')

const SITELINKS = [
  { linkText: 'About Got Moles', description1: '15+ years experience.', description2: 'Mole-removal specialists.', finalUrl: 'https://got-moles.com/about/' },
  { linkText: 'Reviews', description1: '219+ five-star reviews.', description2: 'Google-verified.', finalUrl: 'https://got-moles.com/reviews/' },
  { linkText: 'Service Areas', description1: 'All cities Got Moles serves.', description2: 'Tacoma, Seattle, Olympia.', finalUrl: 'https://got-moles.com/service-areas/' },
  { linkText: 'How It Works', description1: 'Inspection, removal, report.', description2: 'Chemical-free process.', finalUrl: 'https://got-moles.com/how-it-works/' },
  { linkText: 'Free Inspection', description1: 'Get a free property review.', description2: 'Same-day call-back.', finalUrl: 'https://got-moles.com/contact/' },
  { linkText: 'FAQ', description1: 'Common questions.', description2: 'Answered by Spencer.', finalUrl: 'https://got-moles.com/faq/' },
]

const sitelinkOps = SITELINKS.map((sl, i) => ({
  create: {
    name: `Sitelink - ${sl.linkText} - ${Date.now()}-${i}`,
    finalUrls: [sl.finalUrl],
    sitelinkAsset: {
      linkText: sl.linkText,
      description1: sl.description1,
      description2: sl.description2,
    },
  },
}))
const sitelinkResults = await call('assets', sitelinkOps)
console.log(`   ${sitelinkResults.length} sitelinks created`)

const CALLOUTS = [
  'Same-Day Reply', 'Free Inspection', '5,000+ WA Properties', '219+ Five-Star Reviews',
  '15+ Years Experience', 'Chemical-Free Methods', 'Western WA Specialists', 'Owner-Operated',
]
const calloutOps = CALLOUTS.map((text, i) => ({
  create: {
    name: `Callout - ${text} - ${Date.now()}-${i}`,
    calloutAsset: { calloutText: text },
  },
}))
const calloutResults = await call('assets', calloutOps)
console.log(`   ${calloutResults.length} callouts created`)

const snippetResults = await call('assets', [{
  create: {
    name: `Snippet - Service catalog - ${Date.now()}`,
    structuredSnippetAsset: {
      header: 'Service catalog',
      values: ['Mole Removal', 'Year-Round Protection', 'Property Inspection', 'Written Report'],
    },
  },
}])
console.log(`   1 structured snippet created`)

// Call asset SKIPPED — requires Roy to accept Call Recording Terms of Service in Google Ads UI first.
// Once accepted, add the call asset manually in the campaign settings:
//   Phone: 253-750-0211, Country: US
const callResults = []
console.log(`   Call asset SKIPPED (needs Call Recording ToS accepted in UI first)`)

// ============================================================
// 8. LINK ASSETS TO CAMPAIGN
// ============================================================
console.log('\n8. Linking assets to campaign...')
const linkOps = [
  ...sitelinkResults.map(r => ({
    create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'SITELINK' },
  })),
  ...calloutResults.map(r => ({
    create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALLOUT' },
  })),
  ...snippetResults.map(r => ({
    create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'STRUCTURED_SNIPPET' },
  })),
  ...callResults.map(r => ({
    create: { campaign: campaignRN, asset: r.resourceName, fieldType: 'CALL' },
  })),
]
await call('campaignAssets', linkOps)
console.log(`   OK (${linkOps.length} asset links)`)

console.log('\n✅ DONE')
console.log(`\nCampaign: ${campaignRN} (id: ${campaignId})`)
console.log(`Status: PAUSED — review and enable in Google Ads UI`)
console.log(`URL: https://ads.google.com/aw/campaigns?campaignId=${campaignId}&__c=${CID}`)
