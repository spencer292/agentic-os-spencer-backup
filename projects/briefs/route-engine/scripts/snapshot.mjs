#!/usr/bin/env node
// ROUTE ENGINE — BOARD SNAPSHOT.  Step 3 of spec v2 Part 7.
//
// One immutable, content-addressed picture of the board, so that everything downstream can say
// WHICH board it was reasoning about. The spec's `diff(approved proposal, fresh snapshot)` is
// meaningless without this: a plan is approved against a board, and the board moves underneath it.
//
// WHY A HASH AND NOT A TIMESTAMP
//   A timestamp says when it was taken. A hash says whether two things are the same board. Approval
//   references the hash; if the hash has changed by write-back time, the approval no longer applies
//   to what is there now, and that has to be a decision rather than a surprise.
//
// COMPLETENESS IS THE POINT
//   Spec Part 3 makes "snapshot incomplete" run-fatal, and rightly: a partial page of Jobber visits
//   looks exactly like a quiet week. Jobber reports totalCount alongside the page, so a short pull
//   is DETECTABLE — this refuses to write a snapshot it cannot prove is whole, rather than writing
//   a plausible one.
//
// AUTH: goes through the sanctioned tool-jobber client rather than minting its own token. There are
// already 66 independent refreshers of the one shared token (defect D5); this does not add a 67th.
//
// Read-only. Writes nothing to Jobber or OptimoRoute.
//
// Usage:
//   node snapshot.mjs --from=2026-08-24 --to=2026-08-28
//   node snapshot.mjs --from=... --to=... --label="pre-routing 08-24"
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const RE = path.resolve(HERE, '..');
const JOBBER = path.join(ROOT, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const SNAP_DIR = path.join(RE, 'snapshots');

const arg = (n, d = null) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const FROM = arg('from'), TO = arg('to'), LABEL = arg('label', '');
if (!FROM || !TO) { console.error('Usage: snapshot.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD [--label="..."]'); process.exit(1); }

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function jobber(query, tries = 6) {
  for (let a = 1; a <= tries; a++) {
    try {
      return JSON.parse(execFileSync('node', [JOBBER, 'query', query], { encoding: 'utf8', maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'pipe'] }));
    } catch (e) {
      const msg = String(e.stdout || e.message || '');
      if (/THROTTLED|Throttled/i.test(msg) && a < tries) { process.stderr.write(`[throttled ${a * 12}s]`); sleep(a * 12000); continue; }
      if (a === tries) throw new Error(msg.slice(0, 500));
      sleep(3000);
    }
  }
}

// ---------------------------------------------------------------- jobber board
const fromISO = new Date(`${FROM}T00:00:00-07:00`).toISOString();
const toISO = new Date(`${TO}T23:59:59-07:00`).toISOString();

process.stderr.write(`Snapshot ${FROM} .. ${TO}\n  jobber visits `);
let cursor = null, visits = [], declared = null;
while (true) {
  const d = jobber(`{
    visits(first: 50, filter: { startAt: { after: "${fromISO}", before: "${toISO}" } }${cursor ? `, after: "${cursor}"` : ''}) {
      pageInfo { hasNextPage endCursor }
      totalCount
      nodes {
        id startAt endAt isComplete
        assignedUsers(first: 3) { nodes { name { full } } }
        job { jobNumber jobStatus }
      }
    }
  }`).visits;
  if (declared === null) declared = d.totalCount;
  visits.push(...d.nodes);
  process.stderr.write(`${visits.length}/${declared} `);
  if (!d.pageInfo.hasNextPage) break;
  cursor = d.pageInfo.endCursor;
  sleep(2200);
}
process.stderr.write('\n');

// Run-fatal: a short pull is indistinguishable from a quiet week once it is written down.
// Jobber's totalCount can tick up mid-pull if somebody books while we page, so allow growth
// but never a shortfall.
if (visits.length < declared) {
  console.error(`\nSNAPSHOT REFUSED — incomplete pull: got ${visits.length} of ${declared} visits.`);
  console.error(`A partial board looks exactly like a quiet week. Re-run; nothing was written.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- optimoroute plan
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const dates = [];
for (let d = new Date(`${FROM}T12:00:00Z`); d <= new Date(`${TO}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
  dates.push(d.toISOString().slice(0, 10));
}
const routes = {};
let orStops = 0;
process.stderr.write('  optimoroute ');
for (const d of dates) {
  const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${env.OPTIMOROUTE_API_KEY}&date=${d}`);
  const j = await r.json().catch(() => ({}));
  const rs = (j.routes || []).map(rt => ({
    driver: rt.driverName || rt.driverSerial || null,
    stops: (rt.stops || []).filter(s => s.orderNo).map(s => ({ orderNo: s.orderNo, scheduledAt: s.scheduledAt || null })),
  }));
  routes[d] = rs;
  orStops += rs.reduce((n, x) => n + x.stops.length, 0);
  process.stderr.write('.');
}
process.stderr.write(`  ${orStops} stops\n`);

// ---------------------------------------------------------------- provenance
// The snapshot records WHICH rulebook and WHICH map it was taken under. A board is only
// interpretable against those; pairing a snapshot with a later rulebook is how a "correct" replay
// silently produces a different answer.
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const rules = readJSON(path.join(RE, 'rules/scheduling-rules.json'));
const terr = readJSON(path.join(ROOT, 'projects/briefs/technician-route-automation/territories.json'));
const grid = readJSON(path.join(ROOT, 'projects/briefs/callrail-faq/service-day-lookup/service-day-grid.json'));

// Canonical form: keys sorted at every level, arrays ordered deterministically. Two runs over an
// unchanged board must produce the SAME hash or the hash means nothing.
const canon = (v) => {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
};

const board = canon({
  window: { from: FROM, to: TO },
  visits: visits
    .map(v => ({
      id: v.id,
      jobNumber: v.job?.jobNumber ?? null,
      jobStatus: v.job?.jobStatus ?? null,
      startAt: v.startAt,
      endAt: v.endAt,
      isComplete: !!v.isComplete,
      techs: (v.assignedUsers?.nodes || []).map(u => u.name.full).sort(),
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  routes,
});

const hash = crypto.createHash('sha256').update(JSON.stringify(board)).digest('hex');
const short = hash.slice(0, 12);

const snapshot = {
  hash,
  takenAt: new Date().toISOString(),
  label: LABEL || null,
  window: { from: FROM, to: TO },
  counts: {
    visitsDeclaredByJobber: declared,
    visitsCaptured: visits.length,
    complete: visits.filter(v => v.isComplete).length,
    untimed: visits.filter(v => (new Date(v.endAt) - new Date(v.startAt)) / 36e5 > 20).length,
    unassigned: visits.filter(v => !(v.assignedUsers?.nodes || []).length).length,
    optimoRouteStops: orStops,
    daysPlanned: Object.values(routes).filter(r => r.length).length,
    daysInWindow: dates.length,
  },
  provenance: {
    rulesVersion: rules?.version ?? null,
    rulesStatus: rules?._status?.slice(0, 60) ?? null,
    territoriesVersion: terr?.version ?? null,
    serviceDayGridGenerated: grid?.generated ?? null,
  },
  board,
};

fs.mkdirSync(SNAP_DIR, { recursive: true });
const file = path.join(SNAP_DIR, `${FROM}_${TO}-${short}.json`);
fs.writeFileSync(file, JSON.stringify(snapshot, null, 1));
fs.writeFileSync(path.join(SNAP_DIR, 'latest.json'), JSON.stringify({ hash, file: path.basename(file), takenAt: snapshot.takenAt, window: snapshot.window, label: snapshot.label }, null, 1));

const c = snapshot.counts;
console.log(`\nSNAPSHOT ${short}`);
console.log(`  window        ${FROM} .. ${TO}`);
console.log(`  visits        ${c.visitsCaptured} captured / ${c.visitsDeclaredByJobber} declared  (${c.complete} complete)`);
console.log(`  untimed       ${c.untimed}`);
console.log(`  unassigned    ${c.unassigned}`);
console.log(`  OR stops      ${c.optimoRouteStops} across ${c.daysPlanned}/${c.daysInWindow} planned days`);
console.log(`  rules         ${snapshot.provenance.rulesVersion}`);
console.log(`  territories   ${snapshot.provenance.territoriesVersion}`);
console.log(`  file          ${file}`);
console.log(`\n  Reference this board as ${short}. Re-running over an unchanged board reproduces it.\n`);
