// dedupe-visits.mjs — enforce ONE visit per job per calendar week (Mon-Sun).
// Spencer's rule (2026-07-10): "We only do one visit per week." Any job with 2+ visits
// in the same week keeps exactly one; the rest are deleted via visitDelete.
//
// Keeper rules (safety-ordered):
//   1. COMPLETED visits are never deleted (service history). If a week already has a
//      completed visit, every PENDING visit that week is a duplicate.
//   2. Otherwise keep the EARLIEST pending visit — if any day-before arrival-window email
//      went out, it went out for the earliest date, so the customer's expectation holds.
//   3. Same-day tie-break: clientConfirmed > committed time window (not allDay) >
//      has assigned tech > oldest createdAt.
//
// Dry-run by default; --execute performs the deletions (batched visitDelete).
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/dedupe-visits.mjs [--ahead=45] [--execute]

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

// ---------- auth ----------
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

// ---------- date helpers ----------
const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
// Monday of the calendar week containing this date (weeks run Mon-Sun)
function weekOf(date) {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

const TODAY = ptToday();
const lines = [];
const say = s => { lines.push(s); console.log(s); };
say(`# Visit dedupe — one visit per job per week — ${TODAY} ${EXECUTE ? '⚡ EXECUTE' : '🔍 DRY RUN'}`);
say('');

// ---------- scan upcoming visits ----------
const after = `${TODAY}T07:00:00Z`;
const before = `${addDays(TODAY, AHEAD)}T07:00:00Z`;
const byJob = new Map();
let cursor = null, pages = 0, total = 0;
for (;;) {
  pages++;
  const a = cursor ? `, after: "${cursor}"` : '';
  const v = (await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    nodes { id startAt allDay isComplete clientConfirmed createdAt
            assignedUsers(first: 3) { nodes { name { full } } }
            job { id jobNumber jobberWebUri client { name } } }
    pageInfo { hasNextPage endCursor } } }`)).visits;
  for (const n of v.nodes) {
    if (!n.job) continue;
    total++;
    if (!byJob.has(n.job.id)) byJob.set(n.job.id, { job: n.job, visits: [] });
    byJob.get(n.job.id).visits.push({
      id: n.id, startAt: n.startAt, date: String(n.startAt).slice(0, 10),
      allDay: n.allDay, isComplete: n.isComplete, clientConfirmed: n.clientConfirmed,
      createdAt: n.createdAt, techs: (n.assignedUsers.nodes || []).map(u => u.name.full),
    });
  }
  if (!v.pageInfo.hasNextPage || pages >= 30) break;
  cursor = v.pageInfo.endCursor;
  await sleep(400);
}
say(`Scanned ${total} visits (next ${AHEAD} days) across ${byJob.size} jobs.`);
say('');

// ---------- build the plan ----------
const toDelete = [];
let groups = 0;
for (const { job, visits } of byJob.values()) {
  const byWeek = new Map();
  for (const v of visits) {
    const w = weekOf(v.date);
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w).push(v);
  }
  for (const [week, group] of byWeek) {
    if (group.length < 2) continue;
    groups++;
    const completed = group.filter(v => v.isComplete);
    const pending = group.filter(v => !v.isComplete);
    let keeper, extras;
    if (completed.length) {
      keeper = completed[0];       // completed = the visit that actually happened
      extras = pending;            // never delete completed history
    } else {
      const ranked = [...pending].sort((x, y) =>
        x.date.localeCompare(y.date) ||                                   // earliest date
        (y.clientConfirmed - x.clientConfirmed) ||                        // confirmed first
        (x.allDay - y.allDay) ||                                          // committed window first
        ((y.techs.length ? 1 : 0) - (x.techs.length ? 1 : 0)) ||          // has tech first
        String(x.createdAt).localeCompare(String(y.createdAt)));          // oldest first
      keeper = ranked[0];
      extras = ranked.slice(1);
    }
    if (!extras.length) continue;
    say(`- [#${job.jobNumber}](${job.jobberWebUri}) ${job.client?.name || ''} — week of ${week}: ${group.length} visits`);
    say(`    KEEP   ${keeper.date}${keeper.isComplete ? ' (completed)' : ''}${keeper.clientConfirmed ? ' (client-confirmed)' : ''} ${keeper.techs.join('/') || '(no tech)'}`);
    for (const x of extras) {
      say(`    DELETE ${x.date} ${x.techs.join('/') || '(no tech)'} (created ${String(x.createdAt).slice(0, 10)})`);
      toDelete.push({ id: x.id, jobNumber: job.jobNumber, client: job.client?.name || '', date: x.date });
    }
  }
}
say('');
say(`## Plan: ${groups} same-week group(s) → ${toDelete.length} visit(s) to delete.`);

// ---------- execute ----------
if (EXECUTE && toDelete.length) {
  say('');
  // One visit per call: a single bad id inside a batched visitDelete 422s the whole
  // batch with an empty body, so batching loses more than it saves here.
  let ok = 0, failed = 0;
  for (const b of toDelete) {
    try {
      const r = (await gql(`mutation { visitDelete(visitIds: [${JSON.stringify(b.id)}]) { visits { id } userErrors { message } } }`)).visitDelete;
      if (r.userErrors?.length) { failed++; say(`  ❌ #${b.jobNumber} ${b.client} ${b.date}: ${JSON.stringify(r.userErrors).slice(0, 160)}`); }
      else { ok++; say(`  ✅ deleted #${b.jobNumber} ${b.client} ${b.date}`); }
    } catch (e) {
      failed++;
      say(`  ❌ #${b.jobNumber} ${b.client} ${b.date}: ${String(e.message).slice(0, 160)}`);
    }
    await sleep(400);
  }
  say('');
  say(`## Executed: ${ok} deleted, ${failed} failed.`);
} else if (!EXECUTE) {
  say('\nNo deletions made. Re-run with --execute to apply.');
}

const dir = path.join(__dirname, 'runs');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `dedupe-${TODAY}${EXECUTE ? '-executed' : '-dryrun'}.md`);
fs.writeFileSync(file, lines.join('\n') + '\n');
console.log(`\nReport written: ${file}`);
