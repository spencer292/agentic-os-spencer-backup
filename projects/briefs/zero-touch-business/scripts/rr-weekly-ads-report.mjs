#!/usr/bin/env node
// rr-weekly-ads-report.mjs — Route Ready weekly ads manager (ztb-ads-manager cron, step 1b-4).
// Pulls last-14-day search-terms + per-keyword metrics via GAQL, applies ONLY the two
// pre-agreed mutation types (exact negatives for junk search terms, pause zero-conv
// keywords >= $15 spend), and prints a JSON report for the caller to summarize.
//
// Uses ROUTE_READY_ADS_* creds only — never GOOGLE_ADS_*. Account 763-085-7815 via
// MCC 143-307-0544. Mirrors the request pattern from rr-ads-smoke-test.mjs / v23.
//
// Usage: node projects/briefs/zero-touch-business/scripts/rr-weekly-ads-report.mjs [--dry-run]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')
const DRY_RUN = process.argv.includes('--dry-run')

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const REQUIRED = ['ROUTE_READY_ADS_CLIENT_ID', 'ROUTE_READY_ADS_CLIENT_SECRET', 'ROUTE_READY_ADS_REFRESH_TOKEN', 'ROUTE_READY_ADS_DEVELOPER_TOKEN', 'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID', 'ROUTE_READY_ADS_CUSTOMER_ID']
const missing = REQUIRED.filter(k => !env[k])
if (missing.length) { console.error(JSON.stringify({ error: 'missing .env keys', missing })); process.exit(1) }

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID.replace(/-/g, '')
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')

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
const tokenData = await tokenRes.json()
if (!tokenData.access_token) {
  console.error(JSON.stringify({ error: 'AUTH_FAILED', detail: tokenData.error, description: tokenData.error_description || '' }))
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${tokenData.access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}
const API = `https://googleads.googleapis.com/v23/customers/${CID}`

async function gaql(query) {
  const out = []
  let pageToken
  do {
    const body = { query }
    if (pageToken) body.pageToken = pageToken
    const r = await fetch(`${API}/googleAds:search`, { method: 'POST', headers, body: JSON.stringify(body) })
    const j = await r.json()
    if (!r.ok) { console.error(JSON.stringify({ error: 'GAQL_FAILED', status: r.status, detail: j })); process.exit(1) }
    out.push(...(j.results || []))
    pageToken = j.nextPageToken
  } while (pageToken)
  return out
}

async function mutate(service, operations) {
  const r = await fetch(`${API}/${service}:mutate`, {
    method: 'POST', headers,
    body: JSON.stringify({ operations, partialFailure: false }),
  })
  const j = await r.json()
  if (!r.ok) { console.error(JSON.stringify({ error: 'MUTATE_FAILED', service, status: r.status, detail: j })); process.exit(1) }
  return j
}

// ---- 1. per-keyword spend/clicks/conversions, last 14 days ----
const keywordRows = await gaql(`
  SELECT
    campaign.id, campaign.name,
    ad_group.id, ad_group.name,
    ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
    ad_group_criterion.status,
    metrics.cost_micros, metrics.clicks, metrics.conversions, metrics.average_cpc
  FROM keyword_view
  WHERE segments.date DURING LAST_14_DAYS
    AND ad_group_criterion.status != 'REMOVED'
`)

const kwAgg = new Map()
for (const r of keywordRows) {
  const id = r.adGroupCriterion.criterionId
  const key = `${r.adGroup.id}:${id}`
  if (!kwAgg.has(key)) {
    kwAgg.set(key, {
      campaignId: r.campaign.id, campaignName: r.campaign.name,
      adGroupId: r.adGroup.id, adGroupName: r.adGroup.name,
      criterionId: id, text: r.adGroupCriterion.keyword.text, matchType: r.adGroupCriterion.keyword.matchType,
      status: r.adGroupCriterion.status,
      costMicros: 0, clicks: 0, conversions: 0,
    })
  }
  const agg = kwAgg.get(key)
  agg.costMicros += Number(r.metrics.costMicros || 0)
  agg.clicks += Number(r.metrics.clicks || 0)
  agg.conversions += Number(r.metrics.conversions || 0)
}
const keywords = [...kwAgg.values()].map(k => ({ ...k, spend: k.costMicros / 1e6 }))

// ---- 2. account-level spend, last 14 days (for cap trajectory) ----
const spendRows = await gaql(`
  SELECT segments.date, metrics.cost_micros
  FROM customer
  WHERE segments.date DURING LAST_14_DAYS
`)
let last14Micros = 0
for (const r of spendRows) last14Micros += Number(r.metrics.costMicros || 0)
const spendRows7 = await gaql(`
  SELECT segments.date, metrics.cost_micros
  FROM customer
  WHERE segments.date DURING LAST_7_DAYS
`)
let last7Micros = 0
for (const r of spendRows7) last7Micros += Number(r.metrics.costMicros || 0)

// ---- 3. search terms report, last 14 days ----
const searchTermRows = await gaql(`
  SELECT
    search_term_view.search_term, campaign.id, campaign.name, ad_group.id,
    metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
  FROM search_term_view
  WHERE segments.date DURING LAST_14_DAYS
`)

// ---- 4. existing negatives (campaign + ad group level) to avoid duplicate adds ----
const existingNegRows = await gaql(`
  SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type, campaign.id
  FROM campaign_criterion
  WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'
`)
const existingNegatives = new Set(existingNegRows.map(r => r.campaignCriterion.keyword.text.toLowerCase()))

// ---- Mutation candidate detection (report-only unless flagged safe) ----
const JOB_SEEKER_TERMS = /\b(jobs?|hiring|salary|career|employment|indeed|resume|apply)\b/i
const DIY_ZERO_INTENT = /\b(free|diy|template.*free|how to make.*free|tutorial|youtube)\b/i
// homograph guardrail: don't touch anything Route Ready / templates / kit related even if it matches above
const RELEVANT_GUARD = /\b(template|kit|contract|checklist|pricing|price|quote|invoice|route ready|routeready)\b/i

const negativeCandidates = []
for (const r of searchTermRows) {
  const term = r.searchTermView.searchTerm
  const lower = term.toLowerCase()
  if (existingNegatives.has(lower)) continue
  const isJobSeeker = JOB_SEEKER_TERMS.test(term)
  const isDiyZeroIntent = DIY_ZERO_INTENT.test(term) && !RELEVANT_GUARD.test(term)
  if (isJobSeeker || isDiyZeroIntent) {
    negativeCandidates.push({
      term, campaignId: r.campaign.id, campaignName: r.campaign.name, adGroupId: r.adGroup.id,
      reason: isJobSeeker ? 'job-seeker term' : 'DIY/zero-intent informational term',
      impressions: Number(r.metrics.impressions || 0), clicks: Number(r.metrics.clicks || 0),
      cost: Number(r.metrics.costMicros || 0) / 1e6, conversions: Number(r.metrics.conversions || 0),
    })
  }
}
// dedup by term+campaign
const seenNeg = new Set()
const negativesToAdd = negativeCandidates.filter(c => {
  const k = `${c.campaignId}:${c.term.toLowerCase()}`
  if (seenNeg.has(k)) return false
  seenNeg.add(k)
  return true
})

const pauseCandidates = keywords.filter(k => k.status === 'ENABLED' && k.spend >= 15 && k.conversions === 0)

// ---- Apply mutations (unless --dry-run) ----
const mutationsApplied = { negativesAdded: [], keywordsPaused: [], errors: [] }

if (!DRY_RUN) {
  for (const neg of negativesToAdd) {
    try {
      await mutate('campaignCriteria', [{
        create: {
          campaign: `customers/${CID}/campaigns/${neg.campaignId}`,
          negative: true,
          keyword: { text: neg.term, matchType: 'EXACT' },
        },
      }])
      mutationsApplied.negativesAdded.push(neg.term)
    } catch (e) {
      mutationsApplied.errors.push({ type: 'negative', term: neg.term, error: String(e) })
    }
  }
  for (const kw of pauseCandidates) {
    try {
      await mutate('adGroupCriteria', [{
        update: {
          resourceName: `customers/${CID}/adGroupCriteria/${kw.adGroupId}~${kw.criterionId}`,
          status: 'PAUSED',
        },
        updateMask: 'status',
      }])
      mutationsApplied.keywordsPaused.push({ text: kw.text, adGroupName: kw.adGroupName, spend: kw.spend })
    } catch (e) {
      mutationsApplied.errors.push({ type: 'pause', text: kw.text, error: String(e) })
    }
  }
}

console.log(JSON.stringify({
  dryRun: DRY_RUN,
  spendCapTrajectory: {
    monthlyCapUsd: 75,
    last7DaysUsd: +(last7Micros / 1e6).toFixed(2),
    last14DaysUsd: +(last14Micros / 1e6).toFixed(2),
    impliedMonthlyUsd: +((last14Micros / 1e6 / 14) * 30).toFixed(2),
  },
  keywords: keywords.map(k => ({
    text: k.text, matchType: k.matchType, adGroup: k.adGroupName, status: k.status,
    spend: +k.spend.toFixed(2), clicks: k.clicks, conversions: k.conversions,
  })),
  searchTermsTotal: searchTermRows.length,
  negativeCandidates: negativesToAdd,
  pauseCandidates: pauseCandidates.map(k => ({ text: k.text, adGroup: k.adGroupName, spend: +k.spend.toFixed(2), clicks: k.clicks })),
  mutationsApplied,
}, null, 2))
