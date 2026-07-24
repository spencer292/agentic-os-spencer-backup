#!/usr/bin/env node
// rr-build-launch-campaign.mjs — build the Route Ready launch Search campaign,
// PAUSED, per the pre-agreed plan (keyword-backlog.md ★ seeds, $2.47/day cap).
// Idempotent: refuses to run if a campaign named CAMPAIGN_NAME already exists.
// Usage: node projects/briefs/zero-touch-business/scripts/rr-build-launch-campaign.mjs
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID
const API = `https://googleads.googleapis.com/v23/customers/${CID}`

const CAMPAIGN_NAME = 'RR — Search Launch (Templates)'
const DAILY_BUDGET_MICROS = 2_470_000 // $2.47/day ≈ $75/mo hard cap
const CPC_CEILING_MICROS = 1_250_000  // $1.25 max CPC ceiling

const KIT_URL = 'https://routereadykits.com/kits/cleaning-business-starter-kit/'
const PW_URL = 'https://routereadykits.com/guides/pressure-washing-contract-template/'
const LAWN_URL = 'https://routereadykits.com/guides/lawn-care-contract-template/'

const AD_GROUPS = [
  {
    name: 'Cleaning Kit — Templates',
    status: 'ENABLED', // live product ($49 kit) — the only group recommended to run at launch
    url: KIT_URL,
    keywords: [
      'cleaning business contract template',
      'commercial cleaning contract template',
      'cleaning service price list template',
      'cleaning business client intake form',
      'cleaning quote template',
      'airbnb cleaning checklist template',
    ],
    headlines: [
      'Cleaning Business Contract Kit',
      '14 Templates — One $49 Kit',
      'Contracts, Pricing & Forms',
      'Paperwork Done on Day One',
      'Built by a Real Operator',
      'Instant Download Today',
      'Stop Guessing What to Charge',
      'Editable Docs and Sheets',
    ],
    descriptions: [
      'Contracts, pricing calculator, intake forms, invoices — 14 editable files, instant access.',
      'Skip the $500 lawyer draft. Field-tested cleaning business paperwork, ready to customize.',
      'Built from a real 5,000-client service business. No course — templates you use today.',
      'Price with confidence: margin-guarded calculator plus agreements that protect you.',
    ],
  },
  {
    name: 'Pressure Washing — Templates',
    status: 'PAUSED', // no pressure-washing kit yet — guide-only landing page
    url: PW_URL,
    keywords: [
      'pressure washing contract template',
      'pressure washing quote template',
      'pressure washing liability waiver template',
    ],
    headlines: [
      'Pressure Washing Contract',
      'Contract & Waiver Templates',
      'Quote Template That Converts',
      'Protect Every Wash Job',
      'Written by an Operator',
      'Editable Templates Online',
    ],
    descriptions: [
      'Contract, quote, and liability waiver guidance for pressure washing businesses.',
      'What your agreement must say before you point a wand at anything. Operator-written.',
      'Get the terms that protect you on every driveway, deck, and commercial bid.',
    ],
  },
  {
    name: 'Lawn Care — Templates',
    status: 'PAUSED', // no lawn-care kit yet — guide-only landing page
    url: LAWN_URL,
    keywords: [
      'lawn care contract template',
      'lawn care quote template',
      'landscaping estimate template',
    ],
    headlines: [
      'Lawn Care Contract Template',
      'Quotes & Estimates Done Right',
      'Landscaping Estimate Help',
      'Protect Your Mowing Route',
      'Written by an Operator',
      'Editable Templates Online',
    ],
    descriptions: [
      'Contract, quote, and estimate guidance for lawn care and landscaping businesses.',
      'The agreement terms every recurring mowing route needs in writing. Operator-written.',
      'Stop working on a handshake. Get service terms that survive a bad customer.',
    ],
  },
]

// Pre-agreed guardrail negatives: job-seekers + zero-purchase-intent free-seekers.
const CAMPAIGN_NEGATIVES = ['jobs', 'job', 'hiring', 'salary', 'career', 'careers', 'employment', 'free']

// --- validate ad copy lengths before touching the API ---
let bad = false
for (const g of AD_GROUPS) {
  for (const h of g.headlines) if (h.length > 30) { console.error(`HEADLINE >30 (${h.length}): ${h}`); bad = true }
  for (const d of g.descriptions) if (d.length > 90) { console.error(`DESCRIPTION >90 (${d.length}): ${d}`); bad = true }
}
if (bad) process.exit(1)

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.ROUTE_READY_ADS_CLIENT_ID,
    client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET,
    refresh_token: env.ROUTE_READY_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})
const { access_token } = await tokenRes.json()
if (!access_token) { console.error('FAIL: OAuth refresh failed'); process.exit(1) }

const headers = {
  Authorization: `Bearer ${access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}

async function call(path, body) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) { console.error(`FAIL ${path}:`, JSON.stringify(data, null, 2)); process.exit(1) }
  return data
}

// --- guard: resume if the campaign already exists from a partial run, but only if still PAUSED ---
const existing = await call('/googleAds:search', { query: `SELECT campaign.id, campaign.status FROM campaign WHERE campaign.name = '${CAMPAIGN_NAME}'` })
const existingCamp = existing.results?.[0]?.campaign
if (existingCamp && existingCamp.status !== 'PAUSED') {
  console.error(`Campaign "${CAMPAIGN_NAME}" exists and is ${existingCamp.status} — refusing to modify a live campaign. Aborting.`)
  process.exit(1)
}

// 1. Budget (reuse if a prior partial run already created it)
const priorBudget = await call('/googleAds:search', { query: `SELECT campaign_budget.resource_name FROM campaign_budget WHERE campaign_budget.name = '${CAMPAIGN_NAME} — Budget'` })
let budgetRes = priorBudget.results?.[0]?.campaignBudget?.resourceName
if (budgetRes) {
  console.log('1. Budget reused:', budgetRes)
} else {
  const budget = await call('/campaignBudgets:mutate', {
    operations: [{ create: { name: `${CAMPAIGN_NAME} — Budget`, amountMicros: String(DAILY_BUDGET_MICROS), deliveryMethod: 'STANDARD', explicitlyShared: false } }],
  })
  budgetRes = budget.results[0].resourceName
  console.log('1. Budget created:', budgetRes, `($${DAILY_BUDGET_MICROS / 1e6}/day)`)
}

// 2. Campaign — PAUSED, Search-only, Maximize Clicks with CPC ceiling
let campRes
if (existingCamp) {
  campRes = `customers/${CID}/campaigns/${existingCamp.id}`
  console.log('2. Campaign reused (PAUSED):', campRes)
} else {
  const camp = await call('/campaigns:mutate', {
    operations: [{ create: {
      name: CAMPAIGN_NAME,
      status: 'PAUSED',
      advertisingChannelType: 'SEARCH',
      campaignBudget: budgetRes,
      targetSpend: { cpcBidCeilingMicros: String(CPC_CEILING_MICROS) }, // Maximize Clicks
      networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
      containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
    } }],
  })
  campRes = camp.results[0].resourceName
  console.log('2. Campaign created PAUSED:', campRes)
}

// 3. Campaign criteria: geo = United States, language = English, negatives (skip if already set)
const priorCrit = await call('/googleAds:search', { query: `SELECT campaign_criterion.criterion_id FROM campaign_criterion WHERE campaign.resource_name = '${campRes}'` })
if ((priorCrit.results?.length || 0) > 0) {
  console.log(`3. Criteria already present (${priorCrit.results.length}) — skipped`)
} else {
  const critOps = [
    { create: { campaign: campRes, location: { geoTargetConstant: 'geoTargetConstants/2840' } } },
    { create: { campaign: campRes, language: { languageConstant: 'languageConstants/1000' } } },
    ...CAMPAIGN_NEGATIVES.map(t => ({ create: { campaign: campRes, negative: true, keyword: { text: t, matchType: 'BROAD' } } })),
  ]
  await call('/campaignCriteria:mutate', { operations: critOps })
  console.log(`3. Criteria set: US geo, English, ${CAMPAIGN_NEGATIVES.length} negatives`)
}

// 4-6. Ad groups, keywords, RSAs
for (const g of AD_GROUPS) {
  const priorAg = await call('/googleAds:search', { query: `SELECT ad_group.id FROM ad_group WHERE ad_group.name = '${g.name}' AND campaign.resource_name = '${campRes}'` })
  if (priorAg.results?.length) { console.log(`   Ad group "${g.name}" already exists — skipped`); continue }
  const ag = await call('/adGroups:mutate', {
    operations: [{ create: { name: g.name, campaign: campRes, status: g.status, type: 'SEARCH_STANDARD' } }],
  })
  const agRes = ag.results[0].resourceName

  const kwOps = g.keywords.flatMap(text => [
    { create: { adGroup: agRes, status: 'ENABLED', keyword: { text, matchType: 'EXACT' } } },
    { create: { adGroup: agRes, status: 'ENABLED', keyword: { text, matchType: 'PHRASE' } } },
  ])
  await call('/adGroupCriteria:mutate', { operations: kwOps })

  await call('/adGroupAds:mutate', {
    operations: [{ create: {
      adGroup: agRes,
      status: 'ENABLED',
      ad: {
        finalUrls: [g.url],
        responsiveSearchAd: {
          headlines: g.headlines.map(text => ({ text })),
          descriptions: g.descriptions.map(text => ({ text })),
        },
      },
    } }],
  })
  console.log(`   Ad group "${g.name}" [${g.status}]: ${g.keywords.length} kws x2 match types, 1 RSA -> ${g.url}`)
}

// 7. Conversion action for Gumroad purchase uploads (click uploads, $49 default)
const priorConv = await call('/googleAds:search', { query: `SELECT conversion_action.id FROM conversion_action WHERE conversion_action.name = 'Gumroad Purchase (uploaded)'` })
if (priorConv.results?.length) {
  console.log('7. Conversion action already exists — skipped')
  console.log(`\nDone. Campaign "${CAMPAIGN_NAME}" is built and PAUSED — nothing will spend until it is enabled.`)
  process.exit(0)
}
const conv = await call('/conversionActions:mutate', {
  operations: [{ create: {
    name: 'Gumroad Purchase (uploaded)',
    type: 'UPLOAD_CLICKS',
    category: 'PURCHASE',
    status: 'ENABLED',
    countingType: 'ONE_PER_CLICK',
    valueSettings: { defaultValue: 49, defaultCurrencyCode: 'USD', alwaysUseDefaultValue: false },
    clickThroughLookbackWindowDays: 30,
  } }],
})
console.log('7. Conversion action created:', conv.results[0].resourceName)

console.log(`\nDone. Campaign "${CAMPAIGN_NAME}" is built and PAUSED — nothing will spend until it is enabled.`)
