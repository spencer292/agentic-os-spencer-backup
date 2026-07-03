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

const DEV_TOKEN = env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CLIENT_ID = env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH = env.GOOGLE_ADS_REFRESH_TOKEN;
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const CUSTOMER = '1665761172';

async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      refresh_token: REFRESH, grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(JSON.stringify(j));
  return j.access_token;
}

async function search(t, customer, query) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${customer}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${t}`,
      'developer-token': DEV_TOKEN,
      'login-customer-id': MCC,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

const t = await token();

const cust = await search(t, CUSTOMER, `
  SELECT
    customer.id,
    customer.descriptive_name,
    customer.call_reporting_setting.call_reporting_enabled,
    customer.call_reporting_setting.call_conversion_reporting_enabled,
    customer.call_reporting_setting.call_conversion_action
  FROM customer
`);

console.log('--- Customer call_reporting_setting ---');
console.log(JSON.stringify(cust, null, 2));

const callConv = await search(t, CUSTOMER, `
  SELECT
    conversion_action.id,
    conversion_action.name,
    conversion_action.status,
    conversion_action.type,
    conversion_action.category,
    conversion_action.primary_for_goal
  FROM conversion_action
  WHERE conversion_action.id = 7578959248
`);

console.log('\n--- Call-type conversion actions ---');
console.log(JSON.stringify(callConv, null, 2));
