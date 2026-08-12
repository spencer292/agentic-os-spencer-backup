#!/usr/bin/env node
// Dump every Jobber property that has an ACTIVE job, as the keep-list for the onX waypoint cleanup.
// One row per unique property (a client with two jobs at one address collapses to one row).
// Usage: node fetch-active-properties.mjs [outfile]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const loadEnv = () => {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
};
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token;
  return tok;
}
async function jgql(query, variables, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  if (!data.data) {
    if (attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
    throw new Error(`Jobber: no data (HTTP ${res.status}) ` + JSON.stringify(data).slice(0, 300));
  }
  return data.data;
}

const OUT = process.argv[2] || path.join(__dirname, 'data', 'active-properties.json');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// jobStatus values we treat as "still on the books"
const LIVE = new Set(['active', 'today', 'upcoming', 'late', 'unscheduled', 'action_required', 'requires_invoicing', 'on_hold']);

const Q = `query($after: String) {
  jobs(first: 50, after: $after) {
    nodes {
      id jobNumber title jobStatus jobType startAt endAt
      client { id name isArchived }
      property { id address { street street1 street2 city province postalCode } }
      lineItems(first: 5) { nodes { name } }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}`;

const jobs = [];
let cursor = null, pages = 0;
for (;;) {
  const d = await jgql(Q, { after: cursor });
  jobs.push(...d.jobs.nodes);
  pages++;
  if (pages % 10 === 0) process.stderr.write(`  ...${jobs.length} jobs\n`);
  if (!d.jobs.pageInfo.hasNextPage) break;
  cursor = d.jobs.pageInfo.endCursor;
}

const isLive = (j) => LIVE.has(String(j.jobStatus).toLowerCase()) && !j.client?.isArchived;
const live = jobs.filter(isLive);

// Collapse to unique properties (ALL jobs, live and archived — the matcher needs both,
// so a waypoint can be attributed to the ex-customer it actually belongs to).
const props = new Map();
for (const j of jobs) {
  const a = j.property?.address || {};
  const street = (a.street || a.street1 || '').trim();
  const key = j.property?.id || `${street.toLowerCase()}|${a.postalCode || ''}`;
  if (!props.has(key)) {
    props.set(key, {
      propertyId: j.property?.id || null,
      client: j.client?.name || null,
      street, city: a.city || '', province: a.province || '', zip: a.postalCode || '',
      live: false,
      jobs: [],
    });
  }
  const row = props.get(key);
  if (isLive(j)) row.live = true;
  row.jobs.push({
    jobNumber: j.jobNumber,
    status: j.jobStatus,
    live: isLive(j),
    lineItems: (j.lineItems?.nodes || []).map(n => n.name),
  });
}

const rows = [...props.values()].sort((a, b) => (a.client || '').localeCompare(b.client || ''));
console.log(`properties: ${rows.length} total, ${rows.filter(r => r.live).length} with a live job`);
fs.writeFileSync(OUT, JSON.stringify({
  pulledAt: new Date().toISOString(),
  totalJobs: jobs.length,
  liveJobs: live.length,
  uniqueProperties: rows.length,
  statusBreakdown: jobs.reduce((m, j) => (m[j.jobStatus] = (m[j.jobStatus] || 0) + 1, m), {}),
  properties: rows,
}, null, 2));

console.log(`jobs pulled: ${jobs.length}`);
console.log(`status breakdown: ${JSON.stringify(jobs.reduce((m, j) => (m[j.jobStatus] = (m[j.jobStatus] || 0) + 1, m), {}))}`);
console.log(`live jobs: ${live.length}  ->  unique properties: ${rows.length}`);
console.log(`wrote ${OUT}`);
