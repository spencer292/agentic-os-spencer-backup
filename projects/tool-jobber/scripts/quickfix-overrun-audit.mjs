// quickfix-overrun-audit.mjs — READ ONLY. How many OPEN Quick Fix jobs have run past
// the 5-visit weekly series?
//
// Quick Fix ("The Quick Fix — One-Month Mole Control Program") is a 5-week WEEKLY series
// (Spencer 2026-08-05). Every Got Moles job is jobType RECURRING, so the product can only be
// read off the LINE ITEM, never off jobType. When the 5 weeks are used up and there is still
// activity the next step is a HUMAN/SALES decision — add one more visit, or sell a TMCP /
// another month — never an automatic add. This audit finds the jobs sitting in that state.
//
// Counts, per open Quick Fix job:
//   - visits COMPLETED so far      (what the customer has actually had)
//   - visits TOTAL on the job       (completed + still scheduled)
//   - median gap between visits     (proves the series really is weekly, not monthly)
//
// "Open right now" = job is in a live Jobber status (not archived). Archived Quick Fix jobs
// are correctly finished and are excluded.
//
// Usage (from repo root):
//   node projects/tool-jobber/scripts/quickfix-overrun-audit.mjs [--series=5] [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const dataDir = path.resolve(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const ENV_PATH = path.join(root, '.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const SERIES = +((argv.find((a) => a.startsWith('--series=')) || '').split('=')[1] || 5);
const AS_JSON = argv.includes('--json');

const TODAY = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const localDate = (iso) => (iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10) : null);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- auth (same shape as engine.mjs / audit-schedule.mjs) ----------
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
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : `${txt}\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null;
let tokenAt = 0;
async function getToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token;
  tokenAt = Date.now();
  return accessToken;
}
const onlyPermissionHides = (errs) => errs.every((e) => /hidden due to permissions/i.test(e.message || ''));
async function gql(query, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 6) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.error(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  }
  return data.data;
}

// ---------- Phase 1: every LIVE job ----------
const LIVE_STATUSES = ['active', 'upcoming', 'today', 'late', 'on_hold', 'action_required', 'requires_invoicing', 'unscheduled'];
const JOB_FIELDS = `id jobNumber title jobStatus jobType startAt endAt total jobberWebUri
  lineItems(first: 15) { nodes { name } }
  client { id name isArchived }`;

const jobs = new Map();
for (const status of LIVE_STATUSES) {
  let cursor = null; let n = 0; let total = null;
  for (;;) {
    const d = (await gql(`query { jobs(first: 25${cursor ? `, after: "${cursor}"` : ''}, filter: { status: ${status} }) {
      nodes { ${JOB_FIELDS} } pageInfo { endCursor hasNextPage } totalCount } }`)).jobs;
    for (const j of d.nodes) jobs.set(j.id, j);
    n += d.nodes.length; total = d.totalCount;
    cursor = d.pageInfo.endCursor;
    if (!d.pageInfo.hasNextPage) break;
    await sleep(300);
  }
  console.error(`jobs[${status}]: ${n}/${total}  (unique so far: ${jobs.size})`);
  await sleep(300);
}

// Product comes from the LINE ITEM, never jobType (Spencer 2026-08-05). Mixed dashes in the
// real names, and a second line item (`Repeat Customer Discount`) is common — scan them all.
const QF_RE = /quick fix/i;
const TMC_RE = /total mole control/i;
const lineNames = (j) => (j.lineItems?.nodes || []).map((n) => n.name || '');
const live = [...jobs.values()].filter((j) => j.jobStatus !== 'archived');
// A job carrying BOTH line items is a TMCP conversion, not an overrunning Quick Fix.
const qf = live.filter((j) => {
  const names = lineNames(j);
  return names.some((n) => QF_RE.test(n)) && !names.some((n) => TMC_RE.test(n));
});
console.error(`\nlive jobs: ${live.length}   Quick Fix (line item, TMCP excluded): ${qf.length}`);

// ---------- Phase 2: every visit on each Quick Fix job ----------
const CHUNK = 8;
const VISIT_SEL = `visits(first: 60) { totalCount nodes { id startAt endAt isComplete visitStatus } }`;
const withVisits = [];
for (let i = 0; i < qf.length; i += CHUNK) {
  const chunk = qf.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((j, k) => `j${k}: job(id: ${JSON.stringify(j.id)}) { id ${VISIT_SEL} }`).join(' ')} }`;
  const d = await gql(q);
  for (const key of Object.keys(d)) {
    if (!d[key]) continue;
    const job = qf.find((j) => j.id === d[key].id);
    if (job) withVisits.push({ ...job, visits: d[key].visits });
  }
  console.error(`  visits fetched: ${withVisits.length}/${qf.length}`);
  if (i + CHUNK < qf.length) await sleep(500);
}

// ---------- Phase 3: classify ----------
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const rows = withVisits.map((j) => {
  const all = (j.visits?.nodes || [])
    .map((v) => ({ date: localDate(v.startAt), done: v.isComplete, status: v.visitStatus }))
    .filter((v) => v.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  // "Had" = completed, or dated in the past (a past visit that was never marked complete still
  // consumed a week of the series).
  const had = all.filter((v) => v.done || v.date < TODAY);
  const future = all.filter((v) => !v.done && v.date >= TODAY);
  const gaps = [];
  for (let i = 1; i < all.length; i++) gaps.push(daysBetween(all[i - 1].date, all[i].date));
  const truncated = (j.visits?.totalCount || 0) > all.length;
  return {
    jobNumber: j.jobNumber,
    client: j.client?.name || '(no client)',
    status: j.jobStatus,
    title: j.title,
    webUri: j.jobberWebUri,
    total: j.total,
    firstVisit: all[0]?.date || null,
    lastCompleted: had[had.length - 1]?.date || null,
    nextVisit: future[0]?.date || null,
    visitsHad: had.length,
    visitsTotal: all.length,
    visitsScheduledAhead: future.length,
    medianGapDays: median(gaps),
    weekly: median(gaps) !== null && median(gaps) <= 10,
    truncated,
  };
});

const overrunHad = rows.filter((r) => r.visitsHad > SERIES);
const overrunTotal = rows.filter((r) => r.visitsTotal > SERIES);
const exhaustedNoNext = rows.filter((r) => r.visitsHad >= SERIES && !r.nextVisit);
const byCount = (rs) => {
  const m = new Map();
  for (const r of rs) m.set(r.visitsHad, (m.get(r.visitsHad) || 0) + 1);
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
};

const out = {
  runAt: TODAY,
  seriesLength: SERIES,
  liveJobs: live.length,
  quickFixOpen: rows.length,
  overrunByVisitsHad: overrunHad.length,
  overrunByVisitsTotal: overrunTotal.length,
  exhaustedWithNoNextVisit: exhaustedNoNext.length,
  distributionVisitsHad: byCount(rows),
  truncatedPagination: rows.filter((r) => r.truncated).map((r) => r.jobNumber),
  overrunDetail: overrunHad.sort((a, b) => b.visitsHad - a.visitsHad),
  allQuickFix: rows.sort((a, b) => b.visitsHad - a.visitsHad),
};

const outPath = path.join(dataDir, `quickfix-overrun-${TODAY}.json`);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

if (AS_JSON) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`\n=== Open Quick Fix audit — ${TODAY} (series = ${SERIES} weekly visits) ===`);
console.log(`Live jobs swept:                       ${live.length}`);
console.log(`Open Quick Fix jobs:                   ${rows.length}`);
console.log(`  > ${SERIES} visits ALREADY HAD:              ${overrunHad.length}`);
console.log(`  > ${SERIES} visits total (incl. scheduled):  ${overrunTotal.length}`);
console.log(`  at/past ${SERIES} with NO next visit booked: ${exhaustedNoNext.length}`);
console.log(`\nDistribution (visits had → jobs): ${out.distributionVisitsHad.map(([k, v]) => `${k}:${v}`).join('  ')}`);
if (out.truncatedPagination.length) console.log(`WARNING — visit list truncated at 60 for jobs: ${out.truncatedPagination.join(', ')}`);
console.log(`\n#job   visits(had/total)  medGap  last done    next        client`);
for (const r of overrunHad) {
  console.log(`#${String(r.jobNumber).padEnd(6)} ${String(r.visitsHad).padStart(2)}/${String(r.visitsTotal).padEnd(2)}          ${String(r.medianGapDays ?? '-').padStart(3)}d  ${(r.lastCompleted || '-').padEnd(11)} ${(r.nextVisit || 'none').padEnd(11)} ${r.client}`);
}
console.log(`\nSaved: ${outPath}`);
