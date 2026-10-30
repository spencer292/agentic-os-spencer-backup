// meta-calls-baseline.mjs — what does the current Meta campaign cost per booked job?
// Read-only. CallRail v3 calls since --from, grouped by source; the calls whose source/tracker
// looks like Meta (Facebook/Instagram/Meta/social, or the number the ads show) are matched by
// caller phone to Jobber clients, and their jobs created on/after the call are counted.
//   node projects/briefs/meta-ads/scripts/meta-calls-baseline.mjs [--from 2026-05-14] [--ad-number 2533211024]
// Reads CALLRAIL_API_KEY and JOBBER_* from repo-root .env. Never prints secrets or full phone numbers.
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
const FROM = argVal('--from', '2026-05-14');
const AD_NUMBER = argVal('--ad-number', '2533211024');
const TZ = 'America/Los_Angeles';
const ptDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const today = ptDate(new Date().toISOString());
const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
const mask = (p) => '***-' + digits(p).slice(-4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- CallRail ----------
const crApi = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${CALLRAIL}"` } });
  if (!res.ok) die(`CallRail ${res.status} on ${p}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};
const acct = (await crApi('a.json')).accounts[0].id;

const trackers = [];
for (let page = 1; ; page++) {
  const d = await crApi(`a/${acct}/trackers.json`, { per_page: 250, page });
  trackers.push(...(d.trackers || []));
  if (!d.trackers?.length || page >= (d.total_pages || 1)) break;
}
const trackerNumbers = (t) => (t.tracking_numbers || []).map(digits);
const adTracker = trackers.filter((t) => trackerNumbers(t).includes(AD_NUMBER));

const calls = [];
for (let page = 1; ; page++) {
  const d = await crApi(`a/${acct}/calls.json`, {
    start_date: FROM, end_date: today, per_page: 250, page,
    fields: 'answered,direction,start_time,duration,first_call,customer_phone_number,source,source_name,tracker_id,tracking_phone_number,lead_status,spam',
  });
  calls.push(...(d.calls || []));
  if (!d.calls?.length || page >= (d.total_pages || 1)) break;
  await sleep(300);
}
const inbound = calls.filter((c) => c.direction === 'inbound' && !c.spam);

const META_RE = /facebook|instagram|\bmeta\b|\bfb\b|\big\b|social/i;
const isMeta = (c) => META_RE.test(`${c.source} ${c.source_name}`) || digits(c.tracking_phone_number) === AD_NUMBER
  || adTracker.some((t) => t.id === c.tracker_id);

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
say(`# Meta calls baseline (CallRail ${FROM} → ${today})\n`);
say(`Ad number ${mask(AD_NUMBER)}: ${adTracker.length ? 'IS a CallRail tracker → ' + adTracker.map((t) => `"${t.name}" (${t.type}, source: ${t.source?.type || t.source_name || '?'})`).join('; ') : 'NOT a CallRail tracking number'}\n`);
say('## Inbound calls by source (non-spam)\n');
const bySrc = {};
for (const c of inbound) { const k = `${c.source || '?'} / ${c.source_name || '?'}`; bySrc[k] = (bySrc[k] || 0) + 1; }
for (const [k, n] of Object.entries(bySrc).sort((a, b) => b[1] - a[1])) say(`- ${k}: ${n}${META_RE.test(k) ? '  ← Meta' : ''}`);

const metaCalls = inbound.filter(isMeta);
say(`\n## Meta-sourced inbound calls: ${metaCalls.length} (answered ${metaCalls.filter((c) => c.answered).length}, 20s+ ${metaCalls.filter((c) => c.duration >= 20).length}, first-time callers ${metaCalls.filter((c) => c.first_call).length})\n`);

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
  const fatal = (data.errors || []).filter((e) => !/hidden due to permissions/i.test(e.message || ''));
  if (!res.ok || fatal.length) die(`Jobber GQL failed: HTTP ${res.status} ${JSON.stringify(fatal).slice(0, 300)}`);
  return data.data;
}
const jobs = [];
for (let after = null; ;) {
  const d = await gql(`query($after:String){ jobs(first:25, after:$after, filter:{ createdAt:{ after:"${new Date(FROM + 'T00:00:00-07:00').toISOString()}" } }){
    nodes{ jobNumber createdAt jobStatus total client{ phones{ number } } lineItems(first:10){ nodes{ name } } }
    pageInfo{ hasNextPage endCursor } } }`, { after });
  jobs.push(...d.jobs.nodes);
  if (!d.jobs.pageInfo.hasNextPage) break;
  after = d.jobs.pageInfo.endCursor; await sleep(200);
}
const product = (j) => { const s = j.lineItems.nodes.map((l) => l.name).join(' '); return /total mole control/i.test(s) ? 'TMCP' : /quick fix|month of mole control/i.test(s) ? 'Quick Fix' : 'other'; };

say('| Call (PT) | Caller | Dur (s) | First call | Booked job (created ≤30 days after call) |');
say('|---|---|---|---|---|');
let booked = 0, bookedValue = 0;
const seen = new Set();
for (const c of metaCalls.sort((a, b) => a.start_time.localeCompare(b.start_time))) {
  const p = digits(c.customer_phone_number);
  const t0 = new Date(c.start_time).getTime() - 864e5; // job may be created same day, before the call is logged
  const hit = jobs.find((j) => j.client?.phones?.some((ph) => digits(ph.number) === p)
    && new Date(j.createdAt).getTime() >= t0 && new Date(j.createdAt).getTime() <= t0 + 31 * 864e5);
  let cell = '—';
  if (hit) {
    cell = `#${hit.jobNumber} ${product(hit)} $${Math.round(hit.total || 0)} (${hit.jobStatus})`;
    if (!seen.has(hit.jobNumber)) { seen.add(hit.jobNumber); booked++; bookedValue += hit.total || 0; }
  }
  say(`| ${ptDate(c.start_time)} | ${mask(p)} | ${c.duration} | ${c.first_call ? 'yes' : 'no'} | ${cell} |`);
}
say(`\nBooked jobs from Meta calls: ${booked} (job value $${Math.round(bookedValue)})`);
writeFileSync(path.join(here, '..', `${today}_meta-calls-baseline.md`), out.join('\n') + '\n');
console.log(`\nSaved projects/briefs/meta-ads/${today}_meta-calls-baseline.md`);
