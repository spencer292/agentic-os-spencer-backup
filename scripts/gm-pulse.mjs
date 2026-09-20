#!/usr/bin/env node
/**
 * gm-pulse.mjs — Got Moles Google Ads consolidated read-only data pull.
 *
 *   node scripts/gm-pulse.mjs --mode daily  --out <dir>
 *   node scripts/gm-pulse.mjs --mode weekly --out <dir>
 *
 * READ-ONLY. GAQL SELECT only — this script never mutates the account.
 * Writes <dir>/pulse.json (raw + derived) and <dir>/pulse.txt (readable).
 *
 * MUST be run from the Agentic OS root (C:\Claude\agent-os-v3\agentic-os) — its
 * .env holds the GOOGLE_ADS_* creds. Running elsewhere gives a false 401.
 *
 * Design notes (why this exists):
 *  - The old daily job read a MONTHLY BUDGET CAP (daily budget x 30.4) as a
 *    smart-bidding problem for three days running. Month-to-date spend vs cap is
 *    the FIRST thing this pull computes.
 *  - The old job judged "waste" on 7-day data; 11 of 21 flagged terms convert
 *    over 90 days. Waste here is ALWAYS gated on 90-day zero conversions.
 *
 * Every section is independently error-handled: a GAQL failure logs and the pull
 * continues. Failed sections appear in derived.errors and in pulse.txt.
 */

import { createClient } from '../.claude/skills/ops-google-ads/scripts/lib/ads-client.mjs'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------- args ------

const argv = process.argv.slice(2)
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback
}
const MODE = (arg('mode', 'daily') || 'daily').toLowerCase()
if (!['daily', 'weekly'].includes(MODE)) {
  console.error(`Bad --mode "${MODE}". Use daily or weekly.`)
  process.exit(1)
}
const CUSTOMER_ID = arg('customer', '1665761172')
const OUT_DIR = path.resolve(arg('out', 'projects/briefs/got-moles-paid-search/.pulse'))
fs.mkdirSync(OUT_DIR, { recursive: true })

// ---------------------------------------------------------------- dates ----

// The account runs on Pacific time. Every window below is a Pacific calendar date.
const TZ = 'America/Los_Angeles'
const fmtPT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const TODAY = fmtPT.format(new Date())            // most recent (partial) day
const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}
const YESTERDAY = addDays(TODAY, -1)              // most recent COMPLETE day
const [TY, TM, TD] = TODAY.split('-').map(Number)
const DAYS_IN_MONTH = new Date(Date.UTC(TY, TM, 0)).getUTCDate()
const MONTH_START = `${TY}-${String(TM).padStart(2, '0')}-01`

const W = {
  d1:   [YESTERDAY, YESTERDAY],
  d7:   [addDays(YESTERDAY, -6), YESTERDAY],
  d14:  [addDays(YESTERDAY, -13), YESTERDAY],
  d30:  [addDays(YESTERDAY, -29), YESTERDAY],
  d90:  [addDays(YESTERDAY, -89), YESTERDAY],
  prev7:[addDays(YESTERDAY, -13), addDays(YESTERDAY, -7)],
  mtd:  [MONTH_START, TODAY],                     // includes today's partial spend
}

// ---------------------------------------------------------------- helpers ---

const $ = n => Number(n || 0) / 1e6
const num = n => Number(n || 0)
const money = n => '$' + num(n).toFixed(2)
const pct = n => (n === null || n === undefined) ? '—' : (num(n) * 100).toFixed(1) + '%'
const cpl = (cost, conv) => conv > 0 ? cost / conv : null
const cplStr = (cost, conv) => conv > 0 ? money(cost / conv) : '—'
const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n)
const padL = (s, n) => String(s ?? '').padStart(n)
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const raw = {}
const errors = []

const client = await createClient({ customerId: CUSTOMER_ID })

/** Run one named GAQL section. Never throws — logs, records, continues. */
async function q(name, gaql) {
  try {
    const rows = await client.gaql(gaql)
    raw[name] = rows
    console.log(`OK   ${name}: ${rows.length} rows`)
    return rows
  } catch (e) {
    const msg = String(e.message || e).replace(/\s+/g, ' ').slice(0, 400)
    raw[name] = { ERROR: msg }
    errors.push({ section: name, error: msg })
    console.log(`FAIL ${name}: ${msg}`)
    return []
  }
}

/** Try queries in order; first one that returns wins. Used where a field may not exist. */
async function qFallback(name, queries) {
  for (let i = 0; i < queries.length; i++) {
    try {
      const rows = await client.gaql(queries[i])
      raw[name] = rows
      console.log(`OK   ${name}: ${rows.length} rows${i ? ` (fallback ${i})` : ''}`)
      return rows
    } catch (e) {
      if (i === queries.length - 1) {
        const msg = String(e.message || e).replace(/\s+/g, ' ').slice(0, 400)
        raw[name] = { ERROR: msg }
        errors.push({ section: name, error: msg })
        console.log(`FAIL ${name}: ${msg}`)
        return []
      }
    }
  }
  return []
}

const rowsOf = k => Array.isArray(raw[k]) ? raw[k] : []

const METRICS = `metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
  metrics.average_cpc, metrics.conversions, metrics.all_conversions, metrics.conversions_value,
  metrics.search_impression_share, metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share, metrics.search_absolute_top_impression_share,
  metrics.absolute_top_impression_percentage, metrics.top_impression_percentage`

console.log(`\n=== GM PULSE — mode=${MODE} customer=${CUSTOMER_ID} ===`)
console.log(`Pacific today ${TODAY} | last complete day ${YESTERDAY}`)
console.log(`Windows: 7d ${W.d7.join('..')} | 30d ${W.d30.join('..')} | 90d ${W.d90.join('..')} | MTD ${W.mtd.join('..')}\n`)

// ============================================================== SECTION 1 ===
// Account, campaigns, budgets, bidding, change events.

await q('customer', `
  SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
         customer.optimization_score, customer.auto_tagging_enabled, customer.status,
         customer.conversion_tracking_setting.conversion_tracking_id,
         customer.conversion_tracking_setting.conversion_tracking_status,
         customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled
  FROM customer`)

await q('campaigns', `
  SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status,
         campaign.advertising_channel_type, campaign.bidding_strategy_type,
         campaign.maximize_conversions.target_cpa_micros,
         campaign.target_cpa.target_cpa_micros,
         campaign.optimization_score,
         campaign.network_settings.target_google_search,
         campaign.network_settings.target_search_network,
         campaign.network_settings.target_content_network,
         campaign.geo_target_type_setting.positive_geo_target_type,
         campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros,
         campaign_budget.delivery_method, campaign_budget.explicitly_shared,
         campaign_budget.status, campaign_budget.has_recommended_budget,
         campaign_budget.recommended_budget_amount_micros
  FROM campaign WHERE campaign.status != 'REMOVED'`)

await q('changeEvents14d', `
  SELECT change_event.change_date_time, change_event.change_resource_type,
         change_event.resource_change_operation, change_event.changed_fields,
         change_event.client_type, change_event.user_email, change_event.campaign,
         change_event.ad_group, change_event.change_resource_name
  FROM change_event
  WHERE change_event.change_date_time >= '${addDays(TODAY, -14)} 00:00:00'
    AND change_event.change_date_time <= '${TODAY} 23:59:59'
  ORDER BY change_event.change_date_time DESC
  LIMIT 500`)

// ============================================================== SECTION 2 ===
// Month-to-date spend, per campaign and account, for the monthly-cap maths.

await q('mtd_campaign', `
  SELECT campaign.id, campaign.name, campaign.status,
         metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
  FROM campaign WHERE segments.date BETWEEN '${W.mtd[0]}' AND '${W.mtd[1]}'`)

await q('mtd_daily', `
  SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros, metrics.conversions
  FROM campaign WHERE segments.date BETWEEN '${W.mtd[0]}' AND '${W.mtd[1]}'
  ORDER BY segments.date`)

// Prior month, for the "does this repeat every month" read.
const PREV_MONTH_END = addDays(MONTH_START, -1)
const PREV_MONTH_START = PREV_MONTH_END.slice(0, 8) + '01'
await q('prev_month_campaign', `
  SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.conversions
  FROM campaign WHERE segments.date BETWEEN '${PREV_MONTH_START}' AND '${PREV_MONTH_END}'`)

// ============================================================== SECTION 3 ===
// Per-day table, last 14 days, per campaign.

await q('daily_14d', `
  SELECT segments.date, campaign.id, campaign.name, ${METRICS}
  FROM campaign WHERE segments.date BETWEEN '${W.d14[0]}' AND '${W.d14[1]}'
  ORDER BY segments.date`)

// ============================================================== SECTION 4 ===
// 7 / prev7 / 30 / 90 day totals per campaign.

for (const k of ['d7', 'prev7', 'd30', 'd90']) {
  await q(`campaign_${k}`, `
    SELECT campaign.id, campaign.name, campaign.status, ${METRICS}
    FROM campaign WHERE segments.date BETWEEN '${W[k][0]}' AND '${W[k][1]}'`)
}

// Conversions by conversion action, 30d. NOTE: segmenting a conversion_action
// subquery off the conversion_action resource throws PROHIBITED_METRIC_IN_SELECT —
// segment the CAMPAIGN resource instead. This shape is verified working on v24.
await q('conv_by_action_30d', `
  SELECT segments.conversion_action, segments.conversion_action_name,
         segments.conversion_action_category, campaign.name,
         metrics.all_conversions, metrics.conversions, metrics.all_conversions_value
  FROM campaign WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

// ============================================================== SECTION 5 ===
// Search terms 7d + 90d (joined by term downstream).

for (const k of ['d7', 'd90']) {
  await q(`search_terms_${k}`, `
    SELECT search_term_view.search_term, search_term_view.status,
           campaign.name, ad_group.name,
           segments.search_term_match_type, segments.keyword.info.text,
           segments.keyword.info.match_type,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.all_conversions, metrics.average_cpc
    FROM search_term_view WHERE segments.date BETWEEN '${W[k][0]}' AND '${W[k][1]}'`)
}

// ============================================================== SECTION 6 ===
// Keyword ladder — state (QS, match, status) + performance 30d/90d.

await q('keywords_state', `
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
         ad_group_criterion.criterion_id, ad_group_criterion.keyword.text,
         ad_group_criterion.keyword.match_type, ad_group_criterion.status,
         ad_group_criterion.system_serving_status, ad_group_criterion.approval_status,
         ad_group_criterion.final_urls, ad_group_criterion.effective_cpc_bid_micros,
         ad_group_criterion.quality_info.quality_score,
         ad_group_criterion.quality_info.creative_quality_score,
         ad_group_criterion.quality_info.post_click_quality_score,
         ad_group_criterion.quality_info.search_predicted_ctr
  FROM ad_group_criterion
  WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'
    AND ad_group_criterion.negative = false`)

for (const k of ['d30', 'd90']) {
  // NOTE (v24): keyword_view supports search_impression_share, search_rank_lost_impression_share
  // and top/abs-top IS, but NOT search_budget_lost_impression_share. Budget-lost IS is
  // CAMPAIGN-LEVEL ONLY in v24 (prohibited on ad_group and keyword_view) — it is reported in the
  // campaign totals, and the monthly-cap section is the correct place to interpret it.
  await qFallback(`keyword_perf_${k}`, [
    `SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
            metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
            metrics.average_cpc, metrics.conversions, metrics.all_conversions,
            metrics.search_impression_share, metrics.search_rank_lost_impression_share,
            metrics.search_absolute_top_impression_share,
            metrics.absolute_top_impression_percentage
     FROM keyword_view WHERE segments.date BETWEEN '${W[k][0]}' AND '${W[k][1]}'`,
    `SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
            metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
            metrics.average_cpc, metrics.conversions, metrics.all_conversions,
            metrics.absolute_top_impression_percentage
     FROM keyword_view WHERE segments.date BETWEEN '${W[k][0]}' AND '${W[k][1]}'`,
  ])
}

// Ad-group impression share, 30d + 90d — shows WHICH ad groups are losing share and
// how much headroom each has. Budget-lost IS is campaign-level only in v24, so it is not here.
for (const k of ['d30', 'd90']) {
  await q(`adgroup_is_${k}`, `
    SELECT campaign.name, ad_group.id, ad_group.name, ad_group.status,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.average_cpc,
           metrics.search_impression_share,
           metrics.search_rank_lost_impression_share,
           metrics.search_absolute_top_impression_share
    FROM ad_group WHERE segments.date BETWEEN '${W[k][0]}' AND '${W[k][1]}'
      AND ad_group.status != 'REMOVED'`)
}

// ============================================================== SECTION 7 ===
// Geo 30d — geographic_view by city, location of presence.

await q('geo_30d', `
  SELECT campaign.name, geographic_view.country_criterion_id, geographic_view.location_type,
         segments.geo_target_city, segments.geo_target_county,
         metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
  FROM geographic_view WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

// Resolve city resource names -> readable names.
{
  const ids = [...new Set(rowsOf('geo_30d')
    .map(r => r.segments?.geoTargetCity)
    .filter(Boolean))]
  if (ids.length) {
    const inList = ids.map(r => `'${r}'`).join(',')
    await q('geo_names', `
      SELECT geo_target_constant.resource_name, geo_target_constant.name,
             geo_target_constant.canonical_name, geo_target_constant.target_type
      FROM geo_target_constant WHERE geo_target_constant.resource_name IN (${inList})`)
  } else {
    raw.geo_names = []
  }
}

// ========================================================= WEEKLY EXTRAS ====

if (MODE === 'weekly') {
  await q('ads_state', `
    SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
           ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.status,
           ad_group_ad.ad_strength, ad_group_ad.policy_summary.approval_status,
           ad_group_ad.policy_summary.review_status,
           ad_group_ad.policy_summary.policy_topic_entries,
           ad_group_ad.ad.final_urls,
           ad_group_ad.ad.responsive_search_ad.headlines,
           ad_group_ad.ad.responsive_search_ad.descriptions,
           ad_group_ad.ad.responsive_search_ad.path1,
           ad_group_ad.ad.responsive_search_ad.path2
    FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED' AND campaign.status != 'REMOVED'`)

  await q('ads_perf_30d', `
    SELECT campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
           metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
           metrics.average_cpc, metrics.conversions
    FROM ad_group_ad WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

  await q('campaign_assets', `
    SELECT campaign.id, campaign.name, campaign_asset.field_type, campaign_asset.status,
           asset.id, asset.name, asset.type,
           asset.sitelink_asset.link_text, asset.sitelink_asset.description1,
           asset.callout_asset.callout_text,
           asset.structured_snippet_asset.header, asset.structured_snippet_asset.values,
           asset.call_asset.phone_number
    FROM campaign_asset`)

  await q('asset_perf_30d', `
    SELECT campaign.name, asset.id, asset.type, campaign_asset.field_type,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM campaign_asset WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

  await q('conversion_actions', `
    SELECT conversion_action.id, conversion_action.name, conversion_action.status,
           conversion_action.type, conversion_action.category,
           conversion_action.primary_for_goal, conversion_action.counting_type,
           conversion_action.click_through_lookback_window_days,
           conversion_action.include_in_conversions_metric,
           conversion_action.origin
    FROM conversion_action`)

  // Last conversion date per action (90d) — the tracking-health signal.
  await q('conv_action_daily_90d', `
    SELECT segments.date, segments.conversion_action_name,
           metrics.all_conversions, metrics.conversions
    FROM campaign WHERE segments.date BETWEEN '${W.d90[0]}' AND '${W.d90[1]}'`)

  await q('user_lists', `
    SELECT user_list.id, user_list.name, user_list.type, user_list.membership_status,
           user_list.size_for_search, user_list.size_for_display,
           user_list.eligible_for_search, user_list.eligible_for_display,
           user_list.membership_life_span
    FROM user_list`)

  await q('shared_sets', `
    SELECT shared_set.id, shared_set.name, shared_set.type, shared_set.status,
           shared_set.member_count, shared_set.reference_count
    FROM shared_set`)

  await q('campaign_shared_sets', `
    SELECT campaign.id, campaign.name, shared_set.id, shared_set.name,
           shared_set.type, campaign_shared_set.status
    FROM campaign_shared_set`)

  await q('campaign_negatives', `
    SELECT campaign.id, campaign.name, campaign_criterion.criterion_id,
           campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'`)

  await q('dayofweek_30d', `
    SELECT segments.day_of_week, campaign.name, metrics.cost_micros, metrics.clicks,
           metrics.impressions, metrics.conversions
    FROM campaign WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

  await q('hourofday_30d', `
    SELECT segments.hour, campaign.name, metrics.cost_micros, metrics.clicks,
           metrics.impressions, metrics.conversions
    FROM campaign WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

  await q('device_30d', `
    SELECT segments.device, campaign.name, metrics.cost_micros, metrics.impressions,
           metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions
    FROM campaign WHERE segments.date BETWEEN '${W.d30[0]}' AND '${W.d30[1]}'`)

  await q('recommendations', `
    SELECT recommendation.type, recommendation.campaign, recommendation.dismissed,
           recommendation.resource_name
    FROM recommendation`)
}

// ============================================================== DERIVE ======

const derived = {
  mode: MODE,
  customerId: CUSTOMER_ID,
  generatedAt: new Date().toISOString(),
  pacificToday: TODAY,
  lastCompleteDay: YESTERDAY,
  windows: W,
  errors,
}

// --- campaigns / budgets ---------------------------------------------------

const campaigns = rowsOf('campaigns').map(r => ({
  id: r.campaign.id,
  name: r.campaign.name,
  status: r.campaign.status,
  servingStatus: r.campaign.servingStatus,
  bidding: r.campaign.biddingStrategyType,
  tcpa: $(r.campaign.maximizeConversions?.targetCpaMicros || r.campaign.targetCpa?.targetCpaMicros) || null,
  budgetId: r.campaignBudget?.id,
  budgetName: r.campaignBudget?.name,
  dailyBudget: $(r.campaignBudget?.amountMicros),
  budgetShared: !!r.campaignBudget?.explicitlyShared,
  delivery: r.campaignBudget?.deliveryMethod,
  recommendedBudget: r.campaignBudget?.hasRecommendedBudget
    ? $(r.campaignBudget?.recommendedBudgetAmountMicros) : null,
  optimizationScore: r.campaign.optimizationScore ?? null,
}))
derived.campaigns = campaigns
const enabled = campaigns.filter(c => c.status === 'ENABLED')
const nameById = Object.fromEntries(campaigns.map(c => [c.id, c.name]))

// --- MONTHLY CAP PACING (the #1 thing the old job lacked) ------------------
//
// Google enforces a monthly ceiling of (average daily budget x 30.4). Spend that
// looks like a bidding collapse late in the month is usually this cap.

const CAP_MULTIPLIER = 30.4
const mtdByCampaign = {}
for (const r of rowsOf('mtd_campaign')) {
  const id = r.campaign.id
  mtdByCampaign[id] = mtdByCampaign[id] || { id, name: r.campaign.name, spend: 0, conv: 0, clicks: 0, impr: 0 }
  mtdByCampaign[id].spend += $(r.metrics.costMicros)
  mtdByCampaign[id].conv += num(r.metrics.conversions)
  mtdByCampaign[id].clicks += num(r.metrics.clicks)
  mtdByCampaign[id].impr += num(r.metrics.impressions)
}

// Daily spend run-rate from the last 7 complete days, used to project the cap-hit date.
const spend7 = rowsOf('campaign_d7').reduce((a, r) => a + $(r.metrics.costMicros), 0)
const runRateAcct = spend7 / 7

const daysElapsed = TD                 // today counts as elapsed (partial)
const daysRemaining = DAYS_IN_MONTH - TD + 1
const expectedFrac = daysElapsed / DAYS_IN_MONTH

function pacingFor(label, cap, mtd, runRate) {
  const expected = cap * expectedFrac
  const overBy = cap > 0 ? (mtd - expected) / cap : 0
  const remaining = cap - mtd
  const allowancePerDay = daysRemaining > 0 ? remaining / daysRemaining : 0
  let capHitDate = null
  if (runRate > 0 && remaining > 0) {
    const daysToCap = remaining / runRate
    if (daysToCap <= daysRemaining) capHitDate = addDays(TODAY, Math.floor(daysToCap))
  } else if (remaining <= 0) {
    capHitDate = TODAY // already there
  }
  return {
    label,
    monthlyCap: cap,
    mtdSpend: mtd,
    consumedPct: cap > 0 ? mtd / cap : null,
    expectedByNow: expected,
    aheadOfPaceBy: overBy,                       // fraction of cap; >0.05 = flag
    pacingFlag: cap > 0 && overBy > 0.05,
    remainingAllowance: remaining,
    daysRemaining,
    allowancePerDay,
    dailyRunRate7d: runRate,
    projectedCapHitDate: capHitDate,
  }
}

const perCampaignPacing = enabled.map(c => {
  const mtd = mtdByCampaign[c.id]?.spend || 0
  // Per-campaign run rate from the same 7-day window.
  const rr = rowsOf('campaign_d7')
    .filter(r => r.campaign.id === c.id)
    .reduce((a, r) => a + $(r.metrics.costMicros), 0) / 7
  return { ...pacingFor(c.name, c.dailyBudget * CAP_MULTIPLIER, mtd, rr), campaignId: c.id, dailyBudget: c.dailyBudget }
})

// Account cap = sum of DISTINCT budgets across enabled campaigns (shared budgets counted once).
const seenBudget = new Set()
let acctDaily = 0
for (const c of enabled) {
  if (c.budgetId && seenBudget.has(c.budgetId)) continue
  if (c.budgetId) seenBudget.add(c.budgetId)
  acctDaily += c.dailyBudget
}
const mtdAcct = Object.values(mtdByCampaign).reduce((a, c) => a + c.spend, 0)

derived.monthPacing = {
  month: `${TY}-${String(TM).padStart(2, '0')}`,
  daysInMonth: DAYS_IN_MONTH,
  dayOfMonth: TD,
  capMultiplier: CAP_MULTIPLIER,
  account: {
    ...pacingFor('ACCOUNT', acctDaily * CAP_MULTIPLIER, mtdAcct, runRateAcct),
    sumEnabledDailyBudgets: acctDaily,
  },
  perCampaign: perCampaignPacing,
  priorMonth: (() => {
    const byId = {}
    for (const r of rowsOf('prev_month_campaign')) {
      const id = r.campaign.id
      byId[id] = byId[id] || { name: r.campaign.name, spend: 0, conv: 0 }
      byId[id].spend += $(r.metrics.costMicros)
      byId[id].conv += num(r.metrics.conversions)
    }
    // REMOVED campaigns still return $0 rows — drop them.
    return {
      window: [PREV_MONTH_START, PREV_MONTH_END],
      campaigns: Object.values(byId).filter(c => c.spend > 0).sort((a, b) => b.spend - a.spend),
    }
  })(),
  mtdDaily: rowsOf('mtd_daily').map(r => ({
    date: r.segments.date, campaign: r.campaign.name,
    spend: $(r.metrics.costMicros), conv: num(r.metrics.conversions),
  })),
}

// --- per-day 14d table -----------------------------------------------------

derived.daily14 = rowsOf('daily_14d').map(r => {
  const m = r.metrics
  const cost = $(m.costMicros), conv = num(m.conversions)
  return {
    date: r.segments.date,
    campaignId: r.campaign.id,
    campaign: r.campaign.name,
    spend: cost,
    impressions: num(m.impressions),
    clicks: num(m.clicks),
    ctr: num(m.ctr),
    avgCpc: $(m.averageCpc),
    conversions: conv,
    allConversions: num(m.allConversions),
    cpl: cpl(cost, conv),
    searchIS: m.searchImpressionShare ?? null,
    budgetLostIS: m.searchBudgetLostImpressionShare ?? null,
    rankLostIS: m.searchRankLostImpressionShare ?? null,
    absTopPct: m.absoluteTopImpressionPercentage ?? null,
  }
}).sort((a, b) => a.date.localeCompare(b.date) || a.campaign.localeCompare(b.campaign))

// Account-level per-day roll-up (backfill caveat reads off this).
const daily14Acct = {}
for (const d of derived.daily14) {
  const x = daily14Acct[d.date] = daily14Acct[d.date] || { date: d.date, spend: 0, clicks: 0, impressions: 0, conversions: 0 }
  x.spend += d.spend; x.clicks += d.clicks; x.impressions += d.impressions; x.conversions += d.conversions
}
derived.daily14Account = Object.values(daily14Acct)
  .map(d => ({ ...d, cpl: cpl(d.spend, d.conversions) }))
  .sort((a, b) => a.date.localeCompare(b.date))

// --- window totals ---------------------------------------------------------

function totals(key) {
  const byCamp = {}
  let acct = { spend: 0, impressions: 0, clicks: 0, conversions: 0, allConversions: 0 }
  for (const r of rowsOf(`campaign_${key}`)) {
    const m = r.metrics, id = r.campaign.id
    const c = byCamp[id] = byCamp[id] || {
      campaignId: id, campaign: r.campaign.name, status: r.campaign.status,
      spend: 0, impressions: 0, clicks: 0, conversions: 0, allConversions: 0,
      searchIS: m.searchImpressionShare ?? null,
      budgetLostIS: m.searchBudgetLostImpressionShare ?? null,
      rankLostIS: m.searchRankLostImpressionShare ?? null,
      absTopPct: m.absoluteTopImpressionPercentage ?? null,
    }
    c.spend += $(m.costMicros); c.impressions += num(m.impressions)
    c.clicks += num(m.clicks); c.conversions += num(m.conversions)
    c.allConversions += num(m.allConversions)
    acct.spend += $(m.costMicros); acct.impressions += num(m.impressions)
    acct.clicks += num(m.clicks); acct.conversions += num(m.conversions)
    acct.allConversions += num(m.allConversions)
  }
  for (const c of Object.values(byCamp)) {
    c.avgCpc = c.clicks ? c.spend / c.clicks : 0
    c.ctr = c.impressions ? c.clicks / c.impressions : 0
    c.cpl = cpl(c.spend, c.conversions)
  }
  acct.avgCpc = acct.clicks ? acct.spend / acct.clicks : 0
  acct.ctr = acct.impressions ? acct.clicks / acct.impressions : 0
  acct.cpl = cpl(acct.spend, acct.conversions)
  // REMOVED campaigns return $0/0-impression rows — keep only those that actually ran.
  const live = Object.values(byCamp).filter(c => c.spend > 0 || c.impressions > 0)
  return { window: W[key], account: acct, campaigns: live.sort((a, b) => b.spend - a.spend) }
}
derived.totals = { d7: totals('d7'), prev7: totals('prev7'), d30: totals('d30'), d90: totals('d90') }

// Conversions by action, 30d.
{
  const byAction = {}
  for (const r of rowsOf('conv_by_action_30d')) {
    const name = r.segments?.conversionActionName || r.segments?.conversionAction || '(unknown)'
    const a = byAction[name] = byAction[name] || {
      action: name, category: r.segments?.conversionActionCategory || null,
      conversions: 0, allConversions: 0,
    }
    a.conversions += num(r.metrics.conversions)
    a.allConversions += num(r.metrics.allConversions)
  }
  derived.conversionsByAction30d = Object.values(byAction).sort((a, b) => b.allConversions - a.allConversions)
}

// --- search terms: 7d joined to 90d ---------------------------------------
//
// WASTE RULE (hard): a term is waste only if it spent >$15 in 7d AND took ZERO
// conversions across the full 90-day window. 11 of 21 terms on the old 7-day-only
// waste list convert over 90 days — negating off 7 days cuts converting traffic.

const WASTE_7D_COST = 15

function foldTerms(key) {
  const by = {}
  for (const r of rowsOf(key)) {
    const t = r.searchTermView?.searchTerm || r.searchTermView?.searchText || ''
    if (!t) continue
    const k = norm(t)
    const x = by[k] = by[k] || {
      term: t, campaigns: new Set(), matchedKeywords: new Set(),
      spend: 0, impressions: 0, clicks: 0, conversions: 0, allConversions: 0,
    }
    if (r.campaign?.name) x.campaigns.add(r.campaign.name)
    if (r.segments?.keyword?.info?.text) x.matchedKeywords.add(r.segments.keyword.info.text)
    x.spend += $(r.metrics.costMicros); x.impressions += num(r.metrics.impressions)
    x.clicks += num(r.metrics.clicks); x.conversions += num(r.metrics.conversions)
    x.allConversions += num(r.metrics.allConversions)
  }
  for (const x of Object.values(by)) {
    x.campaigns = [...x.campaigns]; x.matchedKeywords = [...x.matchedKeywords]
  }
  return by
}
const st7 = foldTerms('search_terms_d7')
const st90 = foldTerms('search_terms_d90')

const wasteTerms = []
const protectedTerms = []   // >$15 in 7d, 0 conv in 7d, but DID convert in 90d — never negate
for (const [k, t7] of Object.entries(st7)) {
  if (t7.spend <= WASTE_7D_COST) continue
  const t90 = st90[k]
  const conv90 = t90 ? t90.conversions : t7.conversions
  const spend90 = t90 ? t90.spend : t7.spend
  const rec = {
    term: t7.term, campaigns: t7.campaigns, matchedKeywords: t7.matchedKeywords,
    spend7d: t7.spend, clicks7d: t7.clicks, conv7d: t7.conversions,
    spend90d: spend90, conv90d: conv90, cpl90d: cpl(spend90, conv90),
  }
  if (conv90 === 0) wasteTerms.push(rec)
  else if (t7.conversions === 0) protectedTerms.push(rec)
}
derived.waste = {
  rule: `7d spend > $${WASTE_7D_COST} AND zero conversions across the full 90d window (${W.d90.join('..')})`,
  terms: wasteTerms.sort((a, b) => b.spend7d - a.spend7d),
  protectedByNinetyDay: protectedTerms.sort((a, b) => b.conv90d - a.conv90d),
}

// New converting terms that are not yet keywords anywhere.
{
  const kwSet = new Set(rowsOf('keywords_state')
    .map(r => norm(r.adGroupCriterion?.keyword?.text)).filter(Boolean))
  const out = []
  for (const [k, t] of Object.entries(st90)) {
    if (t.conversions <= 0) continue
    if (kwSet.has(k)) continue
    out.push({
      term: t.term, spend90d: t.spend, clicks90d: t.clicks,
      conv90d: t.conversions, cpl90d: cpl(t.spend, t.conversions),
      campaigns: t.campaigns, caughtBy: t.matchedKeywords,
      convertedIn7d: (st7[k]?.conversions || 0) > 0,
    })
  }
  derived.newConvertingTerms = out.sort((a, b) => b.conv90d - a.conv90d)
}

// --- keyword ladder --------------------------------------------------------

{
  const state = {}
  for (const r of rowsOf('keywords_state')) {
    const id = r.adGroupCriterion?.criterionId
    if (!id) continue
    state[id] = {
      text: r.adGroupCriterion.keyword?.text,
      matchType: r.adGroupCriterion.keyword?.matchType,
      status: r.adGroupCriterion.status,
      servingStatus: r.adGroupCriterion.systemServingStatus,
      campaign: r.campaign?.name,
      adGroup: r.adGroup?.name,
      qs: r.adGroupCriterion.qualityInfo?.qualityScore ?? null,
      qsCreative: r.adGroupCriterion.qualityInfo?.creativeQualityScore ?? null,
      qsLanding: r.adGroupCriterion.qualityInfo?.postClickQualityScore ?? null,
      qsExpectedCtr: r.adGroupCriterion.qualityInfo?.searchPredictedCtr ?? null,
      finalUrls: r.adGroupCriterion.finalUrls || [],
    }
  }
  function ladder(key) {
    const by = {}
    for (const r of rowsOf(`keyword_perf_${key}`)) {
      const id = r.adGroupCriterion?.criterionId
      if (!id) continue
      const m = r.metrics
      const x = by[id] = by[id] || {
        criterionId: id,
        text: r.adGroupCriterion.keyword?.text || state[id]?.text,
        matchType: r.adGroupCriterion.keyword?.matchType || state[id]?.matchType,
        campaign: r.campaign?.name, adGroup: r.adGroup?.name,
        spend: 0, impressions: 0, clicks: 0, conversions: 0,
        // Budget-lost IS does not exist at keyword level in v24 — see derived.adGroupIS.
        searchIS: m.searchImpressionShare ?? null,
        rankLostIS: m.searchRankLostImpressionShare ?? null,
        absTopIS: m.searchAbsoluteTopImpressionShare ?? null,
        ...(state[id] ? {
          status: state[id].status, servingStatus: state[id].servingStatus,
          qs: state[id].qs, qsCreative: state[id].qsCreative,
          qsLanding: state[id].qsLanding, qsExpectedCtr: state[id].qsExpectedCtr,
        } : {}),
      }
      x.spend += $(m.costMicros); x.impressions += num(m.impressions)
      x.clicks += num(m.clicks); x.conversions += num(m.conversions)
    }
    const all = Object.values(by).map(x => ({ ...x, cpl: cpl(x.spend, x.conversions) }))
      .filter(x => x.spend > 0 || x.impressions > 0)
    const spenders = all.filter(x => x.spend > 0)
    return {
      window: W[key],
      all: all.sort((a, b) => b.spend - a.spend),
      bestCpl: spenders.filter(x => x.conversions > 0).sort((a, b) => a.cpl - b.cpl).slice(0, 10),
      worstCplBySpend: spenders.sort((a, b) => b.spend - a.spend).slice(0, 40)
        .sort((a, b) => (b.cpl ?? Infinity) - (a.cpl ?? Infinity)).slice(0, 10),
      zeroConvSpenders: spenders.filter(x => x.conversions === 0).sort((a, b) => b.spend - a.spend).slice(0, 20),
    }
  }
  derived.keywordLadder = { d30: ladder('d30'), d90: ladder('d90') }
}

// Ad-group impression share — where budget-lost IS actually lives.
{
  const foldAg = key => {
    const by = {}
    for (const r of rowsOf(`adgroup_is_${key}`)) {
      const id = r.adGroup?.id
      if (!id) continue
      const m = r.metrics
      const x = by[id] = by[id] || {
        adGroupId: id, adGroup: r.adGroup.name, campaign: r.campaign?.name,
        status: r.adGroup.status, spend: 0, impressions: 0, clicks: 0, conversions: 0,
        searchIS: m.searchImpressionShare ?? null,
        rankLostIS: m.searchRankLostImpressionShare ?? null,
        absTopIS: m.searchAbsoluteTopImpressionShare ?? null,
      }
      x.spend += $(m.costMicros); x.impressions += num(m.impressions)
      x.clicks += num(m.clicks); x.conversions += num(m.conversions)
    }
    return Object.values(by).map(x => ({ ...x, cpl: cpl(x.spend, x.conversions) }))
      .sort((a, b) => b.spend - a.spend)
  }
  derived.adGroupIS = { d30: foldAg('d30'), d90: foldAg('d90') }
  derived.zeroImpressionAdGroups30d = derived.adGroupIS.d30
    .filter(a => a.impressions === 0 && a.status === 'ENABLED')
    .map(a => ({ campaign: a.campaign, adGroup: a.adGroup }))
}

// --- geo -------------------------------------------------------------------

{
  const names = {}
  for (const r of rowsOf('geo_names')) {
    names[r.geoTargetConstant.resourceName] = r.geoTargetConstant.canonicalName || r.geoTargetConstant.name
  }
  const by = {}
  for (const r of rowsOf('geo_30d')) {
    if (r.geographicView?.locationType && r.geographicView.locationType !== 'LOCATION_OF_PRESENCE') continue
    const res = r.segments?.geoTargetCity || '(unknown)'
    const key = res
    // canonicalName is "Seattle,Washington,United States" — keep "Seattle, WA".
    const canon = names[res] || res.replace('geoTargetConstants/', 'geo:')
    const parts = canon.split(',').map(s => s.trim())
    const short = parts.length >= 2 ? `${parts[0]}, ${parts[1].replace(/^Washington$/, 'WA')}` : canon
    const x = by[key] = by[key] || {
      city: short, canonicalName: canon,
      resource: res, spend: 0, impressions: 0, clicks: 0, conversions: 0,
    }
    x.spend += $(r.metrics.costMicros); x.impressions += num(r.metrics.impressions)
    x.clicks += num(r.metrics.clicks); x.conversions += num(r.metrics.conversions)
  }
  const all = Object.values(by).map(x => ({ ...x, cpl: cpl(x.spend, x.conversions) }))
    .sort((a, b) => b.spend - a.spend)
  derived.geo30d = {
    window: W.d30,
    top25BySpend: all.slice(0, 25),
    over100Cpl: all.filter(x => x.cpl !== null && x.cpl > 100),
    zeroConvOver50: all.filter(x => x.conversions === 0 && x.spend > 50),
  }
}

// --- change events ---------------------------------------------------------

const KNOWN_ACTORS = ['roy@atpbos.com', 'roy@allthepower.co.uk']
derived.changeEvents14d = rowsOf('changeEvents14d').map(r => {
  const e = r.changeEvent
  const campId = (e.campaign || '').split('/').pop()
  return {
    when: e.changeDateTime,
    resourceType: e.changeResourceType,
    operation: e.resourceChangeOperation,
    changedFields: e.changedFields,
    clientType: e.clientType,
    userEmail: e.userEmail,
    campaign: nameById[campId] || e.campaign || null,
    resource: e.changeResourceName,
    unknownActor: !KNOWN_ACTORS.includes(String(e.userEmail || '').toLowerCase()),
  }
})

// A single scripted batch (e.g. adding 61 negatives) produces dozens of near-identical
// events. Group them so the report shows "61 x CAMPAIGN_CRITERION CREATE", not 61 lines.
{
  const g = {}
  for (const c of derived.changeEvents14d) {
    const day = String(c.when || '').slice(0, 10)
    const k = [day, c.resourceType, c.operation, c.campaign, c.userEmail, c.clientType].join('|')
    const x = g[k] = g[k] || {
      date: day, resourceType: c.resourceType, operation: c.operation,
      campaign: c.campaign, userEmail: c.userEmail, clientType: c.clientType,
      unknownActor: c.unknownActor, count: 0, firstSeen: c.when, lastSeen: c.when,
      sampleFields: c.changedFields,
    }
    x.count++
    if (c.when < x.firstSeen) x.firstSeen = c.when
    if (c.when > x.lastSeen) x.lastSeen = c.when
  }
  derived.changeEventGroups14d = Object.values(g).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
}

// --- flag inputs (the daily job turns these into flags) --------------------

{
  const acct14 = derived.daily14Account
  const last = acct14[acct14.length - 1] || null
  // Consecutive cold days, walking backwards from the last complete day.
  let coldRun = 0
  for (let i = acct14.length - 1; i >= 0; i--) {
    if (acct14[i].conversions === 0 && acct14[i].spend > 50) coldRun++
    else break
  }
  const brand = derived.totals.d7.campaigns.find(c => /brand/i.test(c.campaign)) || null
  const brandDay = derived.daily14.filter(d => /brand/i.test(d.campaign)).slice(-1)[0] || null
  const cpl7 = derived.totals.d7.account.cpl
  const cpl30 = derived.totals.d30.account.cpl
  derived.flagInputs = {
    lastCompleteDay: last,
    coldDay: last ? (last.conversions === 0 && last.spend > 50) : false,
    consecutiveColdDays: coldRun,
    backfillCaveatApplies: last ? last.conversions === 0 : false,
    brandBleed7d: brand ? (brand.spend > 15 && brand.conversions === 0) : false,
    brandDayBleed: brandDay ? (brandDay.spend > 15 && brandDay.conversions === 0) : false,
    cpl7d: cpl7, cpl30d: cpl30,
    cplSpikeVs30d: (cpl7 && cpl30) ? (cpl7 - cpl30) / cpl30 : null,
    budgetLostIS7d: derived.totals.d7.campaigns.map(c => ({ campaign: c.campaign, budgetLostIS: c.budgetLostIS, rankLostIS: c.rankLostIS })),
    wasteTermCount: derived.waste.terms.length,
    wasteTermSpend7d: derived.waste.terms.reduce((a, t) => a + t.spend7d, 0),
    unknownActorChanges: derived.changeEvents14d.filter(c => c.unknownActor),
    monthlyCapPacingFlag: derived.monthPacing.account.pacingFlag,
    monthlyCapNearlyConsumed: derived.monthPacing.account.consumedPct !== null
      && derived.monthPacing.account.consumedPct > 0.9,
  }
}

// --- weekly-only derivations ----------------------------------------------

if (MODE === 'weekly') {
  // Posture A: never describe the trap MECHANISM, and never gopher/vole (not serviced).
  //
  // Negation matters. "No poisons. No chemicals." is a SAFETY CLAIM and is fine — it is the
  // opposite of describing poison as a method. Only an un-negated mention is a violation.
  // "exterminator" (the noun) is policy-safe; "exterminate" (the verb) is not.
  const BANNED = [
    { re: /\bbody[- ]?grip(ping)?\b/gi, label: 'body-grip', negatable: false },
    { re: /\bscissor(s)?\b/gi, label: 'scissor', negatable: false },
    { re: /\bharpoon(s)?\b/gi, label: 'harpoon', negatable: false },
    { re: /\bspike[ds]?\b/gi, label: 'spike', negatable: false },
    { re: /\bkill(s|ed|ing)?\b/gi, label: 'kill', negatable: true },
    { re: /\blethal\b/gi, label: 'lethal', negatable: true },
    { re: /\bpoison(s|ed|ing)?\b/gi, label: 'poison', negatable: true },
    { re: /\bexterminat(e|es|ed|ing)\b/gi, label: 'exterminate (verb)', negatable: false },
    { re: /\bgopher(s)?\b/gi, label: 'gopher — not serviced', negatable: false },
    { re: /\bvole(s)?\b/gi, label: 'vole — not serviced', negatable: false },
  ]
  // "no poisons", "without poisons", "never kills", "free of poison", "zero chemicals"
  const NEGATOR = /\b(no|non|without|never|free\s+of|zero)\b[\s,.\-]*$/i
  const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/

  const rsas = []
  for (const r of rowsOf('ads_state')) {
    const ad = r.adGroupAd?.ad || {}
    const rsa = ad.responsiveSearchAd
    const headlines = (rsa?.headlines || []).map(h => h.text).filter(Boolean)
    const descriptions = (rsa?.descriptions || []).map(d => d.text).filter(Boolean)
    const texts = [...headlines, ...descriptions]
    const bannedHits = []
    const negatedHits = []
    const phoneHits = []
    for (const t of texts) {
      for (const b of BANNED) {
        b.re.lastIndex = 0
        let m
        while ((m = b.re.exec(t)) !== null) {
          const before = t.slice(Math.max(0, m.index - 18), m.index)
          const hit = { text: t, match: m[0], pattern: b.label }
          if (b.negatable && NEGATOR.test(before)) negatedHits.push(hit)
          else bannedHits.push(hit)
        }
      }
      if (PHONE.test(t)) phoneHits.push(t)
    }
    rsas.push({
      adId: ad.id,
      campaign: r.campaign?.name,
      adGroup: r.adGroup?.name,
      status: r.adGroupAd?.status,
      adStrength: r.adGroupAd?.adStrength,
      approvalStatus: r.adGroupAd?.policySummary?.approvalStatus,
      reviewStatus: r.adGroupAd?.policySummary?.reviewStatus,
      policyTopics: (r.adGroupAd?.policySummary?.policyTopicEntries || []).map(p => p.topic),
      finalUrls: ad.finalUrls || [],
      headlineCount: headlines.length,
      descriptionCount: descriptions.length,
      headlines, descriptions,
      bannedWordHits: bannedHits,
      negatedSafetyClaims: negatedHits,   // "No poisons" etc — informational, NOT violations
      phoneNumberHits: phoneHits,
    })
  }
  const perf30 = {}
  for (const r of rowsOf('ads_perf_30d')) {
    const id = r.adGroupAd?.ad?.id
    if (!id) continue
    const x = perf30[id] = perf30[id] || { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    x.spend += $(r.metrics.costMicros); x.impressions += num(r.metrics.impressions)
    x.clicks += num(r.metrics.clicks); x.conversions += num(r.metrics.conversions)
  }
  derived.rsas = rsas.map(a => ({ ...a, perf30d: perf30[a.adId] || null }))
  derived.policyScan = {
    bannedWordAds: derived.rsas.filter(a => a.bannedWordHits.length),
    negatedSafetyClaimAds: derived.rsas.filter(a => a.negatedSafetyClaims.length),
    phoneNumberAds: derived.rsas.filter(a => a.phoneNumberHits.length),
    notApproved: derived.rsas.filter(a => a.approvalStatus && a.approvalStatus !== 'APPROVED'),
    underReview: derived.rsas.filter(a => a.reviewStatus && !['REVIEWED'].includes(a.reviewStatus)),
  }

  // Assets / sitelinks
  {
    const meta = {}
    for (const r of rowsOf('campaign_assets')) {
      const id = r.asset?.id
      if (!id) continue
      meta[id] = {
        assetId: id, type: r.asset.type, fieldType: r.campaignAsset?.fieldType,
        status: r.campaignAsset?.status, campaign: r.campaign?.name,
        text: r.asset.sitelinkAsset?.linkText || r.asset.calloutAsset?.calloutText
          || r.asset.structuredSnippetAsset?.header || r.asset.callAsset?.phoneNumber
          || r.asset.name || null,
      }
    }
    const perf = {}
    for (const r of rowsOf('asset_perf_30d')) {
      const id = r.asset?.id
      if (!id) continue
      const x = perf[id] = perf[id] || { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
      x.spend += $(r.metrics.costMicros); x.impressions += num(r.metrics.impressions)
      x.clicks += num(r.metrics.clicks); x.conversions += num(r.metrics.conversions)
    }
    derived.assets30d = Object.values(meta)
      .map(m => ({ ...m, perf30d: perf[m.assetId] || { spend: 0, impressions: 0, clicks: 0, conversions: 0 } }))
      .sort((a, b) => b.perf30d.impressions - a.perf30d.impressions)
  }

  // Conversion action health incl. last conversion date.
  {
    const lastDate = {}
    for (const r of rowsOf('conv_action_daily_90d')) {
      const n = r.segments?.conversionActionName
      if (!n) continue
      const c = num(r.metrics.allConversions) + num(r.metrics.conversions)
      if (c > 0) {
        const d = r.segments.date
        if (!lastDate[n] || d > lastDate[n]) lastDate[n] = d
      }
    }
    const conv30 = Object.fromEntries(derived.conversionsByAction30d.map(a => [a.action, a]))
    derived.conversionActions = rowsOf('conversion_actions').map(r => {
      const ca = r.conversionAction
      const last = lastDate[ca.name] || null
      const daysSince = last
        ? Math.round((Date.parse(YESTERDAY) - Date.parse(last)) / 86400000) : null
      return {
        id: ca.id, name: ca.name, status: ca.status, type: ca.type, category: ca.category,
        primaryForGoal: !!ca.primaryForGoal, countingType: ca.countingType,
        includeInConversionsMetric: ca.includeInConversionsMetric ?? null,
        origin: ca.origin,
        lastConversionDate90d: last,
        daysSinceLastConversion: daysSince,
        conversions30d: conv30[ca.name]?.conversions ?? 0,
        allConversions30d: conv30[ca.name]?.allConversions ?? 0,
        stale: ca.status === 'ENABLED' && (last === null || (daysSince !== null && daysSince > 14)),
      }
    }).sort((a, b) => (b.allConversions30d - a.allConversions30d))
  }

  // Remarketing / user lists — the 0-member check.
  derived.userLists = rowsOf('user_lists').map(r => {
    const u = r.userList
    return {
      id: u.id, name: u.name, type: u.type, membershipStatus: u.membershipStatus,
      sizeForSearch: num(u.sizeForSearch), sizeForDisplay: num(u.sizeForDisplay),
      eligibleForSearch: !!u.eligibleForSearch, eligibleForDisplay: !!u.eligibleForDisplay,
      lifespanDays: u.membershipLifeSpan,
      emptyList: num(u.sizeForSearch) === 0 && num(u.sizeForDisplay) === 0,
    }
  }).sort((a, b) => b.sizeForSearch - a.sizeForSearch)

  // Shared negative lists + campaign attachment.
  {
    const attach = {}
    for (const r of rowsOf('campaign_shared_sets')) {
      const sid = r.sharedSet?.id
      if (!sid) continue
      attach[sid] = attach[sid] || []
      attach[sid].push({ campaign: r.campaign?.name, status: r.campaignSharedSet?.status })
    }
    derived.sharedNegativeLists = rowsOf('shared_sets').map(r => ({
      id: r.sharedSet.id, name: r.sharedSet.name, type: r.sharedSet.type,
      status: r.sharedSet.status, memberCount: num(r.sharedSet.memberCount),
      referenceCount: num(r.sharedSet.referenceCount),
      attachedTo: attach[r.sharedSet.id] || [],
      unattached: !(attach[r.sharedSet.id] || []).length,
    }))
    const negByCamp = {}
    for (const r of rowsOf('campaign_negatives')) {
      const n = r.campaign?.name || '(unknown)'
      negByCamp[n] = (negByCamp[n] || 0) + 1
    }
    derived.campaignNegativeCounts = negByCamp
  }

  // Ad schedule (day/hour) + device, 30d.
  {
    const fold = (key, dim, getter) => {
      const by = {}
      for (const r of rowsOf(key)) {
        const k = getter(r)
        const x = by[k] = by[k] || { [dim]: k, spend: 0, impressions: 0, clicks: 0, conversions: 0 }
        x.spend += $(r.metrics.costMicros); x.impressions += num(r.metrics.impressions)
        x.clicks += num(r.metrics.clicks); x.conversions += num(r.metrics.conversions)
      }
      return Object.values(by).map(x => ({ ...x, cpl: cpl(x.spend, x.conversions) }))
    }
    derived.schedule30d = {
      dayOfWeek: fold('dayofweek_30d', 'dayOfWeek', r => r.segments.dayOfWeek),
      hourOfDay: fold('hourofday_30d', 'hour', r => num(r.segments.hour)).sort((a, b) => a.hour - b.hour),
      device: fold('device_30d', 'device', r => r.segments.device).sort((a, b) => b.spend - a.spend),
    }
  }

  derived.recommendations = rowsOf('recommendations').map(r => ({
    type: r.recommendation?.type,
    campaign: nameById[(r.recommendation?.campaign || '').split('/').pop()] || r.recommendation?.campaign || '(account)',
    dismissed: !!r.recommendation?.dismissed,
  }))

  // Week vs prior week, for the weekly report header.
  derived.weekComparison = {
    thisWeek: derived.totals.d7,
    priorWeek: derived.totals.prev7,
    deltas: (() => {
      const a = derived.totals.d7.account, b = derived.totals.prev7.account
      const d = (x, y) => (y ? (x - y) / y : null)
      return {
        spend: d(a.spend, b.spend), clicks: d(a.clicks, b.clicks),
        conversions: d(a.conversions, b.conversions),
        cpl: (a.cpl && b.cpl) ? d(a.cpl, b.cpl) : null,
      }
    })(),
  }
}

// ============================================================== OUTPUT ======

const L = []
const line = s => L.push(s ?? '')
const rule = (n = 100) => L.push('-'.repeat(n))
const h1 = s => { L.push(''); L.push('='.repeat(100)); L.push(s); L.push('='.repeat(100)) }
const h2 = s => { L.push(''); L.push(s); L.push('-'.repeat(s.length)) }

line(`GOT MOLES — ADS PULSE (${MODE.toUpperCase()})`)
line(`Customer ${CUSTOMER_ID} · generated ${derived.generatedAt}`)
line(`Pacific today ${TODAY} · last COMPLETE day ${YESTERDAY}`)
line(`7d ${W.d7.join(' .. ')} | 30d ${W.d30.join(' .. ')} | 90d ${W.d90.join(' .. ')} | MTD ${W.mtd.join(' .. ')}`)
line('READ-ONLY pull. No mutation was made and none is proposed by this file.')
if (errors.length) {
  line('')
  line(`!! ${errors.length} section(s) failed:`)
  for (const e of errors) line(`   - ${e.section}: ${e.error}`)
}

// --- account + campaigns ---
h1('1. ACCOUNT & CAMPAIGNS')
{
  const c = rowsOf('customer')[0]?.customer
  if (c) {
    line(`${c.descriptiveName} (${c.id}) · ${c.currencyCode} · ${c.timeZone}`)
    line(`Optimisation score ${c.optimizationScore ?? '—'} · auto-tagging ${c.autoTaggingEnabled}`)
    const cts = c.conversionTrackingSetting || {}
    line(`Conversion tracking ${cts.conversionTrackingId ?? '—'} (${cts.conversionTrackingStatus ?? '—'}) · enhanced conv for leads ${cts.enhancedConversionsForLeadsEnabled ?? '—'}`)
  }
  h2('Campaigns')
  line(`${pad('Campaign', 32)}${pad('Status', 10)}${pad('Bidding', 24)}${padL('Budget/d', 10)}${padL('tCPA', 8)}${padL('MonthCap', 11)}`)
  rule()
  for (const c of campaigns.sort((a, b) => (a.status === 'ENABLED' ? -1 : 1) - (b.status === 'ENABLED' ? -1 : 1))) {
    line(`${pad(c.name, 32)}${pad(c.status, 10)}${pad(c.bidding, 24)}${padL(money(c.dailyBudget), 10)}${padL(c.tcpa ? money(c.tcpa) : '—', 8)}${padL(money(c.dailyBudget * CAP_MULTIPLIER), 11)}`)
  }
  const rec = campaigns.filter(c => c.recommendedBudget)
  if (rec.length) {
    line('')
    for (const c of rec) line(`  Google recommends ${money(c.recommendedBudget)}/day for "${c.name}" — evidence of budget-limited status, NOT a deployable target.`)
  }
}

// --- month pacing: the headline section ---
h1('2. MONTH PACING vs MONTHLY CAP  ***read this before diagnosing anything***')
{
  const mp = derived.monthPacing
  const a = mp.account
  line(`Google enforces a monthly ceiling of (average daily budget x ${CAP_MULTIPLIER}).`)
  line(`Late-month spend collapse + high budget-lost IS = THIS, not a bidding problem.`)
  line('')
  line(`Month ${mp.month} · day ${mp.dayOfMonth} of ${mp.daysInMonth} · ${a.daysRemaining} day(s) remaining (incl. today)`)
  line('')
  line(`ACCOUNT`)
  line(`  Sum of enabled daily budgets  ${money(a.sumEnabledDailyBudgets)}/day`)
  line(`  Monthly cap                   ${money(a.monthlyCap)}`)
  line(`  Month-to-date spend           ${money(a.mtdSpend)}  (${pct(a.consumedPct)} of cap)`)
  line(`  Expected by now (linear)      ${money(a.expectedByNow)}`)
  line(`  Ahead of pace by              ${pct(a.aheadOfPaceBy)} of cap  ${a.pacingFlag ? '<<< PACING FLAG (>5%)' : ''}`)
  line(`  Remaining allowance           ${money(a.remainingAllowance)} over ${a.daysRemaining} day(s) = ${money(a.allowancePerDay)}/day`)
  line(`  7d run rate                   ${money(a.dailyRunRate7d)}/day`)
  line(`  Projected cap-hit date        ${a.projectedCapHitDate || 'not before month end at current run rate'}`)
  line('')
  line(`PER CAMPAIGN`)
  line(`${pad('Campaign', 30)}${padL('Bud/d', 9)}${padL('Cap', 11)}${padL('MTD', 11)}${padL('Used', 8)}${padL('Left/day', 10)}${padL('7d rate', 10)}  Cap-hit`)
  rule(110)
  for (const p of mp.perCampaign) {
    line(`${pad(p.label, 30)}${padL(money(p.dailyBudget), 9)}${padL(money(p.monthlyCap), 11)}${padL(money(p.mtdSpend), 11)}${padL(pct(p.consumedPct), 8)}${padL(money(p.allowancePerDay), 10)}${padL(money(p.dailyRunRate7d), 10)}  ${p.projectedCapHitDate || '—'}${p.pacingFlag ? '  <<< PACING FLAG' : ''}`)
  }
  line('')
  line(`Prior month (${mp.priorMonth.window.join(' .. ')}) for the repeat check:`)
  for (const c of mp.priorMonth.campaigns) line(`  ${pad(c.name, 30)} ${padL(money(c.spend), 11)} ${padL(c.conv.toFixed(1), 7)} conv`)
  line('')
  line(`INTERPRETATION RULE: when MTD is near the cap, treat budget-lost IS above 30% as`)
  line(`CAP-DRIVEN. It is not evidence of a bidding or tCPA problem. Rank-lost IS is the`)
  line(`auction signal; budget-lost IS at month end is the calendar.`)
}

// --- 14 day table ---
h1('3. PER-DAY, LAST 14 DAYS')
{
  h2('Account roll-up')
  line(`${pad('Date', 12)}${padL('Spend', 10)}${padL('Impr', 8)}${padL('Clicks', 8)}${padL('Conv', 7)}${padL('CPL', 10)}`)
  rule(60)
  for (const d of derived.daily14Account) {
    line(`${pad(d.date, 12)}${padL(money(d.spend), 10)}${padL(d.impressions, 8)}${padL(d.clicks, 8)}${padL(d.conversions.toFixed(1), 7)}${padL(cplStr(d.spend, d.conversions), 10)}`)
  }
  const camps = [...new Set(derived.daily14.map(d => d.campaign))]
  for (const cn of camps) {
    h2(cn)
    line(`${pad('Date', 12)}${padL('Spend', 10)}${padL('Impr', 7)}${padL('Clk', 6)}${padL('CTR', 8)}${padL('avgCPC', 9)}${padL('Conv', 7)}${padL('CPL', 10)}${padL('IS', 8)}${padL('BudLost', 9)}${padL('RankLost', 9)}${padL('AbsTop', 8)}`)
    rule(110)
    for (const d of derived.daily14.filter(x => x.campaign === cn)) {
      line(
        `${pad(d.date, 12)}${padL(money(d.spend), 10)}${padL(d.impressions, 7)}${padL(d.clicks, 6)}` +
        `${padL(pct(d.ctr), 8)}${padL(money(d.avgCpc), 9)}${padL(d.conversions.toFixed(1), 7)}` +
        `${padL(cplStr(d.spend, d.conversions), 10)}${padL(pct(d.searchIS), 8)}${padL(pct(d.budgetLostIS), 9)}` +
        `${padL(pct(d.rankLostIS), 9)}${padL(pct(d.absTopPct), 8)}`
      )
    }
  }
}

// --- totals ---
h1('4. TOTALS — 7d / 30d / 90d (+ prior week)')
for (const [k, label] of [['d7', '7 days'], ['prev7', 'prior 7 days'], ['d30', '30 days'], ['d90', '90 days']]) {
  const t = derived.totals[k]
  h2(`${label}  (${t.window.join(' .. ')})`)
  line(`${pad('Campaign', 30)}${padL('Spend', 11)}${padL('Impr', 8)}${padL('Clk', 6)}${padL('CTR', 8)}${padL('avgCPC', 9)}${padL('Conv', 7)}${padL('CPL', 10)}${padL('IS', 8)}${padL('BudLost', 9)}${padL('RankLost', 9)}`)
  rule(110)
  for (const c of t.campaigns) {
    line(`${pad(c.campaign, 30)}${padL(money(c.spend), 11)}${padL(c.impressions, 8)}${padL(c.clicks, 6)}${padL(pct(c.ctr), 8)}${padL(money(c.avgCpc), 9)}${padL(c.conversions.toFixed(1), 7)}${padL(cplStr(c.spend, c.conversions), 10)}${padL(pct(c.searchIS), 8)}${padL(pct(c.budgetLostIS), 9)}${padL(pct(c.rankLostIS), 9)}`)
  }
  const a = t.account
  rule(110)
  line(`${pad('BLENDED', 30)}${padL(money(a.spend), 11)}${padL(a.impressions, 8)}${padL(a.clicks, 6)}${padL(pct(a.ctr), 8)}${padL(money(a.avgCpc), 9)}${padL(a.conversions.toFixed(1), 7)}${padL(cplStr(a.spend, a.conversions), 10)}`)
}
h2('Conversions by conversion action (30d)')
line(`${pad('Action', 42)}${pad('Category', 20)}${padL('conv', 9)}${padL('allConv', 10)}`)
rule(85)
for (const a of derived.conversionsByAction30d) {
  line(`${pad(a.action, 42)}${pad(a.category || '—', 20)}${padL(a.conversions.toFixed(1), 9)}${padL(a.allConversions.toFixed(1), 10)}`)
}

// --- search terms / waste ---
h1('5. SEARCH TERMS — WASTE (90-DAY GATED) & NEW CONVERTERS')
{
  line(`WASTE RULE: ${derived.waste.rule}`)
  line(`A term that converted at any point in 90 days is NEVER on this list.`)
  h2(`Waste candidates (${derived.waste.terms.length})`)
  if (!derived.waste.terms.length) line('  None.')
  else {
    line(`${pad('Term', 46)}${padL('7d spend', 10)}${padL('7d clk', 8)}${padL('90d spend', 11)}${padL('90d conv', 10)}`)
    rule(90)
    for (const t of derived.waste.terms) {
      line(`${pad(t.term, 46)}${padL(money(t.spend7d), 10)}${padL(t.clicks7d, 8)}${padL(money(t.spend90d), 11)}${padL(t.conv90d.toFixed(1), 10)}`)
    }
    line('')
    line(`Total 7d spend on waste candidates: ${money(derived.waste.terms.reduce((a, t) => a + t.spend7d, 0))}`)
  }
  h2(`PROTECTED — looked like waste on 7 days, but converts on 90 (${derived.waste.protectedByNinetyDay.length})`)
  if (!derived.waste.protectedByNinetyDay.length) line('  None.')
  else {
    line(`${pad('Term', 46)}${padL('7d spend', 10)}${padL('90d spend', 11)}${padL('90d conv', 10)}${padL('90d CPL', 11)}`)
    rule(92)
    for (const t of derived.waste.protectedByNinetyDay) {
      line(`${pad(t.term, 46)}${padL(money(t.spend7d), 10)}${padL(money(t.spend90d), 11)}${padL(t.conv90d.toFixed(1), 10)}${padL(cplStr(t.spend90d, t.conv90d), 11)}`)
    }
    line('')
    line('DO NOT propose negating anything in this block.')
  }
  h2(`New converting terms not yet keywords (90d) — ${derived.newConvertingTerms.length}`)
  if (!derived.newConvertingTerms.length) line('  None.')
  else {
    line(`${pad('Term', 46)}${padL('90d spend', 11)}${padL('conv', 7)}${padL('CPL', 10)}  caught by`)
    rule(110)
    for (const t of derived.newConvertingTerms.slice(0, 40)) {
      line(`${pad(t.term, 46)}${padL(money(t.spend90d), 11)}${padL(t.conv90d.toFixed(1), 7)}${padL(cplStr(t.spend90d, t.conv90d), 10)}  ${(t.caughtBy || []).slice(0, 2).join(' / ')}`)
    }
  }
}

// --- keyword ladder ---
h1('6. KEYWORD LADDER')
line('Budget-lost IS is CAMPAIGN-LEVEL ONLY in v24 (prohibited on ad_group and keyword_view) —')
line('read it from section 4 and interpret it against section 2 (the monthly cap).')
line('At keyword and ad-group level, RANK-lost IS is the bid / Quality-Score lever.')
for (const k of ['d30', 'd90']) {
  const L2 = derived.keywordLadder[k]
  const hdr = `${pad('Keyword', 36)}${pad('Match', 8)}${pad('Ad group', 24)}${padL('Spend', 10)}${padL('Conv', 7)}${padL('CPL', 10)}${padL('QS', 4)}${padL('IS', 8)}${padL('RankLost', 9)}`
  const row = x => `${pad(x.text, 36)}${pad(x.matchType, 8)}${pad(x.adGroup, 24)}${padL(money(x.spend), 10)}${padL(x.conversions.toFixed(1), 7)}${padL(cplStr(x.spend, x.conversions), 10)}${padL(x.qs ?? '—', 4)}${padL(pct(x.searchIS), 8)}${padL(pct(x.rankLostIS), 9)}`
  h2(`${k === 'd30' ? '30 days' : '90 days'} (${L2.window.join(' .. ')}) — best 10 CPL`)
  line(hdr); rule(118)
  for (const x of L2.bestCpl) line(row(x))
  h2(`${k === 'd30' ? '30 days' : '90 days'} — worst 10 CPL among the 40 biggest spenders`)
  line(hdr); rule(118)
  for (const x of L2.worstCplBySpend) line(row(x))
  h2(`${k === 'd30' ? '30 days' : '90 days'} — biggest spenders with ZERO conversions`)
  line(hdr); rule(118)
  if (!L2.zeroConvSpenders.length) line('  None.')
  for (const x of L2.zeroConvSpenders.slice(0, 12)) line(row(x))
}
h2('Ad-group impression share, 30d')
line(`${pad('Ad group', 30)}${pad('Campaign', 22)}${padL('Spend', 11)}${padL('Impr', 8)}${padL('Conv', 7)}${padL('CPL', 10)}${padL('IS', 8)}${padL('RankLost', 9)}${padL('AbsTopIS', 9)}`)
rule(115)
for (const a of derived.adGroupIS.d30.filter(x => x.spend > 0).slice(0, 20)) {
  line(`${pad(a.adGroup, 30)}${pad(a.campaign, 22)}${padL(money(a.spend), 11)}${padL(a.impressions, 8)}${padL(a.conversions.toFixed(1), 7)}${padL(cplStr(a.spend, a.conversions), 10)}${padL(pct(a.searchIS), 8)}${padL(pct(a.rankLostIS), 9)}${padL(pct(a.absTopIS), 9)}`)
}
line('')
line(`Enabled ad groups with ZERO impressions in 30d: ${derived.zeroImpressionAdGroups30d.length}`)
for (const a of derived.zeroImpressionAdGroups30d.slice(0, 30)) line(`  ${a.campaign} / ${a.adGroup}`)
h2('QS components on the top 15 spenders (30d)')
line(`${pad('Keyword', 36)}${padL('Spend', 10)}${padL('QS', 4)}  ${pad('ExpCTR', 20)}${pad('AdRelevance', 20)}${pad('LP exp', 20)}`)
rule(115)
for (const x of derived.keywordLadder.d30.all.slice(0, 15)) {
  line(`${pad(x.text, 36)}${padL(money(x.spend), 10)}${padL(x.qs ?? '—', 4)}  ${pad(x.qsExpectedCtr || '—', 20)}${pad(x.qsCreative || '—', 20)}${pad(x.qsLanding || '—', 20)}`)
}

// --- geo ---
h1('7. GEO — 30 DAYS (location of presence)')
{
  line(`${pad('City', 34)}${padL('Spend', 11)}${padL('Impr', 8)}${padL('Clicks', 8)}${padL('Conv', 7)}${padL('CPL', 11)}`)
  rule(80)
  for (const g of derived.geo30d.top25BySpend) {
    line(`${pad(g.city, 34)}${padL(money(g.spend), 11)}${padL(g.impressions, 8)}${padL(g.clicks, 8)}${padL(g.conversions.toFixed(1), 7)}${padL(cplStr(g.spend, g.conversions), 11)}`)
  }
  h2(`Cities over $100 CPL (${derived.geo30d.over100Cpl.length})`)
  for (const g of derived.geo30d.over100Cpl) line(`  ${pad(g.city, 34)} ${padL(money(g.spend), 11)} ${padL(g.conversions.toFixed(1), 6)} conv  CPL ${cplStr(g.spend, g.conversions)}`)
  h2(`Cities over $50 spend with ZERO conversions (${derived.geo30d.zeroConvOver50.length})`)
  for (const g of derived.geo30d.zeroConvOver50) line(`  ${pad(g.city, 34)} ${padL(money(g.spend), 11)} ${padL(g.clicks, 6)} clicks`)
}

// --- change events ---
h1('8. CHANGE EVENTS — LAST 14 DAYS')
line(`${derived.changeEvents14d.length} raw event(s), grouped by day / resource / operation / actor.`)
line('')
if (!derived.changeEventGroups14d.length) line('  None. Nobody has touched the account.')
else {
  line(`${pad('Date', 12)}${padL('Count', 7)}  ${pad('Resource', 22)}${pad('Op', 9)}${pad('Campaign', 22)}${pad('By', 20)}Via`)
  rule(115)
  for (const g of derived.changeEventGroups14d) {
    line(`${pad(g.date, 12)}${padL(g.count, 7)}  ${pad(g.resourceType, 22)}${pad(g.operation, 9)}${pad(g.campaign || '—', 22)}${pad(g.userEmail || '—', 20)}${g.clientType}${g.unknownActor ? '   <<< UNKNOWN ACTOR' : ''}`)
  }
  line('')
  line('Known actors: ' + KNOWN_ACTORS.join(', ') + ' via GOOGLE_ADS_API (our scripts) — anything else needs explaining.')
}

// --- flag inputs ---
h1('9. FLAG INPUTS (for the report writer)')
{
  const f = derived.flagInputs
  const d = f.lastCompleteDay
  line(`Last complete day (${YESTERDAY}): spend ${d ? money(d.spend) : '—'} · clicks ${d?.clicks ?? '—'} · conv ${d ? d.conversions.toFixed(1) : '—'} · CPL ${d ? cplStr(d.spend, d.conversions) : '—'}`)
  line(`Cold day (0 conv, >$50)        ${f.coldDay}`)
  line(`Consecutive cold days          ${f.consecutiveColdDays}`)
  line(`Backfill caveat applies        ${f.backfillCaveatApplies}   (phone conversions backfill 1-3 days: CallRail -> GA4 -> Ads)`)
  line(`Brand bleed 7d (>$15, 0 conv)  ${f.brandBleed7d}`)
  line(`7d CPL ${f.cpl7d ? money(f.cpl7d) : '—'} vs 30d CPL ${f.cpl30d ? money(f.cpl30d) : '—'} · delta ${f.cplSpikeVs30d === null ? '—' : pct(f.cplSpikeVs30d)}`)
  line(`Waste terms (90d-gated)        ${f.wasteTermCount} · ${money(f.wasteTermSpend7d)} in 7d`)
  line(`Monthly cap pacing flag        ${f.monthlyCapPacingFlag}`)
  line(`Monthly cap >90% consumed      ${f.monthlyCapNearlyConsumed}`)
  line(`Unknown-actor changes          ${f.unknownActorChanges.length}`)
  line('')
  line('Budget/rank lost IS, 7d:')
  for (const b of f.budgetLostIS7d) line(`  ${pad(b.campaign, 30)} budget-lost ${padL(pct(b.budgetLostIS), 8)}  rank-lost ${padL(pct(b.rankLostIS), 8)}`)
}

// --- weekly sections ---
if (MODE === 'weekly') {
  h1('10. RSAs, POLICY & POSTURE A SCAN')
  {
    line(`${pad('Campaign', 24)}${pad('Ad group', 24)}${padL('Ad ID', 14)}${pad('  Status', 12)}${pad('Approval', 22)}${pad('Review', 20)}${pad('Strength', 14)}${padL('H', 4)}${padL('D', 4)}`)
    rule(140)
    for (const a of derived.rsas) {
      line(`${pad(a.campaign, 24)}${pad(a.adGroup, 24)}${padL(a.adId, 14)}${pad('  ' + a.status, 12)}${pad(a.approvalStatus || '—', 22)}${pad(a.reviewStatus || '—', 20)}${pad(a.adStrength || '—', 14)}${padL(a.headlineCount, 4)}${padL(a.descriptionCount, 4)}`)
    }
    h2('Posture A banned-word scan (mechanism language, gopher/vole)')
    line('Rule: never describe the trap MECHANISM (body-grip / scissor / harpoon / spike / kill /')
    line('lethal / poison-as-method), never the verb "exterminate", never gopher or vole.')
    line('A NEGATED mention ("No poisons. No chemicals.") is a safety claim and is NOT a violation.')
    line('')
    if (!derived.policyScan.bannedWordAds.length) line('  CLEAN — no un-negated mechanism words, no gopher/vole in any RSA text.')
    else for (const a of derived.policyScan.bannedWordAds) {
      line(`  !! VIOLATION ad ${a.adId} (${a.campaign} / ${a.adGroup}) [${a.status}]`)
      for (const h of a.bannedWordHits) line(`       "${h.text}"  -> matched "${h.match}" (${h.pattern})`)
    }
    const negAds = derived.policyScan.negatedSafetyClaimAds
    line('')
    line(`  Negated safety claims (informational, no action): ${negAds.length} ad(s), e.g. ${[...new Set(negAds.flatMap(a => a.negatedSafetyClaims.map(h => h.text)))].slice(0, 3).map(t => `"${t}"`).join(' · ') || '—'}`)
    h2('Phone-number-in-ad-text scan (PHONE_NUMBER_IN_AD_TEXT)')
    if (!derived.policyScan.phoneNumberAds.length) line('  CLEAN — no phone numbers in any RSA headline or description.')
    else for (const a of derived.policyScan.phoneNumberAds) {
      line(`  !! ad ${a.adId} (${a.campaign} / ${a.adGroup}): ${a.phoneNumberHits.join(' | ')}`)
    }
    h2('Not approved / still under review')
    if (!derived.policyScan.notApproved.length && !derived.policyScan.underReview.length) line('  All ads approved and reviewed.')
    for (const a of derived.policyScan.notApproved) line(`  ${a.adId} ${a.campaign} / ${a.adGroup} — approval ${a.approvalStatus} · topics ${(a.policyTopics || []).join(', ') || '—'}`)
    for (const a of derived.policyScan.underReview) line(`  ${a.adId} ${a.campaign} / ${a.adGroup} — review ${a.reviewStatus}`)
  }

  h1('11. ASSETS / SITELINKS — 30 DAYS')
  line(`${pad('Field type', 22)}${pad('Text', 42)}${pad('Status', 12)}${padL('Impr', 9)}${padL('Clicks', 8)}${padL('Conv', 7)}`)
  rule(100)
  for (const a of derived.assets30d.slice(0, 40)) {
    line(`${pad(a.fieldType, 22)}${pad(a.text || '—', 42)}${pad(a.status, 12)}${padL(a.perf30d.impressions, 9)}${padL(a.perf30d.clicks, 8)}${padL(a.perf30d.conversions.toFixed(1), 7)}`)
  }

  h1('12. CONVERSION TRACKING HEALTH')
  line(`${pad('Action', 40)}${pad('Status', 10)}${pad('Primary', 9)}${padL('conv30d', 9)}${padL('all30d', 9)}${pad('  Last conv', 14)}${padL('days', 6)}`)
  rule(100)
  for (const a of derived.conversionActions) {
    line(`${pad(a.name, 40)}${pad(a.status, 10)}${pad(String(a.primaryForGoal), 9)}${padL(a.conversions30d.toFixed(1), 9)}${padL(a.allConversions30d.toFixed(1), 9)}${pad('  ' + (a.lastConversionDate90d || 'never in 90d'), 14)}${padL(a.daysSinceLastConversion ?? '—', 6)}${a.stale ? '  <<< STALE' : ''}`)
  }

  h1('13. REMARKETING / USER LISTS')
  line(`${pad('List', 40)}${pad('Type', 22)}${pad('Status', 10)}${padL('Search', 10)}${padL('Display', 10)}${padL('Life', 6)}`)
  rule(100)
  for (const u of derived.userLists) {
    line(`${pad(u.name, 40)}${pad(u.type, 22)}${pad(u.membershipStatus, 10)}${padL(u.sizeForSearch, 10)}${padL(u.sizeForDisplay, 10)}${padL(u.lifespanDays ?? '—', 6)}${u.emptyList ? '  <<< 0 MEMBERS' : ''}`)
  }

  h1('14. NEGATIVE KEYWORD LISTS')
  line(`${pad('Shared set', 40)}${pad('Type', 22)}${padL('Members', 9)}${padL('Refs', 6)}  Attached to`)
  rule(110)
  for (const s of derived.sharedNegativeLists) {
    line(`${pad(s.name, 40)}${pad(s.type, 22)}${padL(s.memberCount, 9)}${padL(s.referenceCount, 6)}  ${s.attachedTo.map(a => a.campaign).join(', ') || 'NONE'}${s.unattached ? '  <<< UNATTACHED' : ''}`)
  }
  h2('Campaign-level negatives')
  for (const [k, v] of Object.entries(derived.campaignNegativeCounts)) line(`  ${pad(k, 40)} ${v}`)

  h1('15. SCHEDULE & DEVICE — 30 DAYS')
  h2('Day of week')
  line(`${pad('Day', 14)}${padL('Spend', 11)}${padL('Clicks', 8)}${padL('Conv', 7)}${padL('CPL', 11)}`)
  rule(55)
  for (const d of derived.schedule30d.dayOfWeek) line(`${pad(d.dayOfWeek, 14)}${padL(money(d.spend), 11)}${padL(d.clicks, 8)}${padL(d.conversions.toFixed(1), 7)}${padL(cplStr(d.spend, d.conversions), 11)}`)
  h2('Hour of day')
  line(`${pad('Hour', 8)}${padL('Spend', 11)}${padL('Clicks', 8)}${padL('Conv', 7)}${padL('CPL', 11)}`)
  rule(50)
  for (const d of derived.schedule30d.hourOfDay) line(`${pad(String(d.hour).padStart(2, '0') + ':00', 8)}${padL(money(d.spend), 11)}${padL(d.clicks, 8)}${padL(d.conversions.toFixed(1), 7)}${padL(cplStr(d.spend, d.conversions), 11)}`)
  h2('Device')
  line(`${pad('Device', 14)}${padL('Spend', 11)}${padL('Impr', 9)}${padL('Clicks', 8)}${padL('Conv', 7)}${padL('CPL', 11)}`)
  rule(65)
  for (const d of derived.schedule30d.device) line(`${pad(d.device, 14)}${padL(money(d.spend), 11)}${padL(d.impressions, 9)}${padL(d.clicks, 8)}${padL(d.conversions.toFixed(1), 7)}${padL(cplStr(d.spend, d.conversions), 11)}`)

  h1('16. GOOGLE RECOMMENDATIONS (informational — not endorsements)')
  if (!derived.recommendations.length) line('  None.')
  for (const r of derived.recommendations) line(`  ${pad(r.type, 34)} ${r.campaign}${r.dismissed ? '  (dismissed)' : ''}`)
  line('')
  line('Google surfaces CAMPAIGN_BUDGET / TARGET_CPA_OPT_IN / DISPLAY_EXPANSION / PMAX routinely.')
  line('Treat budget recommendations as EVIDENCE the campaign is budget-limited, never as a target.')

  h1('17. WEEK vs PRIOR WEEK')
  {
    const d = derived.weekComparison.deltas
    const a = derived.totals.d7.account, b = derived.totals.prev7.account
    line(`${pad('Metric', 16)}${padL('This week', 13)}${padL('Prior week', 13)}${padL('Delta', 10)}`)
    rule(55)
    line(`${pad('Spend', 16)}${padL(money(a.spend), 13)}${padL(money(b.spend), 13)}${padL(d.spend === null ? '—' : pct(d.spend), 10)}`)
    line(`${pad('Clicks', 16)}${padL(a.clicks, 13)}${padL(b.clicks, 13)}${padL(d.clicks === null ? '—' : pct(d.clicks), 10)}`)
    line(`${pad('Conversions', 16)}${padL(a.conversions.toFixed(1), 13)}${padL(b.conversions.toFixed(1), 13)}${padL(d.conversions === null ? '—' : pct(d.conversions), 10)}`)
    line(`${pad('CPL', 16)}${padL(cplStr(a.spend, a.conversions), 13)}${padL(cplStr(b.spend, b.conversions), 13)}${padL(d.cpl === null ? '—' : pct(d.cpl), 10)}`)
    line('')
    line(`30d blended CPL for reference: ${cplStr(derived.totals.d30.account.spend, derived.totals.d30.account.conversions)}`)
  }
}

h1('END OF PULSE')
line('Read-only. Nothing in this file has been applied to the account.')

// ---------------------------------------------------------------- write ----

const jsonPath = path.join(OUT_DIR, 'pulse.json')
const txtPath = path.join(OUT_DIR, 'pulse.txt')
fs.writeFileSync(jsonPath, JSON.stringify({ meta: derived, raw }, null, 1))
fs.writeFileSync(txtPath, L.join('\n') + '\n')

console.log(`\nWrote ${jsonPath}`)
console.log(`Wrote ${txtPath}`)
if (errors.length) console.log(`\n${errors.length} section(s) failed — see the header of pulse.txt.`)
else console.log('\nAll sections returned data.')
