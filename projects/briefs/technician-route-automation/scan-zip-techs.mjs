#!/usr/bin/env node
// Phase 1 input #2: last ~4 months of COMPLETED visits with tech + ZIP,
// to propose the TECH half of the territory grid (recent = current-crew era).
// Output: zip-tech-cache.json  { zip: { tech: count } , cityByZip }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const OUT = path.join(__dirname, 'zip-tech-cache.json');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null, tokenAt = 0;
async function jobberToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('token failed', res.status); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jgql(query, variables, attempt = 0) {
  const token = await jobberToken();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await jobberToken(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 10) {
    const wait = Math.min(90000, 2000 * 2 ** attempt);
    console.log(`  throttled — backoff ${wait / 1000}s`);
    await sleep(wait);
    return jgql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (data.errors) throw new Error('GraphQL: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}
const from = new Date(Date.now() - 122 * 24 * 3600 * 1000).toISOString();
const to = new Date().toISOString();
console.log(`Scanning COMPLETED visits ${from.slice(0, 10)} -> ${to.slice(0, 10)} with tech + ZIP…`);
const zipTech = {}; // zip -> tech -> count
const cityByZip = {};
let cursor = null, n = 0, page = 0;
for (;;) {
  const q = `query($after: String) { visits(first: 25, after: $after, filter: { status: COMPLETED, startAt: { after: "${from}", before: "${to}" } }) { nodes { startAt assignedUsers(first: 1) { nodes { name { full } } } property { address { city postalCode } } } pageInfo { hasNextPage endCursor } } }`;
  const d = await jgql(q, { after: cursor });
  const v = d.visits;
  page++;
  for (const node of v.nodes) {
    n++;
    const a = node.property && node.property.address;
    const zip = (a && a.postalCode && a.postalCode.trim().slice(0, 5)) || '?';
    const city = (a && a.city && a.city.trim()) || '?';
    const tech = node.assignedUsers?.nodes?.[0]?.name?.full || '(none)';
    zipTech[zip] = zipTech[zip] || {};
    zipTech[zip][tech] = (zipTech[zip][tech] || 0) + 1;
    if (!cityByZip[zip]) cityByZip[zip] = {};
    cityByZip[zip][city] = (cityByZip[zip][city] || 0) + 1;
  }
  if (page % 40 === 0) console.log(`  page ${page}: ${n} visits`);
  if (!v.pageInfo.hasNextPage) break;
  cursor = v.pageInfo.endCursor;
  await sleep(750);
}
fs.writeFileSync(OUT, JSON.stringify({ scannedAt: new Date().toISOString(), from, to, total: n, zipTech, cityByZip }));
console.log(`DONE: ${n} visits, ${Object.keys(zipTech).length} ZIPs -> ${OUT}`);
