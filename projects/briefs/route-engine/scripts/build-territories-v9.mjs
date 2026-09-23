#!/usr/bin/env node
// BUILD territories.json v9 — five highway territories, effective 2026-08-17.
//
// Why (2026-08-12): Cory Ventura stays in the field instead of stepping out when Tavis returns,
// so the board goes from four territories to five. Spencer picked the highway map (Option A) and
// chose to absorb the weekday churn in one move. See 2026-08-12_five-territory-cut-REVIEW.md.
//
// HOW OWNERSHIP IS ENCODED, and why it matters:
//   assign-by-territory.mjs resolves an owner as `regions[x].owner`, then walks `handovers` and
//   applies any whose `effective` date is <= the VISIT's date. So the correct encoding for
//   "X owned this until 08-17, Y owns it after" is to leave `owner` as the OLD owner and add a
//   handover. Rewriting `owner` directly would retro-assign this week's live, already-routed
//   board (Mon 08-10..Fri 08-14) to the new map. That is the single most dangerous mistake
//   available here, so v9 keeps v8's owners and expresses the whole five-way cut as handovers.
//
// Day rhythms are NOT rewritten in place for the same reason — `rhythm` has no date mechanism and
// several consumers read it (make-service-day-sheet, build-address-day-lookup). The new days go in
// a dated `rhythmChanges` block; consumers are repointed as a separate, explicit step.
//
// WRITES ONLY to route-engine/data/territories-v9.json. Does not touch the live territories.json,
// Jobber, or OptimoRoute. Cutover is a separate gated action.
//
// Usage: node build-territories-v9.mjs [--out=path]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const V8 = path.join(REPO, 'projects/briefs/technician-route-automation/territories.json');
const PLAN = path.join(__dirname, '../data/five-way-highway-day-plan.json');
const MAP = path.join(__dirname, '../data/five-way-highway.json');
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const OUT = flag('out', path.join(__dirname, '../data/territories-v9.json'));

const EFFECTIVE = '2026-08-17';
const v8 = JSON.parse(fs.readFileSync(V8, 'utf8'));
const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
const hwmap = JSON.parse(fs.readFileSync(MAP, 'utf8'));

const TERRITORY_LABEL = {
  'Alias Franks': 'T1 — EASTSIDE: north of I-90, east of Lake Washington',
  'Tavis Alexander': 'T2 — SEATTLE + RENTON: Seattle city both sides of I-90, Mercer Island, Renton/Newcastle',
  'Robert Norton': 'T3 — SR-18 CORRIDOR: Kent, Auburn, Maple Valley, Enumclaw, Issaquah South',
  'Cory Ventura': 'T4 — SR-410 COUNTRY: Buckley/Bonney Lake/Sumner, Puyallup, Graham/Orting/Eatonville',
  'Luke LaVergne': 'T5 — I-705 WEST AND SOUTH: Tacoma, Peninsula, Gig Harbor, Thurston, Lakewood, Federal Way',
};

// block name -> { newOwner, newDays }
const target = new Map();
for (const t of plan.territories) {
  for (const b of t.blocks) target.set(b.block, { owner: t.tech, days: b.nowDays, wasDays: b.wasDays, changed: b.changed, movingVisits: b.visitsMovingWeekday });
}

const v9 = JSON.parse(JSON.stringify(v8));
v9.version = '2026-08-12-v9-five-highway';
v9._comment =
  'TERRITORY MAP v9 — FIVE highway territories, effective ' + EFFECTIVE + '. v8 was four territories ' +
  'carrying 153.7 h/wk, i.e. 19.4 of 20 available tech-days BEFORE the measured ~9 h/wk of ' +
  'drive-to-first-job — the board was overflowing, not drifting, which is what put every tech in ' +
  'overtime. Cory Ventura stays in the field rather than stepping out when Tavis returns, so the ' +
  'same work splits five ways at ~30.7 h/wk each (6.1 h per route-day), inside Spencer\'s 8h target ' +
  'with headroom for spring. The new line is forced: north of I-90 was 40.7 h/wk, more than one tech ' +
  'can hold at 8h/day, so T1 splits at Lake Washington/I-405 and Seattle city reunites across I-90 ' +
  'with West Seattle and Burien. Chosen by Spencer 2026-08-12 over a better-balanced solver map whose ' +
  'boundaries could not be described in a sentence. Blocks move WHOLE — no customer changes owner ' +
  'mid-block. Built by route-engine/scripts/build-territories-v9.mjs.';
v9._supersedes = 'territories.json v8 (2026-08-07, four highway territories). v8 region zip lists, geoSplitLines and dayOverrides carry forward unchanged.';

// ---------------------------------------------------------------------------
// Ownership: expressed as handovers effective 2026-08-17, NOT by rewriting owner.
// ---------------------------------------------------------------------------
const gained = new Map();   // newOwner -> [regionName]
for (const [name, r] of Object.entries(v9.regions)) {
  const t = target.get(name);
  if (!t) throw new Error(`region "${name}" missing from the day plan`);
  if (t.owner !== r.owner) {
    if (!gained.has(t.owner)) gained.set(t.owner, []);
    gained.get(t.owner).push(name);
  }
  r.territoryFrom_2026_08_17 = TERRITORY_LABEL[t.owner];
  r.ownerFrom_2026_08_17 = t.owner;
}

v9.handovers = [];
for (const [to, regions] of gained) {
  const from = [...new Set(regions.map(n => v9.regions[n].owner))];
  v9.handovers.push({
    effective: EFFECTIVE,
    from: from.length === 1 ? from[0] : from,
    to,
    regions,
    note: `Five-way cut. ${to} takes ${regions.length} region block(s) from ${from.join(' / ')}. Applied per VISIT DATE: visits before ${EFFECTIVE} keep the v8 owner, visits on or after it move. Do not rewrite regions[].owner — that would retro-assign the live week of 08-10.`,
  });
}

// ---------------------------------------------------------------------------
// Day rhythms: dated, not applied in place.
// ---------------------------------------------------------------------------
const rhythmChanges = {
  _comment:
    'New route-day for each region block, effective ' + EFFECTIVE + '. NOT written into regions[].rhythm ' +
    'because rhythm has no date mechanism and consumers (make-service-day-sheet, build-address-day-lookup) ' +
    'read it for TODAY. Re-dealing 22 blocks into 5 territories breaks v8\'s one-block-per-weekday tiling, ' +
    'so blocks must move days or a tech gets a dead day plus two 9h days. Spencer chose 2026-08-12 to ' +
    'absorb this in one move. Tuned by day-tile.mjs at churn-weight=2: the cheapest point with zero dead ' +
    'route-days and nothing past 8.8h. A block listed on two days has its zips split across both.',
  effective: EFFECTIVE,
  totalVisitsChangingWeekday: plan.summary.visitsChangingWeekday,
  pctChangingWeekday: plan.summary.pctChangingWeekday,
  worstRouteDayHours: plan.summary.worstRouteDayHours,
  deadRouteDays: plan.summary.deadRouteDays,
  byRegion: {},
};
for (const [name] of Object.entries(v9.regions)) {
  const t = target.get(name);
  rhythmChanges.byRegion[name] = {
    owner: t.owner,
    wasRhythm: t.wasDays.join(' + '),
    newRhythm: t.days.join(' + '),
    changed: t.changed,
    visitsMovingWeekday: t.movingVisits,
  };
}
v9.rhythmChanges = rhythmChanges;

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------
v9.roster['Cory Ventura'] = {
  home: 'Buckley 98321',
  status: 'field',
  territory: TERRITORY_LABEL['Cory Ventura'],
  note: 'STAYS IN THE FIELD (Spencer 2026-08-12) rather than stepping out when Tavis returns — this is what makes five territories possible. Buckley 98321 is inside his own ground for the first time; he previously owned T2 (Renton/Bellevue/Burien) from a Buckley home, a 45-60 min commute.',
};
v9.roster['Tavis Alexander'] = {
  home: 'unknown',
  status: 'field',
  startsInField: EFFECTIVE,
  territory: TERRITORY_LABEL['Tavis Alexander'],
  note: 'Returning ' + EFFECTIVE + '. Given Seattle + Renton partly BECAUSE it is central and his home address is still unknown, so the commute cannot be measured. CAPTURE HIS HOME ADDRESS — outstanding since 2026-08-07.',
};
v9.roster['Alias Franks'].territory = TERRITORY_LABEL['Alias Franks'];
v9.roster['Alias Franks'].note = 'Home zip 98296 is inside his own territory. Loses North Seattle/Shoreline to Tavis in the five-way cut; keeps the whole Eastside.';
v9.roster['Robert Norton'].territory = TERRITORY_LABEL['Robert Norton'];
v9.roster['Robert Norton'].note = 'Home Maple Valley 98038 is INSIDE his own territory from ' + EFFECTIVE + ' — v8 had him commuting into T3 from T2 ground. Takes both sides of SR-516; absorbs the largest weekday churn (52 visits/wk) because both SR-516 blocks ran Monday in v8, 19.4h on one day.';
v9.roster['Luke LaVergne'].territory = TERRITORY_LABEL['Luke LaVergne'];
v9.roster['Luke LaVergne'].note = 'Territory is v8\'s T4 intact. Home Puyallup 98373 sits in Cory\'s new ground, ~12 min from Tacoma — unchanged from v8 and accepted.';

// ---------------------------------------------------------------------------
// geoSplit: sr-516 stops deciding ownership
// ---------------------------------------------------------------------------
if (v9.geoSplitLines['sr-516']) {
  v9.geoSplitLines['sr-516'].crossesOwners = false;
  v9.geoSplitLines['sr-516']._v9note =
    'From ' + EFFECTIVE + ' BOTH sides of SR-516 belong to Robert Norton, so this line no longer changes the ' +
    'OWNER — only which weekday the address runs. assign-by-territory no longer needs to resolve it; ' +
    'the day-level tools still do. bellevue-ne8th still changes owner (Points/NE 8th -> Alias, ' +
    'Bellevue South/Mercer -> Tavis). thurston-i5-101 remains day-only, both sides Luke.';
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------
v9.capacity = {
  measuredWeek: v8.capacity.measuredWeek,
  source: v8.capacity.source + ' — re-dealt five ways by route-engine/scripts/five-way-highway.mjs',
  visitsPerWeek: v8.capacity.visitsPerWeek,
  hoursPerWeek: hwmap.totalHours,
  techDaysNeeded: Number((hwmap.totalHours / 8).toFixed(1)),
  techDaysAvailable: 25,
  targetPerTech: hwmap.targetPerTech,
  byTerritory: Object.fromEntries(plan.territories.map(t => [
    `${TERRITORY_LABEL[t.tech].split(' —')[0]} ${t.tech}`,
    { hoursPerWeek: t.hoursPerWeek, visitsPerWeek: t.visitsPerWeek, dayHours: t.dayHours, visitsChangingWeekday: t.visitsChangingWeekday },
  ])),
  note:
    `Five techs, ${hwmap.totalHours} h/wk, ${(hwmap.totalHours / 8).toFixed(1)} of 25 tech-days — 76% utilised before commute, ` +
    'against 97% at four. That slack is deliberate: Spencer staffs NEAR PEAK so busy season still fits ' +
    'inside 8h days. Compare load by hoursPerWeek, never visit count. Caveat: these hours assume one pace ' +
    'for every tech, and measured pace varies 23% (Cory 17.3 min/stop to Alias 21.3), so Alias\'s 34.1 h/wk ' +
    'is effectively heavier than it reads and Cory\'s 30.2 lighter. Per-driver service times are still NOT ' +
    'set in OptimoRoute — Robert and Tavis are too new.',
};

v9._knownCosts.coryCommute = 'RESOLVED by v9. Cory owns SR-410 country from a Buckley 98321 home — he now starts inside his own territory. The 45-60 min commute in v8 is gone.';
v9._knownCosts.techsOutsideOwnTerritory = 'Only Luke remains outside his own ground: home Puyallup 98373 sits in Cory\'s SR-410 territory, ~12 min from Tacoma. Robert is resolved by v9 (Maple Valley is now his own). Drive-to-first-job is a measured 22% of weekly miles.';
v9._knownCosts.tavisHomeUnknown = 'BLOCKING-ADJACENT: Tavis takes Seattle + Renton on ' + EFFECTIVE + ' with no home address on file, so his commute is unmeasured and his route start point is a guess. Outstanding since 2026-08-07.';
v9._knownCosts.weekdayChurn = `The five-way cut moves ${plan.summary.visitsChangingWeekday} visits/wk (${plan.summary.pctChangingWeekday}%) to a different weekday. One-time, authorised by Spencer 2026-08-12. The route-engine brief forbids mass re-cuts as a habit — creating a territory is the one event allowed to move people.`;

fs.writeFileSync(OUT, JSON.stringify(v9, null, 1));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`\nterritories v9 — five highway territories, effective ${EFFECTIVE}\n`);
console.log('OWNERSHIP HANDOVERS (applied per visit date, v8 owners untouched):');
for (const h of v9.handovers) {
  console.log(`  ${h.to}  <-  ${Array.isArray(h.from) ? h.from.join(' / ') : h.from}`);
  for (const r of h.regions) console.log(`      ${r}`);
}
const unchanged = Object.keys(v9.regions).filter(n => target.get(n).owner === v9.regions[n].owner);
console.log(`\n  ${unchanged.length} region(s) keep their owner: ${unchanged.join(' | ')}`);

console.log('\nWEEKDAY CHANGES:');
for (const [n, r] of Object.entries(rhythmChanges.byRegion)) {
  if (r.changed) console.log(`  ${r.wasRhythm.padEnd(9)} -> ${r.newRhythm.padEnd(9)} ${String(r.visitsMovingWeekday).padStart(5)}v  ${n}  (${r.owner})`);
}
console.log(`\n  total ${plan.summary.visitsChangingWeekday} of ${plan.summary.visitsPerWeek} visits/wk (${plan.summary.pctChangingWeekday}%), worst route-day ${plan.summary.worstRouteDayHours}h, dead days ${plan.summary.deadRouteDays}`);
console.log(`\nWrote ${OUT}`);
console.log('LIVE territories.json is UNCHANGED. Cutover is a separate gated step.');
