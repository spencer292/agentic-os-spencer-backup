#!/usr/bin/env node
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

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
});
const { access_token } = await tokenRes.json();

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  'Content-Type': 'application/json',
};

async function q(query) {
  const r = await fetch('https://googleads.googleapis.com/v23/customers/1665761172/googleAds:search', {
    method: 'POST', headers, body: JSON.stringify({ query }),
  });
  return r.json();
}

console.log('=== ACTIVE CAMPAIGNS (today) ===\n');
const camps = await q(`
  SELECT
    campaign.id, campaign.name, campaign.status, campaign.serving_status,
    campaign_budget.amount_micros,
    metrics.impressions, metrics.clicks, metrics.cost_micros,
    metrics.conversions, metrics.average_cpc, metrics.ctr
  FROM campaign
  WHERE campaign.status = 'ENABLED' AND segments.date DURING TODAY
`);
for (const r of camps.results || []) {
  const c = r.campaign, m = r.metrics || {}, b = r.campaignBudget || {};
  console.log(`${c.name} (${c.id})`);
  console.log(`  Status: ${c.status}, Serving: ${c.servingStatus}`);
  console.log(`  Budget: $${(b.amountMicros/1e6).toFixed(2)}/day`);
  console.log(`  Today: ${m.impressions||0} impr, ${m.clicks||0} clicks, $${((m.costMicros||0)/1e6).toFixed(2)} spend, ${m.conversions||0} conv`);
  console.log('');
}

console.log('\n=== AD APPROVAL STATUS ===\n');
const ads = await q(`
  SELECT
    campaign.name, ad_group_ad.ad.id,
    ad_group_ad.policy_summary.approval_status,
    ad_group_ad.policy_summary.review_status,
    ad_group_ad.policy_summary.policy_topic_entries
  FROM ad_group_ad
  WHERE ad_group_ad.status = 'ENABLED' AND campaign.status = 'ENABLED'
`);
for (const r of ads.results || []) {
  const ad = r.adGroupAd, p = ad.policySummary || {};
  console.log(`${r.campaign.name}: ad ${ad.ad.id}`);
  console.log(`  Review: ${p.reviewStatus}, Approval: ${p.approvalStatus}`);
  if (p.policyTopicEntries?.length) {
    for (const e of p.policyTopicEntries) console.log(`  Topic: ${e.topic} (${e.type})`);
  }
  console.log('');
}

console.log('\n=== ASSET APPROVAL (call asset, sitelinks) ===\n');
const assets = await q(`
  SELECT
    campaign.name, asset.id, asset.name, asset.type,
    campaign_asset.status,
    asset_policy_summary.approval_status,
    asset_policy_summary.review_status
  FROM campaign_asset
  WHERE campaign.status = 'ENABLED'
  LIMIT 30
`);
for (const r of assets.results || []) {
  const ap = r.assetPolicySummary || {};
  console.log(`${r.campaign.name}: ${r.asset.type} "${r.asset.name?.slice(0,40)}" → ${ap.approvalStatus || '—'} (${ap.reviewStatus || '—'})`);
}
