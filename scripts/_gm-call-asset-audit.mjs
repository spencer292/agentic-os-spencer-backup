#!/usr/bin/env node
// Audit call assets + call reporting: what phone numbers ads carry and whether
// Google forwarding numbers (GFNs) are in play.
import fs from 'node:fs';
import path from 'node:path';

const env = {};
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}

const CUSTOMER = '1665761172';

async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(JSON.stringify(j));
  return j.access_token;
}

const t = await token();
async function search(query) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CUSTOMER}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${t}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, 'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

const rep = await search(`
  SELECT customer.call_reporting_setting.call_reporting_enabled,
         customer.call_reporting_setting.call_conversion_reporting_enabled
  FROM customer`);
console.log('=== Call reporting (GFN swap on ads when enabled):');
console.log(JSON.stringify(rep.results?.[0]?.customer?.callReportingSetting, null, 2));

const assets = await search(`
  SELECT asset.resource_name, asset.name, asset.call_asset.phone_number,
         asset.call_asset.country_code, asset.call_asset.call_conversion_reporting_state
  FROM asset WHERE asset.type = CALL`);
console.log('\n=== CALL assets in account:');
for (const r of assets.results || []) {
  console.log(`  ${r.asset.resourceName}`);
  console.log(`    name: ${r.asset.name} | phone: ${r.asset.callAsset?.phoneNumber} (${r.asset.callAsset?.countryCode})`);
}

const links = await search(`
  SELECT campaign.name, campaign.status, asset.call_asset.phone_number, campaign_asset.status
  FROM campaign_asset WHERE campaign_asset.field_type = CALL`);
console.log('\n=== Campaign links (CALL):');
for (const r of links.results || []) {
  console.log(`  ${r.campaign.name} [${r.campaign.status}] -> ${r.asset.callAsset?.phoneNumber} (link ${r.campaignAsset.status})`);
}

// Call-only / call ads would carry their own numbers too
const callAds = await search(`
  SELECT ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.ad.call_ad.phone_number,
         ad_group.name, campaign.name, ad_group_ad.status
  FROM ad_group_ad WHERE ad_group_ad.ad.type = CALL_AD`);
console.log('\n=== CALL_AD ads:');
if (!(callAds.results || []).length) console.log('  (none)');
for (const r of callAds.results || []) {
  console.log(`  ${r.campaign.name} / ${r.adGroup.name}: ${r.adGroupAd.ad.callAd?.phoneNumber} [${r.adGroupAd.status}]`);
}

// Recent call interactions from call_view
const calls = await search(`
  SELECT call_view.caller_country_code, call_view.start_call_date_time,
         call_view.duration_seconds, call_view.type, call_view.status, campaign.name
  FROM call_view WHERE segments.date DURING LAST_30_DAYS`);
console.log(`\n=== call_view last 30 days: ${(calls.results || []).length} calls`);
for (const r of (calls.results || []).slice(0, 10)) {
  console.log(`  ${r.callView.startCallDateTime} ${r.campaign?.name} ${r.callView.durationSeconds}s ${r.callView.status || ''}`);
}
if (calls.error) console.log(JSON.stringify(calls.error).slice(0, 400));
