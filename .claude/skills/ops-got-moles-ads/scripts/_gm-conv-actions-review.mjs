#!/usr/bin/env node
// Read-only: list ALL conversion actions (source/type/status/primary) + 30d conversions per action.
// Run from clients/got-moles/. Same env pattern as got-moles-call-reporting-check.mjs.
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

async function search(t, query) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CUSTOMER}/googleAds:search`, {
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

console.log('--- ALL conversion actions ---');
const actions = await search(t, `
  SELECT conversion_action.id, conversion_action.name, conversion_action.status,
         conversion_action.type, conversion_action.category, conversion_action.origin,
         conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric
  FROM conversion_action
  ORDER BY conversion_action.id`);
for (const r of actions.results ?? []) {
  const a = r.conversionAction;
  console.log(`[${a.status}] ${a.name} | type=${a.type} origin=${a.origin} category=${a.category} primary=${a.primaryForGoal} inConvMetric=${a.includeInConversionsMetric}`);
}

console.log('\n--- 30d conversions by action ---');
const perf = await search(t, `
  SELECT segments.conversion_action_name, metrics.conversions, metrics.all_conversions
  FROM customer
  WHERE segments.date DURING LAST_30_DAYS AND metrics.all_conversions > 0`);
for (const r of perf.results ?? []) {
  console.log(`${r.segments.conversionActionName}: conversions=${r.metrics.conversions} all=${r.metrics.allConversions}`);
}
if (!perf.results?.length) console.log('(no rows)', JSON.stringify(perf).slice(0, 300));
