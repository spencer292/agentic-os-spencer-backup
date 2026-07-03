#!/usr/bin/env node
// Add call asset to Got Moles Branded campaign now that Call Recording ToS is accepted.
// Phone: 253-750-0211, Country: US. Links to campaign 23819590031.

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

const DEV_TOKEN = env.GOOGLE_ADS_DEVELOPER_TOKEN;
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const CUSTOMER = '1665761172';
const CAMPAIGN_ID = '23819590031';
const PHONE = '2537500211';
const COUNTRY = 'US';

async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(JSON.stringify(j));
  return j.access_token;
}

const t = await token();

async function call(resource, operations) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CUSTOMER}/${resource}:mutate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${t}`,
      'developer-token': DEV_TOKEN,
      'login-customer-id': MCC,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations }),
  });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error, null, 2));
  return j.results;
}

console.log('1. Creating CallAsset...');
const callRes = await call('assets', [{
  create: {
    name: `Call - Got Moles - ${Date.now()}`,
    callAsset: {
      countryCode: COUNTRY,
      phoneNumber: PHONE,
      callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION',
    },
  },
}]);
const assetRN = callRes[0].resourceName;
console.log(`   Asset created: ${assetRN}`);

console.log('2. Linking asset to campaign 23819590031...');
const campaignRN = `customers/${CUSTOMER}/campaigns/${CAMPAIGN_ID}`;
await call('campaignAssets', [{
  create: { campaign: campaignRN, asset: assetRN, fieldType: 'CALL' },
}]);
console.log('   Linked.');

console.log('\n✅ Call asset deployed on Branded campaign.');
console.log('   Phone: 253-750-0211 (US)');
console.log('   Conversion tracking: USE_ACCOUNT_LEVEL (Calls from ads / ID 7578959248 / PRIMARY)');
