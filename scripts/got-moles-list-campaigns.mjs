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

const res = await fetch(`https://googleads.googleapis.com/v23/customers/1665761172/googleAds:search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.serving_status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      ORDER BY campaign.id
    `,
  }),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));

const adRes = await fetch(`https://googleads.googleapis.com/v23/customers/1665761172/googleAds:search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      SELECT
        campaign.name,
        ad_group_ad.ad.id,
        ad_group_ad.status,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status
      FROM ad_group_ad
    `,
  }),
});
console.log('\n--- Ad approval status ---');
console.log(JSON.stringify(await adRes.json(), null, 2));
