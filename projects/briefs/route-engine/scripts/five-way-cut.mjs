#!/usr/bin/env node
// FIVE-WAY TERRITORY CUT — search for a balanced, contiguous 5-territory partition
// of the 22 measured region blocks in territories.json v8.
//
// Why this exists (2026-08-12): Spencer added a fifth field territory for the week of
// 2026-08-17 (Cory Ventura stays in the field instead of stepping out when Tavis returns).
// The v8 map is four highway-bounded territories. Five needs a re-deal.
//
// Design constraints, all from CLAUDE.local.md + route-engine/rules/scheduling-rules.json:
//   - Blocks move WHOLE. A block carries its rhythm day, so no customer changes weekday.
//   - Territories must be CONTIGUOUS (adjacency graph below, built from the highway map).
//   - Compare load by hoursPerWeek, NEVER visit count (drive-min/stop ranges 4.5 to 18).
//   - Target 8h/day => 40h/wk ceiling per tech; 153.7h / 5 = 30.7h/wk each.
//   - A tech should start at their own door: home blocks are seeded and pinned.
//   - Every tech wants work on all five weekdays; a dead day is wasted capacity.
//
// READ-ONLY. Writes only its own JSON/report output. Touches no live system.
//
// Usage: node five-way-cut.mjs [--iters=20000] [--restarts=400] [--json=out.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const TERR = path.join(REPO, 'projects/briefs/technician-route-automation/territories.json');

const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const ITERS = Number(flag('iters', 20000));
const RESTARTS = Number(flag('restarts', 400));
const OUT = flag('json', path.join(__dirname, '../data/five-way-cut.json'));

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// ---------------------------------------------------------------------------
// Blocks, in the order they appear in territories.json regions.
// ---------------------------------------------------------------------------
const terr = JSON.parse(fs.readFileSync(TERR, 'utf8'));
const NAMES = Object.keys(terr.regions);
const BLOCKS = NAMES.map((name, i) => {
  const r = terr.regions[name];
  const rhythm = String(r.rhythm || '').toLowerCase();
  const days = DAYS.filter(d => rhythm.includes(d));
  return {
    i, name,
    owner: r.owner,
    terr: (r.territory || '').split(' ')[0],
    zips: r.zips || [],
    hours: Number(r.hoursPerWeek) || 0,
    visits: Number(r.visitsPerWeek) || 0,
    driveMin: Number(r.driveMinPerStop) || 0,
    days: days.length ? days : ['mon'],
  };
});
const N = BLOCKS.length;
const idx = (frag) => {
  const hits = BLOCKS.filter(b => b.name.toLowerCase().includes(frag.toLowerCase()));
  if (hits.length !== 1) throw new Error(`block lookup "${frag}" matched ${hits.length}`);
  return hits[0].i;
};

// ---------------------------------------------------------------------------
// Adjacency — which region blocks physically touch. Built from the Puget Sound
// highway geography, not from zip arithmetic. Symmetric; declared one way.
// ---------------------------------------------------------------------------
const ADJ_PAIRS = [
  ['Points', 'North Seattle'], ['Points', 'Redmond'], ['Points', 'Sammamish'], ['Points', 'Bellevue South'],
  ['North Seattle', 'West Seattle'], ['North Seattle', 'Tukwila'], ['North Seattle', 'Bellevue South'],
  ['Redmond', 'Snoqualmie'], ['Redmond', 'Sammamish'],
  ['Snoqualmie', 'Sammamish'],
  ['Sammamish', 'Issaquah South'], ['Sammamish', 'Bellevue South'],
  ['North of SR-516', 'Renton'], ['North of SR-516', 'West Seattle'], ['North of SR-516', 'Tukwila'],
  ['North of SR-516', 'South of SR-516'], ['North of SR-516', 'Enumclaw'], ['North of SR-516', 'Federal Way'],
  ['Renton', 'Bellevue South'], ['Renton', 'Issaquah South'], ['Renton', 'Tukwila'],
  ['Renton', 'South of SR-516'], ['Renton', 'Enumclaw'],
  ['Bellevue South', 'Issaquah South'], ['Bellevue South', 'Tukwila'],
  ['Issaquah South', 'Enumclaw'],
  ['West Seattle', 'Tukwila'], ['West Seattle', 'Federal Way'],
  ['South of SR-516', 'Enumclaw'], ['South of SR-516', 'Buckley'], ['South of SR-516', 'Puyallup'],
  ['South of SR-516', 'Federal Way'],
  ['Enumclaw', 'Buckley'],
  ['Buckley', 'Puyallup'], ['Buckley', 'Graham'],
  ['Puyallup', 'Graham'], ['Puyallup', 'Tacoma'], ['Puyallup', 'Lakewood'], ['Puyallup', 'Federal Way'],
  ['Thurston North', 'Thurston South'], ['Thurston North', 'Lakewood'], ['Thurston North', 'Peninsula'],
  ['Thurston South', 'Graham'], ['Thurston South', 'Lakewood'],
  ['Lakewood', 'Graham'], ['Lakewood', 'Tacoma'],
  ['Tacoma', 'Peninsula'], ['Tacoma', 'Federal Way'],
];
const ADJ = Array.from({ length: N }, () => new Set());
for (const [a, b] of ADJ_PAIRS) { const x = idx(a), y = idx(b); ADJ[x].add(y); ADJ[y].add(x); }

// ---------------------------------------------------------------------------
// Techs. Home block is pinned so every tech starts the day at their own door.
// Tavis's home is unknown (flagged in territories.json roster) so he is unpinned
// and takes whatever coherent territory the search leaves.
// ---------------------------------------------------------------------------
const TECHS = [
  { key: 'alias',  name: 'Alias Franks',    home: 'Snohomish 98296',   pin: idx('Points') },
  { key: 'robert', name: 'Robert Norton',   home: 'Maple Valley 98038', pin: idx('North of SR-516') },
  { key: 'cory',   name: 'Cory Ventura',    home: 'Buckley 98321',      pin: idx('Buckley') },
  { key: 'luke',   name: 'Luke LaVergne',   home: 'Puyallup 98373',     pin: idx('Puyallup') },
  { key: 'tavis',  name: 'Tavis Alexander', home: 'UNKNOWN',            pin: null },
];
const K = TECHS.length;
const TOTAL = BLOCKS.reduce((s, b) => s + b.hours, 0);
const TARGET = TOTAL / K;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
function dayLoads(members) {
  const d = Object.fromEntries(DAYS.map(x => [x, 0]));
  for (const bi of members) {
    const b = BLOCKS[bi];
    const per = b.hours / b.days.length;
    for (const day of b.days) d[day] += per;
  }
  return d;
}

function score(assign) {
  const members = Array.from({ length: K }, () => []);
  for (let i = 0; i < N; i++) members[assign[i]].push(i);
  if (members.some(m => m.length === 0)) return { bad: true, total: Infinity };

  let balance = 0, overDay = 0, deadDays = 0, drive = 0;
  const per = [];
  for (let t = 0; t < K; t++) {
    const h = members[t].reduce((s, i) => s + BLOCKS[i].hours, 0);
    balance += (h - TARGET) ** 2;
    const dl = dayLoads(members[t]);
    for (const day of DAYS) {
      if (dl[day] > 8) overDay += (dl[day] - 8) ** 2;      // past Spencer's 8h target
      if (dl[day] < 0.5) deadDays += 1;                     // a wasted route-day
    }
    // prefer compact ground: penalise a territory spanning very different drive profiles
    const dms = members[t].map(i => BLOCKS[i].driveMin);
    drive += (Math.max(...dms) - Math.min(...dms)) ** 2 * 0.02;
    per.push({ tech: TECHS[t], hours: h, members: members[t], dayLoads: dl });
  }
  const total = balance * 1.0 + overDay * 3.0 + deadDays * 12.0 + drive;
  return { bad: false, total, balance, overDay, deadDays, per };
}

// contiguity: every territory's blocks form one connected component
function contiguous(assign, t) {
  const mem = [];
  for (let i = 0; i < N; i++) if (assign[i] === t) mem.push(i);
  if (mem.length <= 1) return true;
  const set = new Set(mem);
  const seen = new Set([mem[0]]);
  const stack = [mem[0]];
  while (stack.length) {
    const cur = stack.pop();
    for (const nb of ADJ[cur]) if (set.has(nb) && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
  }
  return seen.size === mem.length;
}
const allContiguous = (assign) => { for (let t = 0; t < K; t++) if (!contiguous(assign, t)) return false; return true; };

// ---------------------------------------------------------------------------
// Search: seeded region-growing, then hill-climb on boundary blocks.
// ---------------------------------------------------------------------------
function grow(rng) {
  const assign = new Array(N).fill(-1);
  const pinned = [];
  for (let t = 0; t < K; t++) {
    const pin = TECHS[t].pin;
    if (pin != null) { assign[pin] = t; pinned.push(pin); }
  }
  // seed the unpinned tech on a random block not adjacent to a pin, to give it room
  for (let t = 0; t < K; t++) {
    if (TECHS[t].pin != null) continue;
    const free = [];
    for (let i = 0; i < N; i++) if (assign[i] === -1) free.push(i);
    assign[free[Math.floor(rng() * free.length)]] = t;
  }
  // grow: repeatedly give the currently-lightest territory an adjacent free block
  let guard = 0;
  while (assign.includes(-1) && guard++ < 1000) {
    const hours = new Array(K).fill(0);
    for (let i = 0; i < N; i++) if (assign[i] >= 0) hours[assign[i]] += BLOCKS[i].hours;
    const order = [...Array(K).keys()].sort((a, b) => hours[a] - hours[b]);
    let placed = false;
    for (const t of order) {
      const cands = [];
      for (let i = 0; i < N; i++) {
        if (assign[i] !== -1) continue;
        for (const nb of ADJ[i]) if (assign[nb] === t) { cands.push(i); break; }
      }
      if (!cands.length) continue;
      assign[cands[Math.floor(rng() * cands.length)]] = t;
      placed = true;
      break;
    }
    if (!placed) { // stranded block: attach to any neighbouring territory
      for (let i = 0; i < N; i++) {
        if (assign[i] !== -1) continue;
        const nbs = [...ADJ[i]].filter(n => assign[n] >= 0);
        if (nbs.length) { assign[i] = assign[nbs[Math.floor(rng() * nbs.length)]]; placed = true; break; }
      }
      if (!placed) break;
    }
  }
  return assign;
}

function climb(assign, rng) {
  let cur = assign.slice();
  let best = score(cur);
  for (let it = 0; it < ITERS; it++) {
    // pick a boundary block (one with a neighbour in another territory) and flip it
    const i = Math.floor(rng() * N);
    if (TECHS[cur[i]].pin === i) continue;                 // never move a home block
    const others = [...ADJ[i]].map(n => cur[n]).filter(t => t !== cur[i]);
    if (!others.length) continue;
    const to = others[Math.floor(rng() * others.length)];
    const old = cur[i];
    cur[i] = to;
    if (!contiguous(cur, old) || !contiguous(cur, to)) { cur[i] = old; continue; }
    const s = score(cur);
    if (s.total <= best.total) best = s; else cur[i] = old;
  }
  return { assign: cur, s: best };
}

// deterministic RNG so a re-run reproduces the same map
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let champion = null;
for (let r = 0; r < RESTARTS; r++) {
  const rng = mulberry32(1000 + r);
  const seeded = grow(rng);
  if (!allContiguous(seeded)) continue;
  const { assign, s } = climb(seeded, rng);
  if (s.bad || !allContiguous(assign)) continue;
  if (!champion || s.total < champion.s.total) champion = { assign, s };
}
if (!champion) { console.error('no feasible partition found'); process.exit(1); }

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const { assign, s } = champion;
const out = { generated: new Date().toISOString().slice(0, 10), source: 'territories.json v8 regions', totalHours: Number(TOTAL.toFixed(1)), targetPerTech: Number(TARGET.toFixed(1)), territories: [] };

console.log(`\nFIVE-WAY CUT — ${TOTAL.toFixed(1)} h/wk over ${K} techs, target ${TARGET.toFixed(1)} h/wk each\n`);
const sorted = s.per.slice().sort((a, b) => b.hours - a.hours);
for (const p of sorted) {
  const dl = p.dayLoads;
  const dayStr = DAYS.map(d => `${d} ${dl[d].toFixed(1)}`).join('  ');
  const homeIn = p.tech.pin != null && p.members.includes(p.tech.pin);
  console.log(`${p.tech.name}  —  ${p.hours.toFixed(1)} h/wk   (${(p.hours - TARGET >= 0 ? '+' : '')}${(p.hours - TARGET).toFixed(1)} vs target)`);
  console.log(`  home: ${p.tech.home}${homeIn ? '  [starts in own territory]' : p.tech.pin == null ? '  [home unknown]' : '  [OUTSIDE own territory]'}`);
  console.log(`  days: ${dayStr}`);
  const rows = p.members.map(i => BLOCKS[i]).sort((a, b) => b.hours - a.hours);
  for (const b of rows) console.log(`    ${String(b.hours).padStart(5)}h  ${String(b.visits).padStart(5)}v  ${b.days.join('+').padEnd(8)} drv${String(b.driveMin).padStart(4)}  ${b.name}  [was ${b.terr} ${b.owner}]`);
  console.log('');
  out.territories.push({
    tech: p.tech.name, home: p.tech.home, hoursPerWeek: Number(p.hours.toFixed(1)),
    dayLoads: Object.fromEntries(DAYS.map(d => [d, Number(dl[d].toFixed(1))])),
    blocks: rows.map(b => ({ name: b.name, hoursPerWeek: b.hours, visitsPerWeek: b.visits, days: b.days, driveMinPerStop: b.driveMin, wasTerritory: b.terr, wasOwner: b.owner, zips: b.zips })),
  });
}

// churn: how many blocks change owner vs today
let moved = 0, movedHours = 0;
for (const p of s.per) for (const i of p.members) {
  if (BLOCKS[i].owner !== p.tech.name) { moved++; movedHours += BLOCKS[i].hours; }
}
out.churn = { blocksChangingOwner: moved, ofBlocks: N, hoursChangingOwner: Number(movedHours.toFixed(1)) };
console.log(`Churn: ${moved} of ${N} blocks change owner (${movedHours.toFixed(1)} h/wk of work). No block is split, so no customer changes weekday.`);
console.log(`Score: balance ${s.balance.toFixed(2)}  over-8h-days ${s.overDay.toFixed(2)}  dead days ${s.deadDays}`);

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nWrote ${OUT}`);
