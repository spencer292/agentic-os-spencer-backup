#!/usr/bin/env node
// PROJECT THE WEEK — read-only preview of what the five-way cut does to a real Jobber week.
//
// Answers the question Spencer has to approve before any live write: after ownership moves to the
// v9 owners AND the blocks move to their v9 route-days, what does each tech's week actually look
// like? Replicates the two engines' own logic rather than guessing:
//   ownership -> assign-by-territory.mjs (region owner from ownerFrom_<effective>, geoSplit resolved
//                per address from geo-side-cache.json)
//   day       -> rebalance-week.mjs chooseDays (greedy least-loaded among the region's rhythm days;
//                SETs stay on their promised day)
//
// Hours use the per-tech measured service times (tech-service-times.json) plus the region's measured
// driveMinPerStop, so they are comparable to the census figures in the cut review. They are an
// estimate: real sequencing is OptimoRoute's job.
//
// Usage: node project-week.mjs <visits.json> [--effective=2026-08-17]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RA = path.resolve(__dirname, '../../technician-route-automation');
const visitsFile = process.argv[2];
if (!visitsFile) { console.log('Usage: project-week.mjs <visits.json> [--effective=YYYY-MM-DD]'); process.exit(1); }
const EFF = (process.argv.find(a => a.startsWith('--effective=')) || '--effective=2026-08-17').split('=')[1];

const T = JSON.parse(fs.readFileSync(path.join(RA, 'territories.json'), 'utf8'));
const visits = JSON.parse(fs.readFileSync(path.isAbsolute(visitsFile) ? visitsFile : path.join(RA, visitsFile), 'utf8'));
const SVC = JSON.parse(fs.readFileSync(path.join(RA, 'tech-service-times.json'), 'utf8'));
const { sideOf, loadCache } = await import(path.join(RA, 'geo-side.mjs').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'));
const geoCache = loadCache();

const RC = T.rhythmChanges || {};
const ZIP_REGIONS = {};
for (const [name, r] of Object.entries(T.regions)) for (const z of r.zips) (ZIP_REGIONS[z] = ZIP_REGIONS[z] || []).push(name);

const dowOf = d => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const zipOf = v => ((v.property?.address?.postalCode || '') + '').trim().slice(0, 5);
const streetOf = v => v.property?.address?.street || '';

function regionFor(v) {
  const zip = zipOf(v);
  const regs = ZIP_REGIONS[zip];
  if (!regs?.length) return null;
  if (regs.length === 1) return regs[0];
  const split = regs.filter(n => {
    const gs = T.regions[n]?.geoSplit;
    return gs && (!gs.appliesToZips || gs.appliesToZips.includes(zip));
  });
  if (split.length < 2) return regs[0];
  const lineName = T.regions[split[0]].geoSplit.line;
  const line = (T.geoSplitLines || {})[lineName];
  if (!line) return split[0];
  const { side } = sideOf(lineName, line, streetOf(v), zip, geoCache);
  return split.find(n => T.regions[n].geoSplit.side === side) || split[0];
}
const ownerOf = name => T.regions[name][`ownerFrom_${EFF.replace(/-/g, '_')}`] || T.regions[name].owner;
// --override="Region Name=tue+wed;Other Region=mon" tries an alternative day map WITHOUT touching
// territories.json, so a proposed re-tile can be costed before anything is written.
const OVERRIDE = {};
for (const part of ((process.argv.find(a => a.startsWith('--override=')) || '').split('=').slice(1).join('=') || '').split(';')) {
  const i = part.lastIndexOf('=');
  if (i > 0) OVERRIDE[part.slice(0, i).trim()] = part.slice(i + 1).trim();
}
if (Object.keys(OVERRIDE).length) console.log('day-map override: ' + JSON.stringify(OVERRIDE));
const rhythmOf = name => ((OVERRIDE[name] ?? RC.byRegion?.[name]?.newRhythm ?? T.regions[name].rhythm) || '')
  .toLowerCase().match(/mon|tue|wed|thu|fri/g) || [];

const days = [...new Set(visits.map(v => v.startAt.slice(0, 10)))].sort()
  .filter(d => !['sat', 'sun'].includes(dowOf(d)));

// ---- resolve every visit ----
const rows = [], noRegion = [], weekend = [];
for (const v of visits) {
  const date = v.startAt.slice(0, 10);
  if (['sat', 'sun'].includes(dowOf(date))) { weekend.push(v); continue; }
  const region = regionFor(v);
  if (!region) { noRegion.push(v); continue; }
  const isSet = v.job?.startAt?.slice(0, 10) === date;
  rows.push({
    job: v.job.jobNumber, date, isSet, region,
    tech: ownerOf(region),
    was: (v.assignedUsers?.nodes || []).map(n => n.name.full)[0] || '(unassigned)',
    cands: isSet ? [date] : days.filter(d => rhythmOf(region).includes(dowOf(d))),
    drive: T.regions[region].driveMinPerStop ?? 12,
  });
}

// ---- greedy day choice, mirroring rebalance-week chooseDays ----
const load = {};
rows.sort((a, b) => (a.cands.length || 9) - (b.cands.length || 9));
for (const r of rows) {
  load[r.tech] = load[r.tech] || {};
  const cands = r.cands.length ? r.cands : days;
  r.day = cands.reduce((b, d) => ((load[r.tech][d] || 0) < (load[r.tech][b] || 0) ? d : b), cands[0]);
  load[r.tech][r.day] = (load[r.tech][r.day] || 0) + 1;
}

// ---- report ----
const svcFor = (tech, isSet) => {
  const k = Object.keys(SVC).find(n => n !== '_comment' && tech.startsWith(n.split(' ')[0]));
  const s = (k && SVC[k]) || SVC.default || {};
  return isSet ? (s.set ?? 26) : (s.check ?? 13);
};
const techs = [...new Set(rows.map(r => r.tech))].sort();
const cell = {}, hrs = {};
for (const r of rows) {
  ((cell[r.tech] = cell[r.tech] || {})[r.day] = (cell[r.tech][r.day] || 0) + 1);
  ((hrs[r.tech] = hrs[r.tech] || {})[r.day] = (hrs[r.tech][r.day] || 0) + svcFor(r.tech, r.isSet) + r.drive);
}
const pad = (s, n) => String(s).padEnd(n);
console.log(`\nPROJECTED WEEK — five-way cut, ownership + route-day, effective ${EFF}`);
console.log(`source: ${visitsFile}   ${rows.length} routable visits, ${weekend.length} weekend defect(s), ${noRegion.length} unmapped\n`);
console.log('VISITS   ' + pad('tech', 18) + days.map(d => d.slice(5).padStart(7)).join('') + '   total');
for (const t of techs) {
  const n = days.map(d => cell[t]?.[d] || 0);
  console.log('         ' + pad(t, 18) + n.map(x => String(x).padStart(7)).join('') + String(n.reduce((a, b) => a + b, 0)).padStart(8));
}
console.log('\nHOURS    ' + pad('tech', 18) + days.map(d => d.slice(5).padStart(7)).join('') + '   total');
for (const t of techs) {
  const h = days.map(d => (hrs[t]?.[d] || 0) / 60);
  console.log('         ' + pad(t, 18) + h.map(x => x.toFixed(1).padStart(7)).join('') + h.reduce((a, b) => a + b, 0).toFixed(1).padStart(8));
}
const over = [];
for (const t of techs) for (const d of days) if ((hrs[t]?.[d] || 0) / 60 > 9) over.push(`${t} ${d} ${((hrs[t][d]) / 60).toFixed(1)}h`);
const dead = [];
for (const t of techs) for (const d of days) if (!(cell[t]?.[d])) dead.push(`${t} ${d.slice(5)}`);
console.log(`\nover 9h: ${over.length ? over.join(', ') : 'none'}`);
console.log(`dead route-days: ${dead.length ? dead.join(', ') : 'none'}`);
console.log(`changing weekday: ${rows.filter(r => r.day !== r.date).length} of ${rows.length} (${(100 * rows.filter(r => r.day !== r.date).length / rows.length).toFixed(1)}%)`);
console.log(`changing tech: ${rows.filter(r => r.tech !== r.was).length}`);
if (weekend.length) console.log(`\nweekend defects: ${weekend.map(v => '#' + v.job.jobNumber + ' ' + v.startAt.slice(0, 10)).join(', ')}`);
if (noRegion.length) console.log(`unmapped: ${noRegion.map(v => '#' + v.job.jobNumber + ' ' + (zipOf(v) || 'NO ZIP') + ' ' + (v.property?.address?.city || '')).join(', ')}`);
