// weekend-sweep.mjs — Got Moles works Monday-Friday ONLY (Spencer, 2026-07-10).
// Finds pending visits scheduled on a Saturday/Sunday and fixes each one:
//   - job already has a pending visit Mon-Fri of the FOLLOWING week -> weekend visit is
//     redundant (one visit per week) -> DELETE it
//   - otherwise -> MOVE it to the following Monday (visitEditSchedule; tech stays)
// Completed weekend visits are never touched. Dry-run by default; --execute applies.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/weekend-sweep.mjs [--ahead=45] [--execute]

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const arg = (k, dflt) => +((argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || dflt);
const AHEAD = arg('ahead', 45);
const EXECUTE = argv.includes('--execute');

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
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token;
  tokenAt = Date.now();
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));
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
    console.log(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  }
  return data.data;
}

const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const dow = date => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun, 6=Sat
// following Monday for a weekend date
const nextMonday = date => addDays(date, dow(date) === 6 ? 2 : 1);

const TODAY = ptToday();
const lines = [];
const say = s => { lines.push(s); console.log(s); };
say(`# Weekend sweep — ${TODAY} ${EXECUTE ? '⚡ EXECUTE' : '🔍 DRY RUN'} (Mon-Fri only; next ${AHEAD} days)`);
say('');

// scan all visits from today forward, group by job
const after = `${TODAY}T07:00:00Z`;
const before = `${addDays(TODAY, AHEAD)}T07:00:00Z`;
const byJob = new Map();
let cursor = null, pages = 0;
for (;;) {
  pages++;
  const a = cursor ? `, after: "${cursor}"` : '';
  const v = (await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    nodes { id startAt isComplete job { id jobNumber jobberWebUri client { name } } }
    pageInfo { hasNextPage endCursor } } }`)).visits;
  for (const n of v.nodes) {
    if (!n.job) continue;
    if (!byJob.has(n.job.id)) byJob.set(n.job.id, { job: n.job, visits: [] });
    byJob.get(n.job.id).visits.push({ id: n.id, date: String(n.startAt).slice(0, 10), isComplete: n.isComplete });
  }
  if (!v.pageInfo.hasNextPage || pages >= 30) break;
  cursor = v.pageInfo.endCursor;
  await sleep(400);
}

const moves = [], deletes = [];
const weekendCountByDate = {};
for (const { job, visits } of byJob.values()) {
  for (const v of visits) {
    const d = dow(v.date);
    if (d !== 0 && d !== 6) continue;
    weekendCountByDate[v.date] = (weekendCountByDate[v.date] || 0) + 1;
    if (v.isComplete) continue;
    const monday = nextMonday(v.date);
    const friday = addDays(monday, 4);
    const hasWeekday = visits.some(x => !x.isComplete && x.id !== v.id && x.date >= monday && x.date <= friday);
    if (hasWeekday) deletes.push({ ...v, job, monday });
    else moves.push({ ...v, job, monday });
  }
}
say(`Weekend visits found (all statuses): ${Object.entries(weekendCountByDate).sort().map(([d, n]) => `${d}: ${n}`).join(' | ') || 'none'}`);
say('');
say(`## Plan: MOVE ${moves.length} to the following Monday, DELETE ${deletes.length} (job already has a weekday visit that week).`);
say('');
for (const m of moves.sort((a, b) => a.date.localeCompare(b.date))) say(`- MOVE   [#${m.job.jobNumber}](${m.job.jobberWebUri}) ${m.job.client?.name || ''} | ${m.date} → ${m.monday}`);
for (const d of deletes.sort((a, b) => a.date.localeCompare(b.date))) say(`- DELETE [#${d.job.jobNumber}](${d.job.jobberWebUri}) ${d.job.client?.name || ''} | ${d.date} (weekday visit exists)`);

if (EXECUTE) {
  say('');
  let ok = 0, failed = 0;
  for (const m of moves) {
    const mut = `mutation { visitEditSchedule(id: ${JSON.stringify(m.id)}, input: { startAt: { date: "${m.monday}", timezone: "${TZ}" }, endAt: { date: "${m.monday}", timezone: "${TZ}" } }) { visit { startAt } userErrors { message } } }`;
    try {
      const r = (await gql(mut)).visitEditSchedule;
      if (r.userErrors?.length) { failed++; say(`  ❌ move #${m.job.jobNumber}: ${JSON.stringify(r.userErrors).slice(0, 140)}`); }
      else ok++;
    } catch (e) { failed++; say(`  ❌ move #${m.job.jobNumber}: ${String(e.message).slice(0, 140)}`); }
    await sleep(350);
  }
  for (const d of deletes) {
    try {
      const r = (await gql(`mutation { visitDelete(visitIds: [${JSON.stringify(d.id)}]) { visits { id } userErrors { message } } }`)).visitDelete;
      if (r.userErrors?.length) { failed++; say(`  ❌ delete #${d.job.jobNumber}: ${JSON.stringify(r.userErrors).slice(0, 140)}`); }
      else ok++;
    } catch (e) { failed++; say(`  ❌ delete #${d.job.jobNumber}: ${String(e.message).slice(0, 140)}`); }
    await sleep(350);
  }
  say('');
  say(`## Executed: ${ok} ok, ${failed} failed.`);
} else {
  say('\nNo changes made. Re-run with --execute to apply.');
}

const dir = path.join(__dirname, 'runs');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `weekend-sweep-${TODAY}${EXECUTE ? '-executed' : '-dryrun'}.md`);
fs.writeFileSync(file, lines.join('\n') + '\n');
console.log(`\nReport written: ${file}`);
