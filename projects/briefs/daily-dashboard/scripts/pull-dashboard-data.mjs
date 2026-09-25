// pull-dashboard-data.mjs — pulls every number the daily dashboard shows from Jobber +
// CallRail and writes one JSON blob. READ-ONLY: no mutation is ever sent to Jobber.
//   node projects/briefs/daily-dashboard/scripts/pull-dashboard-data.mjs
// Output: projects/briefs/daily-dashboard/data/dashboard.json
//
// Metric definitions are deliberately identical to ninety-weekly-push.mjs (the scorecard the
// Ninety board already runs on) so the dashboard and the board can never disagree. Where this
// file differs it is because the scorecard is weekly and this is daily.
// Reads the CallRail and Jobber credentials from the repo-root env file. Never prints a secret.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const briefDir = path.resolve(here, '..');
const root = path.resolve(here, '../../../..');
const ENV_PATH = path.join(root, '.env');

function die(msg) { console.error('FATAL: ' + msg); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- env ----------
function readEnv() {
  const env = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}
const env = readEnv();
const CALLRAIL = env.CALLRAIL_API_KEY || env.CALLRAIL_API_TOKEN || env.CALLRAIL_TOKEN;
if (!CALLRAIL) die('CallRail key missing from the env file');

// ---------- dates (everything is Pacific; the business runs on PT, not UTC) ----------
const TZ = 'America/Los_Angeles';
const ptDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const ptHour = (iso) => Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date(iso)));
const dow = (d) => new Date(d + 'T12:00:00Z').getUTCDay();
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const isoStart = (d) => new Date(d + 'T00:00:00-07:00').toISOString();

const today = ptDate(new Date().toISOString());
const yesterday = addDays(today, -1);
const weekStart = addDays(today, -dow(today));              // Sunday, matching the Ninety scorecard
const monthStart = today.slice(0, 8) + '01';
const seriesStart = addDays(today, -29);                    // 30-day trend window
const windowStart = [monthStart, seriesStart].sort()[0];    // whichever reaches further back
const invoiceStart = addDays(monthStart, -95).slice(0, 8) + '01'; // + 3 completed months for reference bars
const tomorrow = addDays(today, 1);

const daysInMonth = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7), 0)).getUTCDate();
const dayOfMonth = +today.slice(8, 10);

// ---------- Jobber (mirrors .claude/skills/tool-jobber/scripts/jobber-api.mjs) ----------
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
let jobberToken = null;
async function jobberAccessToken() {
  if (jobberToken) return jobberToken;
  const now = readEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: now.JOBBER_CLIENT_ID, client_secret: now.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: now.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) die(`Jobber token refresh failed HTTP ${res.status} — the refresh token has probably expired. Re-auth with: node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth`);
  // Refresh Token Rotation: persist the new token or the next run is locked out.
  if (d.refresh_token && d.refresh_token !== now.JOBBER_REFRESH_TOKEN) {
    const text = readFileSync(ENV_PATH, 'utf8');
    writeFileSync(ENV_PATH, text.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`));
  }
  jobberToken = d.access_token;
  return jobberToken;
}
async function gql(query, variables, attempt = 0) {
  const token = await jobberAccessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  const throttled = data.errors?.some((e) => e.extensions?.code === 'THROTTLED');
  if ((res.status === 429 || throttled) && attempt < 12) { await sleep(Math.min(8000 * (attempt + 1), 60000)); return gql(query, variables, attempt + 1); }
  if (res.status === 401 && attempt < 2) { jobberToken = null; return gql(query, variables, attempt + 1); }
  if (!res.ok || data.errors) die(`Jobber GQL failed: HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}`);
  return data.data;
}
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

// ---------- CallRail ----------
const crApi = async (p, params) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${CALLRAIL}"` } });
  if (!res.ok) die(`CallRail ${res.status} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};

console.log(`Daily dashboard pull — ${today} (PT)`);
console.log('Pulling Jobber...');

const JOB_FIELDS = 'jobNumber title createdAt startAt endAt completedAt jobStatus client{ name } lineItems(first:15){ nodes{ name totalPrice } } visits{ totalCount }';

const invoices = await sweep('invoices', (a) => gql(
  `query($after:String){ invoices(first:100, after:$after, filter:{ issuedDate:{ after:"${isoStart(invoiceStart)}" } }){
     nodes{ issuedDate amounts{ total } } pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'invoices');

// A quote can convert months after it was sent, so the quote pull reaches 180 days behind.
const quotes = await sweep('quotes', (a) => gql(
  `query($after:String){ quotes(first:50, after:$after, filter:{ createdAt:{ after:"${isoStart(addDays(windowStart, -180))}" } }){
     nodes{ quoteNumber createdAt sentAt transitionedAt quoteStatus amounts{ total }
            salesperson{ name{ full } } lineItems(first:15){ nodes{ name } } }
     pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'quotes');

const visits = await sweep('visits', (a) => gql(
  `query($after:String){ visits(first:100, after:$after, filter:{ startAt:{ after:"${isoStart(windowStart)}", before:"${isoStart(addDays(tomorrow, 1))}" } }){
     nodes{ startAt isComplete client{ name } job{ jobNumber } assignedUsers(first:3){ nodes{ name{ full } } } }
     pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'visits');

const clients = await sweep('clients', (a) => gql(
  `query($after:String){ clients(first:100, after:$after, filter:{ createdAt:{ after:"${isoStart(windowStart)}" } }){
     nodes{ createdAt isLead } pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'new clients');

// Active recurring work: everything whose end date is still ahead of the window. This one sweep
// serves both the TMCP roster and the Quick Fix overrun check — every Got Moles job is RECURRING
// (Quick Fix is 5 weeks of recurring visits), so nothing real is filtered out here.
const jobsActive = await sweep('jobs', (a) => gql(
  `query($after:String){ jobs(first:50, after:$after, filter:{ jobType: RECURRING, endAt:{ after:"${isoStart(windowStart)}" } }){
     nodes{ ${JOB_FIELDS} } pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'active recurring jobs');

const jobsCreated = await sweep('jobs', (a) => gql(
  `query($after:String){ jobs(first:50, after:$after, filter:{ createdAt:{ after:"${isoStart(windowStart)}" } }){
     nodes{ ${JOB_FIELDS} } pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'jobs created');

// Point-in-time — never derived from the window.
const pastDue = await sweep('invoices', (a) => gql(
  `query($after:String){ invoices(first:100, after:$after, filter:{ status: past_due }){
     nodes{ invoiceNumber issuedDate client{ name } amounts{ invoiceBalance } }
     pageInfo{ hasNextPage endCursor } } }`, { after: a }), 'past-due invoices');

console.log('Pulling CallRail...');
// CallRail has no calls on this account before 2026-04-30; asking earlier is a hard 400.
const CR_FLOOR = '2026-04-01';
const crFrom = windowStart < CR_FLOOR ? CR_FLOOR : windowStart;
const crAcct = (await crApi('a.json', {})).accounts[0].id;
const calls = [];
for (let page = 1; ; page++) {
  const d = await crApi(`a/${crAcct}/calls.json`, {
    start_date: crFrom, end_date: today, per_page: 250, page,
    fields: 'answered,direction,start_time,duration',
  });
  calls.push(...(d.calls || []));
  if (!d.calls?.length || page >= (d.total_pages || 1)) break;
  await sleep(400);
}
console.log(`  calls: ${calls.length}`);

// ================= compute =================
const TMC_RE = /total mole control|tmcp/i;
const QF_RE = /quick fix/i;
const hasLine = (o, re) => (o.lineItems?.nodes || []).some((li) => re.test(li.name || '')) || re.test(o.title || '');
const between = (d, a, b) => d >= a && d <= b;

const inbound = calls.filter((c) => c.direction?.includes('inbound'));
const callDay = (c) => ptDate(c.start_time);

// --- periods: [start, end] inclusive, in PT dates ---
const periods = {
  today: [today, today],
  yesterday: [yesterday, yesterday],
  wtd: [weekStart, today],
  mtd: [monthStart, today],
};

const quoteSentDay = (q) => (q.sentAt ? ptDate(q.sentAt) : null);
const quoteConvDay = (q) => (q.quoteStatus === 'converted' && q.transitionedAt ? ptDate(q.transitionedAt) : null);

const metrics = {};
for (const [name, [a, b]] of Object.entries(periods)) {
  const pc = inbound.filter((c) => between(callDay(c), a, b));
  const answered = pc.filter((c) => c.answered !== false).length;
  const missed = pc.filter((c) => c.answered === false).length;
  const sent = quotes.filter((q) => { const d = quoteSentDay(q); return d && between(d, a, b); });
  const converted = quotes.filter((q) => { const d = quoteConvDay(q); return d && between(d, a, b); });
  metrics[name] = {
    calls_total: pc.length,
    calls_answered: answered,
    calls_missed: missed,
    answer_rate: pc.length ? Math.round((answered / pc.length) * 1000) / 10 : null,
    visits_completed: visits.filter((v) => v.isComplete && between(ptDate(v.startAt), a, b)).length,
    visits_scheduled: visits.filter((v) => between(ptDate(v.startAt), a, b)).length,
    quotes_sent: sent.length,
    quotes_sent_value: Math.round(sent.reduce((s, q) => s + (q.amounts?.total || 0), 0)),
    quotes_converted: converted.length,
    quotes_converted_value: Math.round(converted.reduce((s, q) => s + (q.amounts?.total || 0), 0)),
    new_clients: clients.filter((c) => !c.isLead && between(ptDate(c.createdAt), a, b)).length,
    jobs_created: jobsCreated.filter((j) => between(ptDate(j.createdAt), a, b)).length,
    revenue_invoiced: Math.round(invoices.filter((i) => between(i.issuedDate.slice(0, 10), a, b)).reduce((s, i) => s + (i.amounts?.total || 0), 0)),
  };
}

// --- TMCP roster (point-in-time) ---
// Same guards as the scorecard: a real TMCP job runs longer than 45 days (that is what separates
// it from a Quick Fix mis-tagged with a TMCP line), and archived jobs are excluded outright —
// TMCP jobs carry a 10-year endAt, so an endAt-gated test would keep counting cancelled ones.
const tmcpAll = jobsActive.filter((j) => hasLine(j, TMC_RE) && j.startAt && j.endAt
  && (new Date(j.endAt) - new Date(j.startAt)) > 45 * 86400000);
const tmcpJobs = tmcpAll.filter((j) => j.jobStatus !== 'archived'
  && ptDate(j.startAt) <= today && ptDate(j.endAt) >= today);
const monthlyOf = (j) => {
  const prices = (j.lineItems?.nodes || []).map((li) => li.totalPrice).filter((p) => p >= 25 && p <= 400);
  return prices.length ? Math.max(...prices) : 0;
};
const tmcpMrr = Math.round(tmcpJobs.reduce((s, j) => s + monthlyOf(j), 0));
const tmcp = {
  active: tmcpJobs.length,
  mrr: tmcpMrr,
  new_mtd: tmcpAll.filter((j) => between(ptDate(j.startAt), monthStart, today)).length,
  ended_mtd: tmcpAll.filter((j) => between(ptDate(j.endAt), monthStart, today)).length,
  new_wtd: tmcpAll.filter((j) => between(ptDate(j.startAt), weekStart, today)).length,
  ended_wtd: tmcpAll.filter((j) => between(ptDate(j.endAt), weekStart, today)).length,
};
tmcp.net_new_mtd = tmcp.new_mtd - tmcp.ended_mtd;

// --- Quick Fix overrun: the 5-week series has no gate in Jobber, so jobs run past it silently ---
const qfOverrun = jobsActive
  .filter((j) => hasLine(j, QF_RE) && j.jobStatus !== 'archived' && (j.visits?.totalCount || 0) > 5)
  .map((j) => ({
    job: j.jobNumber, client: j.client?.name || '(no client)',
    visits: j.visits.totalCount, over: j.visits.totalCount - 5,
    status: j.jobStatus, started: j.startAt ? ptDate(j.startAt) : null,
  }))
  .sort((a, b) => b.visits - a.visits);
const qfActive = jobsActive.filter((j) => hasLine(j, QF_RE) && j.jobStatus !== 'archived').length;

// --- collections ---
const collections = {
  count: pastDue.length,
  total: Math.round(pastDue.reduce((s, i) => s + (i.amounts?.invoiceBalance || 0), 0)),
  top: pastDue
    .map((i) => ({ invoice: i.invoiceNumber, client: i.client?.name || '(no client)', balance: Math.round(i.amounts?.invoiceBalance || 0), issued: i.issuedDate?.slice(0, 10) || null }))
    .sort((a, b) => b.balance - a.balance).slice(0, 8),
};

// --- today's field board, per tech ---
const techOf = (v) => (v.assignedUsers?.nodes || []).map((u) => u.name.full)[0] || 'Unassigned';
const todayVisits = visits.filter((v) => ptDate(v.startAt) === today);
const byTech = {};
for (const v of todayVisits) {
  const t = techOf(v);
  byTech[t] = byTech[t] || { tech: t, scheduled: 0, complete: 0 };
  byTech[t].scheduled++;
  if (v.isComplete) byTech[t].complete++;
}
const field = {
  scheduled: todayVisits.length,
  complete: todayVisits.filter((v) => v.isComplete).length,
  techs: Object.values(byTech).sort((a, b) => b.scheduled - a.scheduled),
};

// --- close rate by salesperson, trailing 30 days on SENT date ---
// Attribution note: a quote is credited to whoever it is assigned to in Jobber, not to whoever
// answered the call. Spencer's real edge shows up as jobs booked on the call with no quote at
// all, so a low quote count here is not the same as a low close rate.
const sp30 = {};
for (const q of quotes) {
  const d = quoteSentDay(q);
  if (!d || !between(d, seriesStart, today)) continue;
  const who = (q.salesperson?.name?.full || '').trim() || 'Unassigned';
  sp30[who] = sp30[who] || { who, sent: 0, converted: 0, value: 0 };
  sp30[who].sent++;
  if (q.quoteStatus === 'converted') { sp30[who].converted++; sp30[who].value += q.amounts?.total || 0; }
}
const closeRate = Object.values(sp30).map((r) => ({
  ...r, value: Math.round(r.value), rate: r.sent ? Math.round((r.converted / r.sent) * 1000) / 10 : 0,
})).sort((a, b) => b.sent - a.sent);

// --- 30-day daily series ---
const series = [];
for (let d = seriesStart; d <= today; d = addDays(d, 1)) {
  const dc = inbound.filter((c) => callDay(c) === d);
  series.push({
    date: d,
    dow: dow(d),
    calls: dc.length,
    answered: dc.filter((c) => c.answered !== false).length,
    missed: dc.filter((c) => c.answered === false).length,
    revenue: Math.round(invoices.filter((i) => i.issuedDate.slice(0, 10) === d).reduce((s, i) => s + (i.amounts?.total || 0), 0)),
    visits: visits.filter((v) => v.isComplete && ptDate(v.startAt) === d).length,
  });
}

// --- today's calls by hour (so a missed-call spike has a time attached) ---
const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, answered: 0, missed: 0 }));
for (const c of inbound.filter((c) => callDay(c) === today)) {
  const h = hours[ptHour(c.start_time)];
  if (c.answered === false) h.missed++; else h.answered++;
}

// --- completed months, and the SHAPE of a month ---
const monthTotals = {};
const monthDaily = {};
for (const i of invoices) {
  const day = i.issuedDate.slice(0, 10);
  const m = day.slice(0, 7);
  monthTotals[m] = (monthTotals[m] || 0) + (i.amounts?.total || 0);
  monthDaily[m] = monthDaily[m] || {};
  monthDaily[m][+day.slice(8, 10)] = (monthDaily[m][+day.slice(8, 10)] || 0) + (i.amounts?.total || 0);
}
const reference = Object.entries(monthTotals)
  .filter(([m]) => m < today.slice(0, 7))
  .sort().slice(-3)
  .map(([month, total]) => ({ month, total: Math.round(total) }));

// Got Moles bills in batches, not evenly: 2026-08-31 alone invoiced $56K against $0 on the two
// days before it. So the fraction of a month billed by day D is NOT D/daysInMonth, and a
// day-pace extrapolation early in the month is off by multiples (a naive run-rate projected
// $412K on day 2 against real months of $78-109K). Instead, measure how a month actually fills
// up from the last three completed months and use that curve.
const shapeCurve = [];
for (let day = 0; day <= 31; day++) {
  const fracs = reference.map(({ month, total }) => {
    if (!total) return null;
    let cum = 0;
    for (let x = 1; x <= day; x++) cum += monthDaily[month]?.[x] || 0;
    return cum / total;
  }).filter((v) => v != null);
  shapeCurve[day] = fracs.length ? fracs.reduce((a, b) => a + b, 0) / fracs.length : day / 31;
}
const shapeFrac = Math.min(1, shapeCurve[Math.min(dayOfMonth, 31)]);
const avgMonth = reference.length ? Math.round(reference.reduce((s, r) => s + r.total, 0) / reference.length) : 0;

// --- month projection: three stacked parts, each labelled by how solid it is ---
// Total = what is already billed + what a typical month still has left to bill at this point in
// its shape. Additive rather than a ratio (invoicedMTD / shapeFrac), because a ratio divides by a
// near-zero number in the first days of the month and explodes; this form is stable on day 1 and
// converges on the real figure by month end, when shapeFrac reaches 1 and the remainder is 0.
// The remainder is then split so the recurring book is visible on its own: B is the TMCP book not
// yet billed this month, C is everything else. A + B + C is the total by construction, so no
// dollar is counted twice.
const invoicedMTD = metrics.mtd.revenue_invoiced;
const projTotal = Math.round(invoicedMTD + avgMonth * (1 - shapeFrac));
const remaining = Math.max(0, projTotal - invoicedMTD);
const recurringToBill = Math.min(remaining, Math.round(tmcpMrr * (1 - shapeFrac)));
const projection = {
  days_in_month: daysInMonth, day_of_month: dayOfMonth, days_remaining: daysInMonth - dayOfMonth,
  invoiced_mtd: invoicedMTD,
  recurring_to_bill: recurringToBill,
  other_to_come: remaining - recurringToBill,
  total: projTotal,
  // how far through a typical month's billing we are — not the same as days elapsed
  shape_frac: Math.round(shapeFrac * 1000) / 10,
  days_frac: Math.round((dayOfMonth / daysInMonth) * 1000) / 10,
  avg_month: avgMonth,
  basis_months: reference.length,
};

const out = {
  generated_at: new Date().toISOString(),
  generated_at_pt: new Intl.DateTimeFormat('en-US', { timeZone: TZ, dateStyle: 'full', timeStyle: 'short' }).format(new Date()),
  today, yesterday, week_start: weekStart, month_start: monthStart,
  metrics, tmcp, qf: { active: qfActive, overrun: qfOverrun },
  collections, field, close_rate: closeRate, series, hours, projection, reference,
  counts: { invoices: invoices.length, quotes: quotes.length, visits: visits.length, jobs_active: jobsActive.length, calls: calls.length },
};

mkdirSync(path.join(briefDir, 'data'), { recursive: true });
writeFileSync(path.join(briefDir, 'data', 'dashboard.json'), JSON.stringify(out, null, 2));
console.log(`\n${today}: ${metrics.today.calls_total} calls (${metrics.today.calls_missed} missed), ${field.complete}/${field.scheduled} visits done, ${metrics.today.quotes_sent} quotes sent`);
console.log(`TMCP ${tmcp.active} active / $${tmcpMrr.toLocaleString('en-US')} MRR · past due $${collections.total.toLocaleString('en-US')} · QF overrun ${qfOverrun.length}`);
console.log(`Projected month: $${projection.total.toLocaleString('en-US')} (invoiced $${invoicedMTD.toLocaleString('en-US')})`);
console.log(`-> ${path.relative(root, path.join(briefDir, 'data', 'dashboard.json'))}`);
