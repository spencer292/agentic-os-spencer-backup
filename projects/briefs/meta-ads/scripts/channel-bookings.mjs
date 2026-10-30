// channel-bookings.mjs — booked jobs per channel, from CallRail calls matched to Jobber.
// Read-only. For every inbound non-spam call whose CallRail source matches --match, finds the
// caller's Jobber jobs created from 1 day before to 30 days after the call. Each job counts once,
// credited to the first matching call. New vs existing customer comes from the Jobber client's
// createdAt (new = client created on or after the day before the first matching call).
//   node projects/briefs/meta-ads/scripts/channel-bookings.mjs --match "Google Ads" [--field source] [--from 2026-05-01] [--label google-ads]
// --field: source | source_name | any (default source). Output: monthly summary to stdout and
// projects/briefs/meta-ads/{today}_{label}-bookings.md. Never prints secrets or full phone numbers.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const readEnv = () => {
  const e = {};
  for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return e;
};
const env = readEnv();
const CALLRAIL = env.CALLRAIL_API_KEY || env.CALLRAIL_API_TOKEN || env.CALLRAIL_TOKEN;
const die = (m) => { console.error('FATAL: ' + m); process.exit(1); };
if (!CALLRAIL) die('CallRail key missing from .env');

const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const MATCH = new RegExp(argVal('--match', 'Google Ads'), 'i');
const FIELD = argVal('--field', 'source');
const FROM = argVal('--from', '2026-05-01');
const LABEL = argVal('--label', 'channel');
const TZ = 'America/Los_Angeles';
const ptDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const today = ptDate(new Date().toISOString());
const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 864e5;

// ---------- CallRail ----------
const crApi = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${CALLRAIL}"` } });
  if (!res.ok) die(`CallRail ${res.status} on ${p}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};
const acct = (await crApi('a.json')).accounts[0].id;
const calls = [];
for (let page = 1; ; page++) {
  const d = await crApi(`a/${acct}/calls.json`, {
    start_date: FROM, end_date: today, per_page: 250, page,
    fields: 'answered,direction,start_time,duration,first_call,customer_phone_number,source,source_name,spam',
  });
  calls.push(...(d.calls || []));
  process.stdout.write(`\r  CallRail calls: ${calls.length}   `);
  if (!d.calls?.length || page >= (d.total_pages || 1)) break;
  await sleep(300);
}
console.log('');
const hay = (c) => FIELD === 'any' ? `${c.source} ${c.source_name}` : String(c[FIELD] || '');
const matched = calls.filter((c) => c.direction === 'inbound' && !c.spam && MATCH.test(hay(c)))
  .sort((a, b) => a.start_time.localeCompare(b.start_time));

// ---------- Jobber ----------
let jobberToken = null;
async function token() {
  if (jobberToken) return jobberToken;
  const e = readEnv();
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: e.JOBBER_CLIENT_ID, client_secret: e.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: e.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json();
  if (!res.ok) die(`Jobber token refresh failed HTTP ${res.status}`);
  if (d.refresh_token && d.refresh_token !== e.JOBBER_REFRESH_TOKEN) {
    const text = readFileSync(path.join(root, '.env'), 'utf8');
    writeFileSync(path.join(root, '.env'), text.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`));
  }
  return (jobberToken = d.access_token);
}
async function gql(query, variables, attempt = 0) {
  const headers = { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) headers['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  const throttled = data.errors?.some((e) => e.extensions?.code === 'THROTTLED');
  if ((res.status === 429 || throttled) && attempt < 12) { await sleep(Math.min(8000 * (attempt + 1), 60000)); return gql(query, variables, attempt + 1); }
  if (res.status === 401 && attempt < 2) { jobberToken = null; return gql(query, variables, attempt + 1); }
  const fatal = (data.errors || []).filter((e) => !/hidden due to permissions/i.test(e.message || ''));
  if (!res.ok || fatal.length) die(`Jobber GQL failed: HTTP ${res.status} ${JSON.stringify(fatal).slice(0, 300)}`);
  return data.data;
}
const jobs = [];
for (let after = null; ;) {
  const d = await gql(`query($after:String){ jobs(first:25, after:$after, filter:{ createdAt:{ after:"${new Date(FROM + 'T00:00:00-07:00').toISOString()}" } }){
    nodes{ jobNumber createdAt jobStatus total client{ id createdAt phones{ number } } lineItems(first:10){ nodes{ name } } }
    pageInfo{ hasNextPage endCursor } } }`, { after });
  jobs.push(...d.jobs.nodes);
  process.stdout.write(`\r  Jobber jobs: ${jobs.length}   `);
  if (!d.jobs.pageInfo.hasNextPage) break;
  after = d.jobs.pageInfo.endCursor; await sleep(200);
}
console.log('');
const product = (j) => { const s = j.lineItems.nodes.map((l) => l.name).join(' '); return /total mole control|tmcp|year.?round/i.test(s) ? 'TMCP' : /quick fix|month of mole control/i.test(s) ? 'QF' : 'other'; };
const jobsByPhone = new Map();
for (const j of jobs) for (const ph of j.client?.phones || []) {
  const p = digits(ph.number); if (!p) continue;
  if (!jobsByPhone.has(p)) jobsByPhone.set(p, []);
  jobsByPhone.get(p).push(j);
}

// ---------- match ----------
const month = (iso) => ptDate(iso).slice(0, 7);
const rows = {};
const row = (m) => (rows[m] ||= { calls: 0, callers: new Set(), talk30: 0, newBooked: 0, existBooked: 0, qf: 0, tmcp: 0, other: 0, value: 0 });
const credited = new Set();
const firstCallOf = new Map();
for (const c of matched) {
  const p = digits(c.customer_phone_number);
  const r = row(month(c.start_time));
  r.calls++; r.callers.add(p); if (c.answered && c.duration >= 30) r.talk30++;
  if (!firstCallOf.has(p)) firstCallOf.set(p, c.start_time);
  const t = new Date(c.start_time).getTime();
  for (const j of jobsByPhone.get(p) || []) {
    const jt = new Date(j.createdAt).getTime();
    if (jt < t - DAY || jt > t + 30 * DAY || credited.has(j.jobNumber)) continue;
    credited.add(j.jobNumber);
    const isNew = new Date(j.client.createdAt).getTime() >= new Date(firstCallOf.get(p)).getTime() - DAY;
    if (isNew) r.newBooked++; else r.existBooked++;
    r[product(j) === 'TMCP' ? 'tmcp' : product(j) === 'QF' ? 'qf' : 'other']++;
    r.value += j.total || 0;
  }
}

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
say(`# Booked jobs from CallRail ${FIELD} ~ /${MATCH.source}/ (${FROM} → ${today})\n`);
say('Calls = inbound non-spam calls from this source. Booked = Jobber jobs created from 1 day before to 30 days after a call, each counted once. New = the client record was created around the first call; existing = an earlier customer calling back. Recent months are not mature (bookings lag up to ~30 days).\n');
say('| Month | Calls | Unique callers | Answered 30s+ | Booked: new customer | Booked: existing | QF / TMCP / other | Job value |');
say('|---|---|---|---|---|---|---|---|');
const tot = { calls: 0, callers: new Set(), talk30: 0, newBooked: 0, existBooked: 0, qf: 0, tmcp: 0, other: 0, value: 0 };
for (const m of Object.keys(rows).sort()) {
  const r = rows[m];
  say(`| ${m} | ${r.calls} | ${r.callers.size} | ${r.talk30} | ${r.newBooked} | ${r.existBooked} | ${r.qf} / ${r.tmcp} / ${r.other} | $${Math.round(r.value).toLocaleString('en-US')} |`);
  for (const k of ['calls', 'talk30', 'newBooked', 'existBooked', 'qf', 'tmcp', 'other', 'value']) tot[k] += r[k];
  r.callers.forEach((p) => tot.callers.add(p));
}
say(`| **Total** | ${tot.calls} | ${tot.callers.size} | ${tot.talk30} | ${tot.newBooked} | ${tot.existBooked} | ${tot.qf} / ${tot.tmcp} / ${tot.other} | $${Math.round(tot.value).toLocaleString('en-US')} |`);
say(`\nSource values matched: ${[...new Set(matched.map((c) => `${c.source} / ${c.source_name}`))].join('; ')}`);
const file = path.join(here, '..', `${today}_${LABEL}-bookings.md`);
writeFileSync(file, out.join('\n') + '\n');
console.log(`\nSaved ${path.relative(root, file)}`);
