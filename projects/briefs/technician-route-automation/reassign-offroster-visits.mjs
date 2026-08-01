#!/usr/bin/env node
// Reassign future visits that sit on a tech who is not driving, using the territory grid.
//
// Why this exists: Jobber has NO job-level assignment mutation. `JobEditInput` carries no
// assignedUsers field (schema checked 2026-07-31) — `visitEditAssignedUsers` is the only write
// path, and it works one visit at a time. So when a tech leaves the field, every already-generated
// visit keeps pointing at them and the board shows coverage that does not exist. Tavis Alexander
// had 3,982 such visits stretching to Dec 2027, flat at ~230/month (2026-07-31).
//
// This tool does NOT stop new ones appearing. Jobber generates recurring visits from the job's
// assigned tech, and that assignment is only editable in the Jobber UI. Until the office re-points
// those recurring jobs, this sweep is a repair, not a cure — re-run it, or rely on the weekly
// routing run (push-week --grid + lock-techs-to-jobber --fallback=grid) which repairs each week as
// it enters the window.
//
// Ride-alongs are preserved: visitEditAssignedUsers REPLACES the list, so writing the driver alone
// would strip crew off the visit (learned 2026-07-26).
//
// Usage: node reassign-offroster-visits.mjs dry|live <from> <to> --grid=<file> [--max N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const loadEnv = () => {
  const e = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); }
  return e;
};
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status); process.exit(1); }
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
  return data;
}

const mode = process.argv[2], from = process.argv[3], to = process.argv[4];
const gArg = process.argv.find(a => a.startsWith('--grid='));
const maxIdx = process.argv.indexOf('--max');
const maxWrites = maxIdx >= 0 ? Number(process.argv[maxIdx + 1]) : Infinity;
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!['dry', 'live'].includes(mode) || !from || !to || !gArg) {
  console.log('Usage: reassign-offroster-visits.mjs dry|live <from> <to> --grid=<file> [--max N] [--visits=<snapshot>]');
  process.exit(1);
}
const G = JSON.parse(fs.readFileSync(path.resolve(__dirname, gArg.split('=')[1]), 'utf8'));
const ROSTER = Object.keys(G.works || {});
const RIDE_ALONG = /norton/i;
// --only=<regex> narrows the sweep to visits currently on a named tech. "Off the roster" covers
// several very different cases — someone who left the field, someone out for one week, and visits
// nobody was ever assigned — and they don't all deserve the same treatment months out. Without it
// the sweep takes every off-roster visit in the window.
const oArg = process.argv.find(a => a.startsWith('--only='));
const ONLY = oArg ? new RegExp(oArg.split('=')[1], 'i') : null;
if (ONLY) console.log(`scoped to visits currently on: /${ONLY.source}/i`);
console.log(`roster: ${ROSTER.join(', ')}`);
console.log(`window: ${from} .. ${to}\n`);

// ---- gather visits ----
let visits;
if (vArg) {
  visits = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));
  console.log(`snapshot: ${visits.length} visits`);
} else {
  visits = [];
  let cursor = null;
  const afterIso = `${from}T00:00:00-07:00`, beforeIso = `${to}T23:59:59-07:00`;
  for (;;) {
    const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "${afterIso}", before: "${beforeIso}" } }) { nodes { id title startAt isComplete assignedUsers(first: 5) { nodes { id name { full } } } property { address { street city province postalCode } } job { jobNumber startAt } } pageInfo { hasNextPage endCursor } } }`;
    const d = await jgql(q, { after: cursor });
    if (d.errors) { console.error('fetch failed:', JSON.stringify(d.errors).slice(0, 300)); process.exit(1); }
    visits.push(...d.data.visits.nodes);
    if (!d.data.visits.pageInfo.hasNextPage) break;
    cursor = d.data.visits.pageInfo.endCursor;
    if (visits.length % 500 < 25) console.log(`  fetched ${visits.length}…`);
    await sleep(700);
  }
  console.log(`fetched ${visits.length} visits`);
}

// ---- decide ----
const users = await (async () => {
  const r = await jgql('query { users(first: 100) { nodes { id name { full } } } }', {});
  const m = {};
  for (const u of r.data.users.nodes) if (u.name?.full) m[u.name.full.trim().toLowerCase()] = u.id;
  return m;
})();
for (const t of ROSTER) if (!users[t.trim().toLowerCase()]) { console.error(`ABORT: roster tech "${t}" has no Jobber user — cannot assign them anything.`); process.exit(1); }

const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const plan = [], unresolved = {}, offBy = {}, toBy = {}, byMonth = {};
let skippedByScope = 0;
for (const v of visits) {
  if (v.isComplete) continue;
  const nodes = v.assignedUsers?.nodes || [];
  const names = nodes.map(u => u.name.full);
  if (names.some(n => ROSTER.includes(n))) continue;          // already on a working tech — leave alone
  if (ONLY && !names.some(n => ONLY.test(n))) { skippedByScope++; continue; }
  const zip = (v.property?.address?.postalCode || '').trim().slice(0, 5);
  const ov = G.jobOverrides?.[String(v.job?.jobNumber)];
  const tech = ov?.tech || G.zips[zip]?.tech;
  const was = names.length ? names.join('+') : '(unassigned)';
  if (!tech || !ROSTER.includes(tech)) {
    // no grid coverage — never guess a tech onto a real customer visit
    (unresolved[zip || '(no zip)'] ||= { count: 0, city: v.property?.address?.city || '?' }).count++;
    continue;
  }
  // keep any ride-along crew already on the visit; the driver goes first
  const rideAlongIds = nodes.filter(u => RIDE_ALONG.test(u.name.full)).map(u => u.id);
  plan.push({ visitId: v.id, job: v.job?.jobNumber, date: ptDate(v.startAt), zip, was, tech, userIds: [users[tech.trim().toLowerCase()], ...rideAlongIds] });
  offBy[was] = (offBy[was] || 0) + 1;
  toBy[tech] = (toBy[tech] || 0) + 1;
  byMonth[ptDate(v.startAt).slice(0, 7)] = (byMonth[ptDate(v.startAt).slice(0, 7)] || 0) + 1;
}

console.log(`\nreassignable: ${plan.length}`);
if (skippedByScope) console.log(`off-roster but out of --only scope, left alone: ${skippedByScope}`);
console.log('from:'); for (const [k, c] of Object.entries(offBy).sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(4)}  ${k}`);
console.log('to:');   for (const [k, c] of Object.entries(toBy).sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(4)}  ${k}`);
console.log('by month:', Object.entries(byMonth).sort().map(([m, c]) => `${m}:${c}`).join('  '));
const unresolvedTotal = Object.values(unresolved).reduce((a, u) => a + u.count, 0);
if (unresolvedTotal) {
  console.log(`\nNOT reassigned — zip missing from the grid: ${unresolvedTotal} visits`);
  for (const [z, u] of Object.entries(unresolved).sort((a, b) => b[1].count - a[1].count)) console.log(`   ${z} ${u.city.padEnd(18)} ${u.count}`);
  console.log('   (add these zips to the grid, then re-run — they stay on their current tech until then)');
}
fs.writeFileSync(path.join(__dirname, 'offroster-reassign-plan.json'), JSON.stringify(plan, null, 1));
console.log(`\nplan -> offroster-reassign-plan.json`);
if (mode === 'dry') { console.log('DRY — nothing written.'); process.exit(0); }

// ---- write ----
// Aliased batches of 20 (learned 2026-07-20). One bad id voids the whole batch response, so on a
// batch error fall back to per-visit writes rather than losing 20 silently.
const slice = plan.slice(0, maxWrites === Infinity ? plan.length : maxWrites);
console.log(`\nwriting ${slice.length}…`);
let ok = 0, fail = 0;
const one = async (w) => {
  const r = await jgql(`mutation($id:EncodedId!,$ids:[EncodedId!]!){ visitEditAssignedUsers(visitId:$id, input:{assignedUserIds:$ids}){ userErrors{ message } } }`, { id: w.visitId, ids: w.userIds });
  const ue = r.data?.visitEditAssignedUsers?.userErrors || [];
  if (r.errors || ue.length) { fail++; if (fail < 8) console.log(`  FAIL job ${w.job}`, JSON.stringify(r.errors || ue).slice(0, 160)); return false; }
  ok++; return true;
};
for (let i = 0; i < slice.length; i += 20) {
  const batch = slice.slice(i, i + 20);
  const frag = batch.map((w, j) => `m${j}: visitEditAssignedUsers(visitId:"${w.visitId}", input:{assignedUserIds:[${w.userIds.map(id => `"${id}"`).join(',')}]}){ userErrors{ message } }`).join('\n');
  const r = await jgql(`mutation{ ${frag} }`, {});
  if (r.errors) {
    console.log(`  batch ${i}-${i + batch.length} errored, falling back to per-visit`);
    for (const w of batch) { await one(w); await sleep(150); }
  } else {
    for (let j = 0; j < batch.length; j++) {
      const ue = r.data?.[`m${j}`]?.userErrors || [];
      if (ue.length) { fail++; if (fail < 8) console.log(`  FAIL job ${batch[j].job}`, JSON.stringify(ue).slice(0, 160)); } else ok++;
    }
  }
  if ((i + 20) % 200 < 20) console.log(`  ${Math.min(i + 20, slice.length)}/${slice.length} (ok ${ok}, failed ${fail})`);
  await sleep(400);
}
console.log(`\nreassigned ${ok}, failed ${fail}`);
