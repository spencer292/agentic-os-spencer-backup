#!/usr/bin/env node
// build-defer-list.mjs — the Labor Day short-week deferral cut list.
//
// Spencer 2026-09-03: "we can defer jobs that are TMCP and do not have an add visit note or they
// are about to get a monthly visit, we can push the monthly visit out 1 week."
//
// So a visit in the target week is DEFERRABLE only when all of these hold:
//   * product is TMCP (line items, never jobType — Quick Fix is weekly by construction)
//   * the latest note shows NO activity: no catch, no miss, no L/A / M/A / H/A
//   * the latest note's next-action is not "Add visit" / "Weekly" / "2 weeks"
//   * the visit is not the job's SET (first visit — the day the customer was promised)
//
// READ-ONLY. Writes a plan JSON; it never touches Jobber.
// Usage: node build-defer-list.mjs 2026-09-07 2026-09-11 [outfile]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote } from '../jobber-notes-automation/parse-note.mjs';
import { productOf } from '../jobber-notes-automation/decide.mjs';

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
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
async function gql(query, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 400));
  return data.data;
}

const FROM = process.argv[2] || '2026-09-07';
const TO = process.argv[3] || '2026-09-11';
const OUT = process.argv[4] || '_defer_plan.json';
const after = `${FROM}T07:00:00Z`;
const before = `${TO}T23:59:59-07:00`;
const ptDate = s => new Date(new Date(s).getTime() - 7 * 3600e3).toISOString().slice(0, 10);
const dow = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// --- 1. the target week's visits, with their job ids ---
const visits = [];
let cursor = null;
for (let p = 0; p < 20; p++) {
  const afterArg = cursor ? `, after: "${cursor}"` : '';
  const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    nodes { id title startAt
      assignedUsers(first: 3) { nodes { name { full } } }
      property { address { city postalCode } }
      job { id jobNumber startAt } }
    pageInfo { hasNextPage endCursor } } }`)).visits;
  visits.push(...v.nodes);
  if (!v.pageInfo.hasNextPage) break;
  cursor = v.pageInfo.endCursor;
  await sleep(350);
}
console.log(`${visits.length} visits ${FROM}..${TO}`);

// --- 2. the jobs behind them: line items (product) + notes (what the tech found) ---
const ids = [...new Set(visits.filter(v => v.job).map(v => v.job.id))];
const JOB_SEL = `id jobNumber jobStatus startAt client { name }
  lineItems(first: 8) { nodes { name } }
  notes(last: 8) { nodes { __typename ... on JobNote { message createdAt } } }`;
const jobs = new Map();
const CHUNK = 15;
for (let i = 0; i < ids.length; i += CHUNK) {
  const chunk = ids.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { ${JOB_SEL} }`).join(' ')} }`;
  const d = await gql(q);
  for (const k of Object.keys(d)) if (d[k]) jobs.set(d[k].id, d[k]);
  process.stdout.write(`\r  jobs ${jobs.size}/${ids.length}`);
  if (i + CHUNK < ids.length) await sleep(550);
}
console.log('');

// --- 3. classify every visit ---
const ACTIVE = new Set(['Low', 'Moderate', 'High']);
const HOLD_ACTIONS = new Set(['Add visit', 'Weekly', '2 weeks', 'Return visit scheduled', 'Convert to annual']);
const rows = [];
for (const v of visits) {
  const job = v.job && jobs.get(v.job.id);
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || 'UNASSIGNED';
  const date = ptDate(v.startAt);
  const row = {
    visitId: v.id, jobNumber: job?.jobNumber ?? null, client: job?.client?.name || v.title || '',
    tech, date, day: dow(date),
    city: v.property?.address?.city || '', zip: (v.property?.address?.postalCode || '').slice(0, 5),
    product: null, activity: null, moles: null, misses: null, nextAction: null,
    noteAge: null, decision: null, why: null, deferTo: null,
  };
  if (!job) { row.decision = 'HOLD'; row.why = 'no job behind the visit'; rows.push(row); continue; }

  row.product = productOf((job.lineItems?.nodes || []).map(n => n.name));
  const notes = (job.notes?.nodes || []).filter(n => n && n.__typename === 'JobNote' && n.message);
  const latest = notes.length ? notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)) : null;

  if (job.startAt && ptDate(job.startAt) === date) { row.decision = 'HOLD'; row.why = 'this visit is the SET — the promised first day'; rows.push(row); continue; }
  if (row.product !== 'TMCP') { row.decision = 'HOLD'; row.why = `product is ${row.product} — only TMCP is deferrable`; rows.push(row); continue; }
  if (!latest) { row.decision = 'HOLD'; row.why = 'no visit note to read — cannot prove the property is quiet'; rows.push(row); continue; }

  const p = parseNote(latest.message);
  row.activity = p.activity; row.moles = p.moles; row.misses = p.misses; row.nextAction = p.nextAction;
  row.noteAge = Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(ptDate(latest.createdAt) + 'T12:00:00Z')) / 86400000);

  const caught = Number(p.moles) > 0;
  const missed = Number(p.misses) > 0;
  const active = caught || missed || ACTIVE.has(p.activity);

  if (active) {
    row.decision = 'HOLD';
    row.why = caught ? `caught ${p.moles}` : missed ? `missed ${p.misses} — a miss is activity` : `${p.activity} activity`;
  } else if (HOLD_ACTIONS.has(p.nextAction)) {
    row.decision = 'HOLD';
    row.why = `note says "${p.nextAction}"`;
  } else {
    row.decision = 'DEFER';
    row.why = `TMCP, quiet (${p.activity || 'no code'}, no catch, no miss), note says ${p.nextAction ? `"${p.nextAction}"` : 'nothing'}`;
    row.deferTo = addDays(date, 7); // same weekday, one week on — keeps it on its own day-tile
  }
  rows.push(row);
}

// --- 4. report ---
const PACE = { 'Cory Ventura': 17.3, 'Robert Norton': 17.7, 'Luke LaVergne': 19.1, 'Alias Franks': 21.3, 'Tavis Alexander': 19.0, 'Spencer Hill': 22.0, UNASSIGNED: 19.0 };
const defer = rows.filter(r => r.decision === 'DEFER');
const byTech = {};
for (const r of rows) {
  const t = (byTech[r.tech] = byTech[r.tech] || { total: 0, defer: 0, hold: 0, hrs: 0, products: {} });
  t.total++; t[r.decision === 'DEFER' ? 'defer' : 'hold']++;
  t.products[r.product || '?'] = (t.products[r.product || '?'] || 0) + 1;
  if (r.decision === 'DEFER') t.hrs += (PACE[r.tech] || 19) / 60;
}
console.log(`\nDEFERRABLE: ${defer.length} of ${rows.length} visits\n`);
console.log('TECH                TOTAL   DEFER    HOLD   HRS FREED   AFTER (h/day x4)');
for (const t of Object.keys(byTech).sort((a, b) => byTech[b].defer - byTech[a].defer)) {
  const x = byTech[t];
  const afterH = ((x.total - x.defer) * (PACE[t] || 19) / 60) / 4;
  console.log(t.padEnd(20) + String(x.total).padStart(5) + String(x.defer).padStart(8) + String(x.hold).padStart(8) + x.hrs.toFixed(1).padStart(12) + afterH.toFixed(1).padStart(19));
}
const holdWhy = {};
for (const r of rows) if (r.decision === 'HOLD') holdWhy[r.why.replace(/\d+/g, 'N')] = (holdWhy[r.why.replace(/\d+/g, 'N')] || 0) + 1;
console.log('\nWHY THE REST HOLD');
for (const [w, n] of Object.entries(holdWhy).sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(4) + '  ' + w);

fs.writeFileSync(path.resolve(__dirname, OUT), JSON.stringify({ builtAt: new Date().toISOString(), window: [FROM, TO], rule: 'TMCP + quiet note + no add-visit/weekly next-action + not the SET -> push 7 days', rows }, null, 1));
console.log(`\nplan -> ${OUT}  (READ-ONLY, nothing written to Jobber)`);
