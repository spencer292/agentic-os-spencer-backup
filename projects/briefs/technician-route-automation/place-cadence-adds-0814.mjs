#!/usr/bin/env node
// PLACE THE CADENCE ADDS — turn the audit's verdicts into a bookable plan.
//
// Placement rule (Spencer 2026-08-09): an interim visit lands on the day its OWNING TECH is already
// working that ZIP on the live board, at or after the date the cadence interval requires. Never a
// new day, never a new area — it joins a cluster that is already going out. If no such day exists
// inside the search horizon, that is reported, not guessed around.
//
// OWNERSHIP comes from territories.json, resolved for the TARGET DATE — v9's five-way cut is
// effective 2026-08-17, so an add landing on or after it belongs to the new owner, not to whoever
// ran the last visit. This is the exact trap that put 11 visits on Tavis three days before his
// handover on 2026-08-09.
//
// READ-ONLY. Writes a plan file for add-interim-visits.mjs.
//
// Usage: node place-cadence-adds-0814.mjs --audit=_cadence_adds_0814.json --out=_adds_plan_0814.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const AUDIT = flag('audit', '_cadence_adds_0814.json');
const OUT = flag('out', '_adds_plan_0814.json');
const HORIZON = Number(flag('horizon', 21));   // days after `required` to look for a matching day

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
  fs.writeFileSync(ENV_PATH, fs.readFileSync(ENV_PATH, 'utf8').replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token));
}
const tok = tr.access_token;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const gql = async (query, variables = {}, attempt = 0) => {
  const r = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  const d = await r.json();
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) {
      await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, variables, attempt + 1);
    }
    throw new Error(JSON.stringify(d.errors).slice(0, 300));
  }
  return d.data;
};

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8'));
const EFF = T.rhythmChanges?.effective || '2026-08-17';
const ZIP_REGIONS = {};
for (const [name, r] of Object.entries(T.regions)) for (const z of r.zips) (ZIP_REGIONS[z] = ZIP_REGIONS[z] || []).push(name);
const ownerFor = (zip, date) => {
  const regs = ZIP_REGIONS[zip];
  if (!regs?.length) return null;
  // Both sides of a geoSplit share an owner except on the two lines that decide ownership; with the
  // five-way cut those are resolved per address, which needs coordinates we do not have here. Where
  // the candidate regions disagree the caller is told, rather than a coin being flipped.
  const owners = [...new Set(regs.map(n => (date >= EFF ? (T.regions[n][`ownerFrom_${EFF.replace(/-/g, '_')}`] || T.regions[n].owner) : T.regions[n].owner)))];
  return owners.length === 1 ? owners[0] : { ambiguous: owners, regions: regs };
};

const ptDay = iso => new Date(new Date(iso).getTime() - 7 * 3600e3).toISOString().slice(0, 10);
const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
const dowOf = d => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(d + 'T12:00:00Z').getUTCDay()];

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, AUDIT), 'utf8'));
const adds = audit.adds || [];
if (!adds.length) { console.log('no adds in the audit file'); process.exit(0); }

// ---- board scan: one paged fetch per contiguous window the adds actually need ----
const windows = [];
for (const a of adds) {
  const from = a.target, to = addD(a.target, HORIZON);
  const hit = windows.find(w => from <= addD(w.to, 3) && to >= addD(w.from, -3));
  if (hit) { hit.from = from < hit.from ? from : hit.from; hit.to = to > hit.to ? to : hit.to; }
  else windows.push({ from, to });
}
// The board comes from snapshots written by fetch-window-visits.mjs, NOT from a scan here.
// Reason (measured 2026-08-14): a `visits(filter:{startAt:{after,before}})` scan of a single day
// returned 73 visits where the week-range fetch saw 94 — including all 9 stops in the very zip
// being placed, which made a real cluster look like an empty day. A placement engine that under-
// reads the board silently invents "nobody is there" and books a lone stop into open country.
// Pass every snapshot covering the target dates: --boards=week-0817-verify.json,board-0907.json
const BOARDS = (flag('boards', '') || '').split(',').filter(Boolean);
if (!BOARDS.length) { console.log('--boards=<snapshot.json>[,...] is required (produced by fetch-window-visits.mjs)'); process.exit(1); }
const board = [];
for (const f of BOARDS) {
  const snap = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
  let n = 0;
  for (const v of snap) {
    if (v.isComplete) continue;
    board.push({
      day: ptDay(v.startAt), tech: (v.assignedUsers?.nodes || [])[0]?.name?.full || null,
      zip: ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5), job: v.job?.jobNumber,
    });
    n++;
  }
  const dys = [...new Set(snap.map(v => ptDay(v.startAt)))].sort();
  console.log(`board ${f}: ${n} open visits, ${dys[0]}..${dys[dys.length - 1]}`);
}
const covered = new Set(board.map(b => b.day));

// ---- place each add ----
const plan = [], problems = [];
for (const a of adds) {
  const job = await gql(`query { jobs(first: 5, searchTerm: "${a.jn}") { nodes { id jobNumber client { name }
    property { address { street city postalCode } } } } }`)
    .then(d => (d.jobs?.nodes || []).find(j => String(j.jobNumber) === String(a.jn)));
  await sleep(320);
  if (!job) { problems.push(`#${a.jn} job not found`); continue; }
  const zip = ((job.property?.address?.postalCode || a.zip || '') + '').trim().slice(0, 5);

  let place = null, sameZipStops = 0, tech = null, note = '', how = 'cluster', fwdBlocked = false;
  // Search from 3 days EARLY, not from the due date. The interval is a maximum wait, not an
  // appointment: two days early is a customer served sooner, while the next cluster day can be a
  // week late. Same reasoning as the weekend rule — move earlier, never later.
  const TOMORROW = addD(ptDay(new Date().toISOString()), 1);
  // Order matters: try ON OR AFTER the due date first, earliest such day, because the interval is
  // what the cadence rules actually promise. Only if nothing on/after is available inside the
  // horizon do we look BACK up to 3 days, closest to due first. Scanning -3..+21 in one sweep takes
  // whatever comes first and put Marc Abraham on a 1-stop Monday three days early when his own due
  // date had a 7-stop Thursday in the same zip.
  const order = [];
  for (let i = 0; i <= HORIZON; i++) order.push({ d: addD(a.target, i), fwd: true });
  for (let i = 1; i <= 3; i++) order.push({ d: addD(a.target, -i), fwd: false });
  for (const { d, fwd } of order) {
    if (d < TOMORROW) continue;
    if (['sat', 'sun'].includes(dowOf(d))) continue;          // Got Moles is Mon-Fri
    // Stop the forward search at the edge of what the snapshots actually cover. Beyond it there is
    // no data, not an empty day — walking through the gap sent Madera West Condos to 09-07, 17 days
    // late, when its own zip had a cluster two days BEFORE the due date.
    if (fwd && fwdBlocked) continue;
    if (fwd && !covered.has(d)) { fwdBlocked = true; continue; }
    const own = ownerFor(zip, d);
    if (!own) { note = `zip ${zip} is in no territory`; break; }
    if (own.ambiguous) { note = `zip ${zip} straddles a geoSplit (${own.ambiguous.join(' / ')}) — needs the address resolved`; break; }
    const stops = board.filter(b => b.day === d && b.zip === zip && b.tech === own);
    if (stops.length) { place = d; sameZipStops = stops.length; tech = own; break; }
  }
  // Nothing to join: past ~2 weeks out the board is barely booked (route-horizon-extend is off), so
  // "join an existing cluster" has nothing to join BY CONSTRUCTION — the cluster forms later, around
  // whatever anchors are already there. Fall back to the region's own rhythm weekday, which is the
  // day that cluster will land on anyway. Flagged as `rhythm` so it is never mistaken for a real join.
  // Only fall back when the days in question are genuinely NOT in any snapshot. If the window is
  // covered and still has no cluster, that is a real answer — the owner is not scheduled in that zip
  // — and it goes to the problem list for a human, never to a guessed day.
  const windowCovered = (() => {
    for (let i = -3; i <= HORIZON; i++) { const d = addD(a.target, i); if (!['sat', 'sun'].includes(dowOf(d)) && !covered.has(d)) return false; }
    return true;
  })();
  if (!place && !note && !windowCovered) {
    const own = ownerFor(zip, a.target);
    const region = (ZIP_REGIONS[zip] || [])[0];
    const rhythm = ((T.rhythmChanges?.byRegion?.[region]?.newRhythm ?? T.regions[region]?.rhythm) || '')
      .toLowerCase().match(/mon|tue|wed|thu|fri/g) || [];
    if (typeof own === 'string' && rhythm.length) {
      for (let i = -3; i <= HORIZON; i++) {
        const d = addD(a.target, i);
        if (d < TOMORROW || !rhythm.includes(dowOf(d))) continue;
        place = d; tech = own; how = 'rhythm'; sameZipStops = 0; break;
      }
    }
  }
  if (!place) {
    // Fall back to the owner's nearest working day in the same territory, and say so out loud.
    const own = ownerFor(zip, a.target);
    problems.push(`#${a.jn} ${job.client?.name} ${zip} — no day in ${a.target}..${addD(a.target, HORIZON)} where ${typeof own === 'string' ? own : 'the owner'} is already in ${zip}${note ? ' (' + note + ')' : ''}`);
    continue;
  }
  plan.push({
    jn: String(a.jn), jobId: job.id, client: job.client?.name, street: job.property?.address?.street,
    city: job.property?.address?.city, zip, act: a.code, caught: a.caught, due: a.required,
    next: a.nextVisit, place, tech, sameZipStops, how, stillNeeded: true,
    why: a.why, lastVisit: a.lastVisit, product: a.product,
  });
}

const pad = (s, n) => String(s ?? '').padEnd(n);
console.log(`\nPLACEMENT — ${plan.length} bookable, ${problems.length} unplaceable\n`);
console.log(pad('job', 6) + pad('client', 20) + pad('zip', 7) + pad('due', 11) + pad('place', 11) + pad('dow', 5) + pad('tech', 16) + 'joins');
for (const p of plan) console.log(pad('#' + p.jn, 6) + pad((p.client || '').slice(0, 18), 20) + pad(p.zip, 7) + pad(p.due, 11) + pad(p.place, 11) + pad(dowOf(p.place), 5) + pad(p.tech, 16) + (p.how==='rhythm' ? 'rhythm day (week not built yet)' : p.sameZipStops + ' stop(s)'));
if (problems.length) { console.log('\nUNPLACEABLE:'); for (const p of problems) console.log('  ' + p); }
fs.writeFileSync(path.join(__dirname, OUT), JSON.stringify(plan, null, 2));
console.log(`\nplan -> ${OUT}   (node add-interim-visits.mjs dry --plan=${OUT})`);
