// ads-link-invite.mjs — invite the Route Ready Ads account (763-085-7815) into
// the MCC so the ops-google-ads engine can manage it. Idempotent: reports the
// existing link status if an invite/link is already in place.
// Usage: node projects/briefs/zero-touch-business/scripts/ads-link-invite.mjs
import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');

const env = {};
for (const line of fs.readFileSync(resolve(repoRoot, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}

const ROUTE_READY_ID = '7630857815';
// Route Ready creds are namespaced ROUTE_READY_ADS_* — the generic GOOGLE_ADS_*
// keys are reserved for the Got Moles account (see GOT-MOLES.md).
const missing = ['ROUTE_READY_ADS_CLIENT_ID', 'ROUTE_READY_ADS_CLIENT_SECRET', 'ROUTE_READY_ADS_REFRESH_TOKEN', 'ROUTE_READY_ADS_DEVELOPER_TOKEN', 'ROUTE_READY_ADS_LOGIN_CUSTOMER_ID'].filter(k => !env[k]);
if (missing.length) { console.error('FAIL: missing .env keys:', missing.join(', ')); process.exit(1); }
const MCC = env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID;
const API = 'https://googleads.googleapis.com/v23';

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.ROUTE_READY_ADS_CLIENT_ID,
    client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET,
    refresh_token: env.ROUTE_READY_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
});
const { access_token } = await tokenRes.json();
if (!access_token) { console.error('FAIL: could not get OAuth access token'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${access_token}`,
  'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
};

// Check for an existing link first
const check = await (await fetch(`${API}/customers/${MCC}/googleAds:search`, {
  method: 'POST', headers,
  body: JSON.stringify({ query: `SELECT customer_client_link.client_customer, customer_client_link.status FROM customer_client_link WHERE customer_client_link.client_customer = 'customers/${ROUTE_READY_ID}'` }),
})).json();
const existing = (check.results || [])[0];
if (existing) {
  console.log('Link already exists:', existing.customerClientLink.status);
  process.exit(0);
}

const res = await fetch(`${API}/customers/${MCC}/customerClientLinks:mutate`, {
  method: 'POST', headers,
  body: JSON.stringify({ operation: { create: { clientCustomer: `customers/${ROUTE_READY_ID}`, status: 'PENDING' } } }),
});
const data = await res.json();
if (!res.ok) { console.error('FAIL:', JSON.stringify(data, null, 2).slice(0, 500)); process.exit(1); }
console.log('Invite sent from MCC to', ROUTE_READY_ID, '— accept it in the Route Ready account (Admin > Access and security > Managers).');
