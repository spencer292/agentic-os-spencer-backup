#!/usr/bin/env node
// Phase 1 audit: read conversion actions configured on Got Moles Google Ads account.
// Reports what exists, status, source, primary/secondary, recent counts.
// Usage: node scripts/got-moles-conversion-audit.mjs

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

async function gaql(query) {
  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`, {
    method: 'POST', headers, body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2)); process.exit(1) }
  return data
}

console.log('=== Conversion Actions ===\n')
const actions = await gaql(`
  SELECT
    conversion_action.id,
    conversion_action.name,
    conversion_action.status,
    conversion_action.type,
    conversion_action.category,
    conversion_action.origin,
    conversion_action.primary_for_goal,
    conversion_action.counting_type,
    conversion_action.click_through_lookback_window_days,
    conversion_action.include_in_conversions_metric
  FROM conversion_action
  WHERE conversion_action.status != 'REMOVED'
`)
if (!actions.results?.length) {
  console.log('  (none configured)\n')
} else {
  for (const r of actions.results) {
    const a = r.conversionAction
    console.log(`  [${a.status}] ${a.name}`)
    console.log(`     id: ${a.id}  type: ${a.type}  category: ${a.category}`)
    console.log(`     origin: ${a.origin}  primary: ${a.primaryForGoal}  counting: ${a.countingType}  lookback: ${a.clickThroughLookbackWindowDays}d`)
    console.log(`     in conversions metric: ${a.includeInConversionsMetric}\n`)
  }
}

console.log('=== Customer-level conversion settings ===\n')
const cust = await gaql(`
  SELECT
    customer.conversion_tracking_setting.conversion_tracking_id,
    customer.conversion_tracking_setting.cross_account_conversion_tracking_id,
    customer.conversion_tracking_setting.accepted_customer_data_terms,
    customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled,
    customer.conversion_tracking_setting.google_ads_conversion_customer
  FROM customer
`)
const cs = cust.results[0].customer.conversionTrackingSetting
console.log(`  Conversion tracking ID: ${cs.conversionTrackingId || '(none — no Google tag set up)'}`)
console.log(`  Cross-account tracking ID: ${cs.crossAccountConversionTrackingId || '(none)'}`)
console.log(`  Accepted customer data terms (required for ECfL): ${cs.acceptedCustomerDataTerms}`)
console.log(`  Enhanced Conversions for Leads enabled: ${cs.enhancedConversionsForLeadsEnabled}`)
console.log(`  Google Ads conversion customer: ${cs.googleAdsConversionCustomer || '(self)'}`)

console.log('\n=== Linked GA4 / merchant accounts ===\n')
try {
  const links = await gaql(`
    SELECT
      account_link.resource_name,
      account_link.account_link_id,
      account_link.status,
      account_link.type
    FROM account_link
  `)
  if (!links.results?.length) {
    console.log('  (no account links — GA4 not yet linked, or no merchant accounts)')
  } else {
    for (const r of links.results) console.log('  -', JSON.stringify(r.accountLink))
  }
} catch (e) {
  console.log('  (account_link query failed — may not be supported on this account)')
}

console.log('\n=== Done. ===')
