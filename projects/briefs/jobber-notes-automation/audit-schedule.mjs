// audit-schedule.mjs — expected-vs-actual schedule audit + duplicate-visit detector.
//
// Replaces the manual "run the checklist database against the following week" check:
//   A. MISSED FOLLOW-UPS — for each of the past N days, run the engine's dry-run logic;
//      any PULL/ADD still outstanding means a note implied a follow-up that never made
//      it onto the schedule (or is in the wrong week).
//   B. CADENCE GAPS — recently visited jobs with NO upcoming visit at all (the stranded-
//      cadence case the scheduling rules exist to prevent). ARCHIVED jobs are excluded:
//      a closed Quick Fix (5-week program, e.g. "The Quick Fix — One-Month Mole Control
//      Program") correctly ends with nothing upcoming (verified 2026-07-10 — 10 of 12
//      first-run "stranded" jobs were exactly this). A non-archived job with nothing
//      upcoming is still flagged, WITH its status — requires_invoicing there means
//      "serviced but never billed", which is its own catch.
//   C. DOUBLE VISITS — any job with two upcoming visits suspiciously close together:
//      same-day pair = definite duplicate; pair 1..--gap days apart (default 5) = probable.
//      Pairs 6-10 days apart are NOT itemized: active trapping jobs legitimately run
//      weekly cadences (verified 2026-07-10 — long exact-7d chains all over the schedule),
//      so a 6-10d gap is normal service, not a dupe. They're counted for reference only.
//
// REPORT ONLY — never mutates the schedule. Deciding which duplicate to remove is a
// human call. Writes runs/audit-{today}.md and prints a summary.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/audit-schedule.mjs [--days-back=7] [--ahead=45] [--gap=10]

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const ENGINE = path.join(__dirname, 'engine.mjs');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const arg = (k, dflt) => +((argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || dflt);
const DAYS_BACK = arg('days-back', 7);
const AHEAD = arg('ahead', 45);
const GAP = arg('gap', 5);

const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// ---------- auth (persist rotated refresh token, same as engine.mjs) ----------
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
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
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

const TODAY = ptToday();
const lines = [];
const say = s => { lines.push(s); console.log(s); };

say(`# Schedule audit — ${TODAY}`);
say('');

// ── A. Missed follow-ups: engine dry-run over the past N days ────────────────
say(`## A. Follow-ups from notes, last ${DAYS_BACK} days`);
say('');
const missed = [];
const noUpcoming = [];
for (let i = 1; i <= DAYS_BACK; i++) {
  const date = addDays(TODAY, -i);
  let out;
  try {
    out = execFileSync('node', [ENGINE, `--date=${date}`, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    say(`- ${date}: engine failed — ${String(e.message).slice(0, 160)}`);
    continue;
  }
  const { plans } = JSON.parse(out.slice(out.indexOf('{')));
  for (const p of plans) {
    if (p.action === 'PULL' || p.action === 'ADD') missed.push({ date, ...p });
    if (!p.nextVisit) noUpcoming.push({ date, ...p });
  }
  say(`- ${date}: ${plans.length} noted visits — outstanding follow-ups: ${plans.filter(p => p.action === 'PULL' || p.action === 'ADD').length}`);
}
say('');
if (missed.length) {
  say(`### ⚠ ${missed.length} follow-up(s) implied by a note but NOT on the schedule:`);
  for (const m of missed) say(`- ${m.date} | [#${m.jobNumber}](${m.webUri}) ${m.client} | note said "${m.nextAction}" → should be ~${m.target} | next scheduled: ${m.nextVisit || 'NONE'}`);
} else {
  say('### ✅ No missing follow-ups — every noted next-action is on the schedule.');
}
say('');

// ── B. Cadence gaps (RECURRING jobs only — one-off jobs legitimately end) ─────
say('## B. Cadence gaps (recurring jobs visited recently, nothing upcoming)');
say('');
const gapsOpen = noUpcoming.filter(g => g.jobStatus !== 'archived');
const gapsClosed = noUpcoming.length - gapsOpen.length;
if (gapsOpen.length) {
  for (const g of gapsOpen) {
    const statusNote = g.jobStatus === 'requires_invoicing' ? ' — 💰 REQUIRES INVOICING (serviced, never billed)' : ` — status: ${g.jobStatus}`;
    say(`- ⚠ [#${g.jobNumber}](${g.webUri}) ${g.client} (${g.jobType.toLowerCase().replace('_', '-')}, visited ${g.date}) has NO upcoming visit${statusNote}`);
  }
} else {
  say('✅ Every open job visited in the window has an upcoming visit.');
}
if (gapsClosed) say(`\n(${gapsClosed} archived/closed job(s) with no upcoming visit — completed programs, e.g. Quick Fix — not flagged.)`);
say('');

// ── C. Double visits in the next AHEAD days ──────────────────────────────────
say(`## C. Duplicate scan — upcoming ${AHEAD} days`);
say('');
const after = `${TODAY}T07:00:00Z`;
const before = `${addDays(TODAY, AHEAD)}T07:00:00Z`;
const byJob = new Map();
let cursor = null, pages = 0, totalVisits = 0;
for (;;) {
  pages++;
  const afterArg = cursor ? `, after: "${cursor}"` : '';
  const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    nodes { id startAt job { id jobNumber jobberWebUri client { name } } }
    pageInfo { hasNextPage endCursor } } }`)).visits;
  for (const n of v.nodes) {
    if (!n.job) continue;
    totalVisits++;
    if (!byJob.has(n.job.id)) byJob.set(n.job.id, { job: n.job, visits: [] });
    byJob.get(n.job.id).visits.push({ id: n.id, date: String(n.startAt).slice(0, 10) });
  }
  if (!v.pageInfo.hasNextPage || pages >= 30) break;
  cursor = v.pageInfo.endCursor;
  await sleep(400);
}
say(`Scanned ${totalVisits} upcoming visits across ${byJob.size} jobs (${pages} page(s)).`);
say('');
let definite = 0, probable = 0, weeklyish = 0;
const dupes = [];
for (const { job, visits } of byJob.values()) {
  if (visits.length < 2) continue;
  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1].date, sorted[i].date);
    if (gap === 0) { definite++; dupes.push(`- 🔴 SAME-DAY DOUBLE | [#${job.jobNumber}](${job.jobberWebUri}) ${job.client?.name || ''} | ${sorted[i].date}`); }
    else if (gap <= GAP) { probable++; dupes.push(`- 🟠 ${gap}d apart | [#${job.jobNumber}](${job.jobberWebUri}) ${job.client?.name || ''} | ${sorted[i - 1].date} + ${sorted[i].date}`); }
    else if (gap <= 10) weeklyish++;
  }
}
for (const d of dupes.sort()) say(d);
if (!definite && !probable) say('✅ No duplicate-looking visit pairs found.');
say('');
say(`(${weeklyish} pair(s) 6-10 days apart not flagged — weekly service cadence is normal on active jobs.)`);
say('');
say(`## Summary: ${missed.length} missing follow-up(s), ${gapsOpen.length} open job(s) with nothing upcoming, ${definite} same-day double(s), ${probable} close pair(s) ≤${GAP}d.`);

const dir = path.join(__dirname, 'runs');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `audit-${TODAY}.md`);
fs.writeFileSync(file, lines.join('\n') + '\n');
console.log(`\nReport written: ${file}`);
