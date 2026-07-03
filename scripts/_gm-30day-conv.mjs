import fs from 'node:fs';
import path from 'node:path';

// Load creds from root .env
const envPath = path.resolve('.env');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
}

const CID = '1665761172';
const MCC = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '2845309762').replace(/-/g, '');
const DEV = env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CLIENT_ID = env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH = env.GOOGLE_ADS_REFRESH_TOKEN;

async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('token fail: ' + JSON.stringify(j));
  return j.access_token;
}

async function query(at, gaql) {
  const r = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${at}`,
      'developer-token': DEV,
      'login-customer-id': MCC,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: gaql }),
  });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error, null, 2));
  return j.results || [];
}

const at = await token();

// Campaign-level last 30 days
const camp = await query(at, `
  SELECT campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions,
         metrics.conversions, metrics.all_conversions
  FROM campaign
  WHERE segments.date DURING LAST_30_DAYS
  ORDER BY metrics.cost_micros DESC
`);

console.log('═══ GOT MOLES — LAST 30 DAYS ═══\n');
let tc=0, tcl=0, ti=0, tcv=0, tac=0;
console.log('Campaign'.padEnd(34), 'Impr'.padStart(7), 'Clk'.padStart(6), 'Cost'.padStart(11), 'PrimConv'.padStart(9), 'AllConv'.padStart(9));
console.log('─'.repeat(82));
for (const row of camp) {
  const c = (row.metrics.costMicros||0)/1e6;
  const cl = +(row.metrics.clicks||0);
  const im = +(row.metrics.impressions||0);
  const cv = +(row.metrics.conversions||0);
  const ac = +(row.metrics.allConversions||0);
  tc+=c; tcl+=cl; ti+=im; tcv+=cv; tac+=ac;
  console.log((row.campaign.name||'').slice(0,33).padEnd(34), String(im).padStart(7), String(cl).padStart(6), ('$'+c.toFixed(2)).padStart(11), cv.toFixed(1).padStart(9), ac.toFixed(1).padStart(9));
}
console.log('─'.repeat(82));
console.log('TOTAL'.padEnd(34), String(ti).padStart(7), String(tcl).padStart(6), ('$'+tc.toFixed(2)).padStart(11), tcv.toFixed(1).padStart(9), tac.toFixed(1).padStart(9));
console.log(`\nBlended CPL (primary conv): $${tcv>0 ? (tc/tcv).toFixed(2) : '—'}`);

// Conversion action breakdown last 30 days
const conv = await query(at, `
  SELECT segments.conversion_action_name, segments.conversion_action_category,
         metrics.conversions, metrics.all_conversions
  FROM customer
  WHERE segments.date DURING LAST_30_DAYS AND metrics.all_conversions > 0
  ORDER BY metrics.all_conversions DESC
`);
console.log('\n═══ CONVERSION ACTION BREAKDOWN (last 30 days) ═══\n');
console.log('Action'.padEnd(38), 'Category'.padEnd(22), 'Primary'.padStart(8), 'All'.padStart(8));
console.log('─'.repeat(80));
for (const row of conv) {
  console.log((row.segments.conversionActionName||'').slice(0,37).padEnd(38), (row.segments.conversionActionCategory||'').slice(0,21).padEnd(22), (+(row.metrics.conversions||0)).toFixed(1).padStart(8), (+(row.metrics.allConversions||0)).toFixed(1).padStart(8));
}
