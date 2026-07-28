// ninety-weekly-push.mjs — compute Got Moles weekly scorecard values from
// Jobber + CallRail and push them to Ninety.io. Run from repo root:
//   node projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs [--from 2026-04-26] [--to 2026-07-18] [--dry-run]
// Default window: the last 3 completed weeks (self-healing for late data).
// KPI id mapping + week-start config: ninety-kpi-map.json (same folder).
// Reads NINETY_API_TOKEN, CALLRAIL_API_KEY, JOBBER_* from repo-root .env. Never prints secrets.
// Idempotent: Ninety score POST is create-or-update per (kpi, periodStartDate).
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const briefDir = path.resolve(here, '..');

// ---------- env ----------
const env = {};
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const NINETY = env.NINETY_API_TOKEN;
const CALLRAIL = env.CALLRAIL_API_KEY || env.CALLRAIL_API_TOKEN || env.CALLRAIL_TOKEN;
if (!NINETY) die('NINETY_API_TOKEN missing from .env');
if (!CALLRAIL) die('CallRail key missing from .env');
function die(msg) { console.error('FATAL: ' + msg); process.exit(1); }

// ---------- args ----------
const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry-run');

// ---------- weeks (Pacific time, week start per config; board is Monday-start) ----------
const cfg = JSON.parse(readFileSync(path.join(here, 'ninety-kpi-map.json'), 'utf8'));
const TZ = cfg.timezone;
const WEEK_START = cfg.weekStartDay; // 0 = Sunday

// Date-only string for a timestamp, rendered in Pacific time.
const ptDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const dow = (dstr) => new Date(dstr + 'T12:00:00Z').getUTCDay(); // day-of-week of a plain date
const addDays = (dstr, n) => { const d = new Date(dstr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekStartOf = (dstr) => addDays(dstr, -((dow(dstr) - WEEK_START + 7) % 7));

const today = ptDate(new Date().toISOString());
const currentWeekStart = weekStartOf(today);
const defaultFrom = addDays(currentWeekStart, -21);
const from = weekStartOf(argVal('--from') || defaultFrom);
const toArg = argVal('--to');
// Raw Jobber/CallRail pulls are slow (a 52-week backfill is ~10 min of paging).
// --cache reuses a saved pull for the same window so a push failure never re-pulls.
const USE_CACHE = args.includes('--cache');
// last completed week = the week before the current one; --include-current also
// pushes the in-progress week (flow metrics update as the week fills in)
const lastCompletedStart = args.includes('--include-current') ? currentWeekStart : addDays(currentWeekStart, -7);
const lastWeekStart = toArg ? weekStartOf(toArg) : lastCompletedStart;

const weeks = [];
for (let w = from; w <= lastWeekStart; w = addDays(w, 7)) weeks.push(w);
if (!weeks.length) die(`No weeks in range ${from}..${lastWeekStart}`);
const inWeek = (iso, w) => { const d = ptDate(iso); return d >= w && d <= addDays(w, 6); };
const rangeStartISO = new Date(from + 'T00:00:00-07:00').toISOString();

const WEEK_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][WEEK_START];
console.log(`Weeks: ${weeks[0]} .. ${weeks[weeks.length - 1]} (${weeks.length} weeks, ${WEEK_NAME}-start, ${TZ})${DRY ? ' [DRY RUN]' : ''}`);

// ---------- Jobber client (mirrors .claude/skills/tool-jobber/scripts/jobber-api.mjs) ----------
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
let jobberToken = null;
async function jobberAccessToken() {
  if (jobberToken) return jobberToken;
  const envNow = {};
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) envNow[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: envNow.JOBBER_CLIENT_ID, client_secret: envNow.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: envNow.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json();
  if (!res.ok) die(`Jobber token refresh failed HTTP ${res.status}`);
  if (d.refresh_token && d.refresh_token !== envNow.JOBBER_REFRESH_TOKEN) {
    let text = readFileSync(path.join(root, '.env'), 'utf8');
    text = text.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`);
    writeFileSync(path.join(root, '.env'), text);
  }
  jobberToken = d.access_token;
  return jobberToken;
}
async function gql(query, variables, attempt = 0) {
  const token = await jobberAccessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json().catch(() => ({}));
  const throttled = data.errors?.some((e) => e.extensions?.code === 'THROTTLED');
  if ((res.status === 429 || throttled) && attempt < 12) {
    await sleep(Math.min(8000 * (attempt + 1), 60000));
    return gql(query, variables, attempt + 1);
  }
  if (res.status === 401 && attempt < 2) { jobberToken = null; return gql(query, variables, attempt + 1); }
  if (!res.ok || data.errors) die(`Jobber GQL failed: HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}`);
  return data.data;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sweep(connection, queryFn, label) {
  const out = [];
  let cursor = null;
  for (;;) {
    const d = await queryFn(cursor);
    const conn = d[connection];
    out.push(...conn.nodes);
    process.stdout.write(`\r  ${label}: ${out.length}${conn.pageInfo.hasNextPage ? '...' : ''}   `);
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
    await sleep(150);
  }
  console.log('');
  return out;
}

// ---------- pulls ----------
// Quotes are matched to a week by sentAt (quoted) and transitionedAt (converted); a quote can
// convert months after it was created, so the quote pull reaches 180 days behind the window.
const quoteFromISO = new Date(addDays(from, -180) + 'T00:00:00-07:00').toISOString();

async function pullAll() {
  console.log('Pulling Jobber…');
  const invoices = await sweep('invoices', (after) => gql(
    `query($after:String){ invoices(first:100, after:$after, filter:{ issuedDate:{ after:"${rangeStartISO}" } }){
       nodes{ invoiceNumber issuedDate invoiceStatus amounts{ total invoiceBalance } }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'invoices (in window)');

  const quotes = await sweep('quotes', (after) => gql(
    `query($after:String){ quotes(first:50, after:$after, filter:{ createdAt:{ after:"${quoteFromISO}" } }){
       nodes{ quoteNumber createdAt sentAt transitionedAt quoteStatus amounts{ total } lineItems(first:15){ nodes{ name } } }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'quotes (window -180d)');

  const visits = await sweep('visits', (after) => gql(
    `query($after:String){ visits(first:100, after:$after, filter:{ startAt:{ after:"${rangeStartISO}", before:"${new Date(addDays(lastWeekStart, 7) + 'T00:00:00-07:00').toISOString()}" } }){
       nodes{ startAt isComplete }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'visits (in window)');

  const clients = await sweep('clients', (after) => gql(
    `query($after:String){ clients(first:100, after:$after, filter:{ createdAt:{ after:"${rangeStartISO}" } }){
       nodes{ createdAt isLead }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'clients (in window)');

  const JOB_FIELDS = 'jobNumber title createdAt startAt endAt completedAt jobStatus jobType lineItems(first:15){ nodes{ name totalPrice } }';
  const jobsRecurring = await sweep('jobs', (after) => gql(
    `query($after:String){ jobs(first:50, after:$after, filter:{ jobType: RECURRING, endAt:{ after:"${rangeStartISO}" } }){
       nodes{ ${JOB_FIELDS} }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'jobs (recurring, endAt in/after window)');

  const jobsCreated = await sweep('jobs', (after) => gql(
    `query($after:String){ jobs(first:50, after:$after, filter:{ createdAt:{ after:"${rangeStartISO}" } }){
       nodes{ ${JOB_FIELDS} }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'jobs (created in window)');

  const jobsCompleted = await sweep('jobs', (after) => gql(
    `query($after:String){ jobs(first:50, after:$after, filter:{ completedAt:{ after:"${rangeStartISO}" } }){
       nodes{ ${JOB_FIELDS} }
       pageInfo{ hasNextPage endCursor } } }`, { after }), 'jobs (completed in window)');

  console.log('Pulling CallRail…');
  // CallRail retains 2 years and this account has no calls before 2026-04-30; asking for
  // earlier dates is a hard 400, so the call pull is clamped to the data floor.
  const CR_FLOOR = '2026-04-01';
  const crFrom = weeks[0] < CR_FLOOR ? CR_FLOOR : weeks[0];
  const calls = [];
  for (let page = 1; ; page++) {
    const d = await crApi(`a/${crAcct}/calls.json`, {
      start_date: crFrom, end_date: addDays(weeks[weeks.length - 1], 6),
      per_page: 250, page, fields: 'answered,direction,start_time',
    });
    calls.push(...(d.calls || []));
    if (!d.calls?.length || page >= (d.total_pages || 1)) break;
    await sleep(400);
  }
  console.log(`  calls: ${calls.length}`);
  return { invoices, quotes, visits, clients, jobsRecurring, jobsCreated, jobsCompleted, calls };
}

const crApi = async (p, params) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${CALLRAIL}"` } });
  if (!res.ok) die(`CallRail ${res.status} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};
const crAcct = (await crApi('a.json', {})).accounts[0].id;

const cacheFile = path.join(briefDir, 'data', `_pull-cache_${from}_${lastWeekStart}.json`);
let raw;
if (USE_CACHE && existsSync(cacheFile)) {
  raw = JSON.parse(readFileSync(cacheFile, 'utf8'));
  console.log(`Using cached pull: ${path.relative(root, cacheFile)}`);
} else {
  raw = await pullAll();
  mkdirSync(path.dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(raw));
  console.log(`Cached pull -> ${path.relative(root, cacheFile)}`);
}
const { invoices, quotes, visits, clients, jobsRecurring, jobsCreated, jobsCompleted, calls } = raw;

// Past-due is point-in-time — never served from cache.
const pastDueInvoices = await sweep('invoices', (after) => gql(
  `query($after:String){ invoices(first:100, after:$after, filter:{ status: past_due }){
     nodes{ invoiceNumber amounts{ invoiceBalance } }
     pageInfo{ hasNextPage endCursor } } }`, { after }), 'invoices (past due, live)');

// ---------- TMCP client tags (point-in-time; Jobber's Tag type is {id,label} with NO timestamp) ----------
// The churn tag can say *who* churned but never *when*, so weekly churn cannot be backfilled.
// Instead we snapshot the tag counts every run and derive the weekly number from the delta —
// the cron builds the history the tag itself doesn't carry.
const CHURN_TAG = /^TMCP\s*Churned$/i;
const ACTIVE_TAG = /^TMCP\s*-\s*Active$/i;
const taggedClients = await sweep('clients', (after) => gql(
  `query($after:String){ clients(first:100, after:$after){
     nodes{ id tags(first:20){ nodes{ label } } }
     pageInfo{ hasNextPage endCursor } } }`, { after }), 'clients (tag sweep, live)');
const labelsOf = (c) => (c.tags?.nodes || []).map((t) => t.label || '');
const tagNow = {
  churned: taggedClients.filter((c) => labelsOf(c).some((l) => CHURN_TAG.test(l))).length,
  activeTagged: taggedClients.filter((c) => labelsOf(c).some((l) => ACTIVE_TAG.test(l))).length,
};

const snapFile = path.join(briefDir, 'data', 'tmcp-tag-snapshots.json');
const snaps = existsSync(snapFile) ? JSON.parse(readFileSync(snapFile, 'utf8')) : {};
const priorWeeks = Object.keys(snaps).filter((w) => w < currentWeekStart).sort();
const priorWeek = priorWeeks.length ? priorWeeks[priorWeeks.length - 1] : null;
const priorSnap = priorWeek ? snaps[priorWeek] : null;
// Churn is a delta between snapshots. Negative means the tag was removed from someone — clamp to 0.
const churnDelta = priorSnap ? Math.max(0, tagNow.churned - priorSnap.churned) : null;
// The delta accumulated between the prior snapshot and now, so it belongs to the week the PRIOR
// snapshot was taken in — not the week we're standing in. On a Monday cron that is precisely the
// week that just closed. Attributing it to currentWeekStart would shift every number a week late.
const churnWeek = priorWeek;
console.log(`\nTMCP tags (live): ${tagNow.activeTagged} clients "TMCP - Active", ${tagNow.churned} "TMCP Churned"` +
  (priorSnap ? ` | prior snapshot ${priorWeek} churned=${priorSnap.churned} -> delta ${churnDelta} (attributed to week ${churnWeek})`
             : ' | no prior snapshot — recording baseline, churn delta lands next run'));

// ---------- classification ----------
const TMC_RE = /total mole control|tmcp/i;
const QF_RE = /quick fix/i;
const hasLine = (obj, re) => (obj.lineItems?.nodes || []).some((li) => re.test(li.name || '')) || re.test(obj.title || '');

const tmcRecurring = jobsRecurring.filter((j) => hasLine(j, TMC_RE) && j.startAt && j.endAt && (new Date(j.endAt) - new Date(j.startAt)) > 45 * 86400000);
// monthly $ for a TMC job: max line price that looks like a monthly rate (25..400)
const monthlyOf = (j) => {
  const prices = (j.lineItems?.nodes || []).map((li) => li.totalPrice).filter((p) => p >= 25 && p <= 400);
  return prices.length ? Math.max(...prices) : 0;
};
const cancelStatuses = new Set(['archived']);
const tmcActiveOn = (dstr) => tmcRecurring.filter((j) => ptDate(j.startAt) <= dstr && ptDate(j.endAt) >= dstr && !(cancelStatuses.has(j.jobStatus) && ptDate(j.endAt) < today));

// ---------- compute ----------
const rows = {};
for (const w of weeks) {
  const wEnd = addDays(w, 6);
  const weekCalls = calls.filter((c) => c.direction?.includes('inbound') && inWeek(c.start_time, w));
  const quotedIn = (re) => quotes.filter((q) => hasLine(q, re) && inWeek(q.sentAt || q.createdAt, w)).length;
  const convertedIn = (re) => quotes.filter((q) => q.quoteStatus === 'converted' && hasLine(q, re) && q.transitionedAt && inWeek(q.transitionedAt, w)).length;
  rows[w] = {
    phone_calls: weekCalls.length,
    missed_calls: weekCalls.filter((c) => c.answered === false).length,
    new_clients: clients.filter((c) => !c.isLead && inWeek(c.createdAt, w)).length,
    total_revenue: Math.round(invoices.filter((i) => inWeek(i.issuedDate, w)).reduce((s, i) => s + (i.amounts?.total || 0), 0)),
    client_visits: visits.filter((v) => v.isComplete && inWeek(v.startAt, w)).length,
    tmcp_quoted: quotedIn(TMC_RE),
    tmcp_converted: convertedIn(TMC_RE),
    qf_quoted: quotedIn(QF_RE),
    qf_converted: convertedIn(QF_RE),
    quick_fix_created: jobsCreated.filter((j) => hasLine(j, QF_RE) && inWeek(j.createdAt, w)).length,
    qf_job_closed: jobsCompleted.filter((j) => hasLine(j, QF_RE) && j.completedAt && inWeek(j.completedAt, w)).length,
    total_jobs_created: jobsCreated.filter((j) => inWeek(j.createdAt, w)).length,
    tmcp_active: tmcActiveOn(wEnd).length,
    tmcp_net_new: tmcRecurring.filter((j) => inWeek(j.startAt, w)).length - tmcRecurring.filter((j) => inWeek(j.endAt, w)).length,
    tmcp_cancellations: tmcRecurring.filter((j) => inWeek(j.endAt, w)).length,
    tmcp_mrr: Math.round(tmcActiveOn(wEnd).reduce((s, j) => s + monthlyOf(j), 0)),
  };
}
// past-due is point-in-time -> current week only
const pastDueCount = pastDueInvoices.length;
const pastDueTotal = Math.round(pastDueInvoices.reduce((s, i) => s + (i.amounts?.invoiceBalance || 0), 0));

// ---------- report ----------
const keys = Object.keys(cfg.metrics).filter((k) => !cfg.metrics[k].currentWeekOnly);
console.log('\nweek        ' + keys.map((k) => k.slice(0, 10).padStart(11)).join(''));
for (const w of weeks) console.log(w + '  ' + keys.map((k) => String(rows[w][k]).padStart(11)).join(''));
console.log(`\npast_due_invoices (point-in-time, week ${currentWeekStart}): count=${pastDueCount} $${pastDueTotal}`);

// ---------- push ----------
const nApi = async (method, p, body) => {
  const res = await fetch('https://api.public.ninety.io/v1' + p, {
    method,
    headers: { Authorization: `Bearer ${NINETY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json().catch(() => null);
};

let pushed = 0, skipped = [], failed = [];
const floored = {}; // metric -> weeks left blank because they predate its data floor
if (!DRY) {
  for (const [key, m] of Object.entries(cfg.metrics)) {
    if (!m.enabled || !m.kpiId) { skipped.push(key); continue; }
    if (m.currentWeekOnly) {
      try {
        await nApi('POST', `/scorecard/kpis/${m.kpiId}/scores`, { value: pastDueCount, periodStartDate: currentWeekStart });
        await nApi('POST', `/scorecard/kpis/${m.kpiId}/notes`, { note: `$${pastDueTotal.toLocaleString('en-US')} past due across ${pastDueCount} invoices (auto)`, periodStartDate: currentWeekStart });
        pushed++;
      } catch (e) { failed.push(`${key}@${currentWeekStart}: ${e.message}`); }
      continue;
    }
    if (m.tagDelta) {
      // Churn = change in the "TMCP Churned" tag count since the last snapshot. The very first
      // run has nothing to diff against, so it records the baseline and pushes nothing —
      // pushing the standing total (20) as one week's churn would be flatly wrong.
      if (churnDelta === null) { skipped.push(`${key} (no prior snapshot — baseline recorded)`); continue; }
      try {
        await nApi('POST', `/scorecard/kpis/${m.kpiId}/scores`, { value: churnDelta, periodStartDate: churnWeek });
        await nApi('POST', `/scorecard/kpis/${m.kpiId}/notes`, { note: `${churnDelta} newly tagged "TMCP Churned" during this week (${tagNow.churned} tagged in total as of ${today}). The tag carries no timestamp, so this is a week-over-week snapshot delta, not a Jobber date (auto)`, periodStartDate: churnWeek });
        pushed++;
      } catch (e) { failed.push(`${key}@${churnWeek}: ${e.message}`); }
      continue;
    }
    for (const w of weeks) {
      if (m.dataFloor && w < m.dataFloor) { floored[key] = (floored[key] || 0) + 1; continue; } // pre-history: blank, not a false 0
      try {
        await nApi('POST', `/scorecard/kpis/${m.kpiId}/scores`, { value: rows[w][key], periodStartDate: w });
        pushed++;
        await sleep(60);
      } catch (e) { failed.push(`${key}@${w}: ${e.message}`); }
    }
  }

  // Surface the tag-vs-job gap on the board itself rather than only in the run log: the job-derived
  // active count can't see silent cancellations, the tag can.
  // Anchor to the newest week actually computed — without --include-current there is no row for
  // currentWeekStart, and a Monday cron runs exactly that way.
  const noteWeek = weeks[weeks.length - 1];
  const activeKpi = cfg.metrics.tmcp_active;
  if (activeKpi?.enabled && activeKpi.kpiId && rows[noteWeek]) {
    const gap = rows[noteWeek].tmcp_active - tagNow.activeTagged;
    try {
      await nApi('POST', `/scorecard/kpis/${activeKpi.kpiId}/notes`, {
        note: `${rows[noteWeek].tmcp_active} from Jobber recurring jobs vs ${tagNow.activeTagged} clients tagged "TMCP - Active" as of ${today} (gap ${gap >= 0 ? '+' : ''}${gap}; jobs are per-property, clients are per-account, and a job keeps a future end date after a silent cancellation). ${tagNow.churned} tagged "TMCP Churned". (auto)`,
        periodStartDate: noteWeek,
      });
    } catch (e) { failed.push(`tmcp_active note@${noteWeek}: ${e.message}`); }
  }

  // Record this week's tag snapshot only after a successful run, so a failed run can't
  // poison next week's delta with a baseline nobody pushed against.
  snaps[currentWeekStart] = { ...tagNow, recordedAt: new Date().toISOString() };
  mkdirSync(path.dirname(snapFile), { recursive: true });
  writeFileSync(snapFile, JSON.stringify(snaps, null, 2));
}

// ---------- log ----------
const runDir = path.join(briefDir, 'scorecard-runs');
mkdirSync(runDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const log = {
  ranAt: new Date().toISOString(), dryRun: DRY, weeks, rows,
  pastDue: { count: pastDueCount, total: pastDueTotal, week: currentWeekStart },
  pushed, skipped, failed, floored,
  pullCounts: { invoices: invoices.length, pastDueInvoices: pastDueInvoices.length, quotes: quotes.length, visits: visits.length, clients: clients.length, jobsRecurring: jobsRecurring.length, jobsCreated: jobsCreated.length, jobsCompleted: jobsCompleted.length, calls: calls.length },
};
writeFileSync(path.join(runDir, `${stamp}.json`), JSON.stringify(log, null, 2));
appendFileSync(path.join(runDir, 'runs.log'), `${log.ranAt} ${DRY ? 'DRY' : 'PUSH'} weeks=${weeks[0]}..${weeks[weeks.length - 1]} pushed=${pushed} failed=${failed.length} skipped=${skipped.join(',') || '-'}\n`);
console.log(`\n${DRY ? 'Dry run — nothing pushed.' : `Pushed ${pushed} scores.`} Skipped: ${skipped.join(', ') || 'none'}. Failed: ${failed.length}`);
const flooredList = Object.entries(floored).map(([k, n]) => `${k} (${n}wk)`).join(', ');
if (flooredList) console.log(`Left blank (predates data floor): ${flooredList}`);
failed.forEach((f) => console.log('  FAIL ' + f));
