#!/usr/bin/env node
// FIVE-WAY CUT, HIGHWAY VARIANT — the hand-drawn alternative to five-way-cut.mjs.
//
// Why (2026-08-12): the solver in five-way-cut.mjs optimises hours and contiguity, and it
// produced a balanced map whose territories cannot be described in a sentence — Tavis got a
// thin north-south strip running Sammamish -> Issaquah South -> Bellevue South -> Enumclaw ->
// Auburn, crossing I-90. Contiguous and well balanced, but a boundary nobody can hold in their
// head, and CLAUDE.local.md 2026-08-06 is explicit that territories are bounded by HIGHWAYS.
// A map Cory has to be handed in Phase 5 has to be sayable out loud.
//
// The structural fact that forces a new line: T1 (north of I-90) is 40.7 h/wk. Under an 8h/day
// target that is more than one tech can hold, so the fifth territory MUST come from splitting
// T1. The natural line is Lake Washington / I-405 — Seattle and Shoreline separate from the
// Eastside, and Seattle city then reunites across I-90 with West Seattle and Burien.
//
// The five lines:
//   1 EASTSIDE          north of I-90 and east of Lake Washington
//   2 SEATTLE + RENTON  Seattle city both sides of I-90, Mercer Island, Renton/Newcastle
//   3 SR-18 CORRIDOR    Kent South/Auburn, Maple Valley/Kent North, Enumclaw, Issaquah South
//   4 SR-410 COUNTRY    Buckley/Bonney Lake/Sumner, Puyallup, Graham/Orting/Eatonville
//   5 I-705 WEST+SOUTH  Tacoma, Peninsula, Thurston, Lakewood, Federal Way  (v8's T4, intact)
//
// READ-ONLY. Emits the same schema as five-way-cut.json so day-tile.mjs can consume either.
//
// Usage: node five-way-highway.mjs [--json=out.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const TERR = path.join(REPO, 'projects/briefs/technician-route-automation/territories.json');
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const OUT = flag('json', path.join(__dirname, '../data/five-way-highway.json'));

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const terr = JSON.parse(fs.readFileSync(TERR, 'utf8'));

const pick = (frag) => {
  const hits = Object.entries(terr.regions).filter(([n]) => n.toLowerCase().includes(frag.toLowerCase()));
  if (hits.length !== 1) throw new Error(`"${frag}" matched ${hits.length} regions`);
  const [name, r] = hits[0];
  const rhythm = String(r.rhythm || '').toLowerCase();
  const days = DAYS.filter(d => rhythm.includes(d));
  return {
    name, hoursPerWeek: Number(r.hoursPerWeek) || 0, visitsPerWeek: Number(r.visitsPerWeek) || 0,
    days: days.length ? days : ['mon'], driveMinPerStop: Number(r.driveMinPerStop) || 0,
    wasTerritory: (r.territory || '').split(' ')[0], wasOwner: r.owner, zips: r.zips || [],
  };
};

const MAP = [
  {
    tech: 'Alias Franks', home: 'Snohomish 98296',
    line: 'EASTSIDE — north of I-90, east of Lake Washington',
    blocks: ['Points', 'Redmond', 'Snoqualmie', 'Sammamish'],
  },
  {
    tech: 'Tavis Alexander', home: 'UNKNOWN',
    line: 'SEATTLE + RENTON — Seattle city both sides of I-90, Mercer Island, Renton/Newcastle',
    blocks: ['North Seattle', 'West Seattle', 'Tukwila', 'Bellevue South', 'Renton'],
  },
  {
    tech: 'Robert Norton', home: 'Maple Valley 98038',
    line: 'SR-18 CORRIDOR — Kent, Auburn, Maple Valley, Enumclaw, Issaquah South',
    blocks: ['North of SR-516', 'South of SR-516', 'Enumclaw', 'Issaquah South'],
  },
  {
    tech: 'Cory Ventura', home: 'Buckley 98321',
    line: 'SR-410 COUNTRY — Buckley/Bonney Lake/Sumner, Puyallup, Graham/Orting/Eatonville',
    blocks: ['Buckley', 'Puyallup', 'Graham'],
  },
  {
    tech: 'Luke LaVergne', home: 'Puyallup 98373',
    line: 'I-705 WEST AND SOUTH — Tacoma, Peninsula, Thurston, Lakewood, Federal Way (v8 T4 intact)',
    blocks: ['Tacoma', 'Peninsula', 'Thurston North', 'Thurston South', 'Lakewood', 'Federal Way'],
  },
];

const out = { generated: new Date().toISOString().slice(0, 10), variant: 'highway (hand-drawn)', source: 'territories.json v8 regions', territories: [] };
let total = 0, moved = 0, movedHours = 0, nBlocks = 0;

for (const t of MAP) {
  const blocks = t.blocks.map(pick).sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);
  const h = blocks.reduce((s, b) => s + b.hoursPerWeek, 0);
  const v = blocks.reduce((s, b) => s + b.visitsPerWeek, 0);
  total += h; nBlocks += blocks.length;
  for (const b of blocks) if (b.wasOwner !== t.tech) { moved++; movedHours += b.hoursPerWeek; }
  const dayH = Object.fromEntries(DAYS.map(d => [d, 0]));
  for (const b of blocks) { const per = b.hoursPerWeek / b.days.length; for (const d of b.days) dayH[d] += per; }
  out.territories.push({ tech: t.tech, home: t.home, line: t.line, hoursPerWeek: Number(h.toFixed(1)), visitsPerWeek: Number(v.toFixed(1)), blocks });

  console.log(`\n${t.tech}  —  ${h.toFixed(1)} h/wk   ${v.toFixed(1)} visits/wk`);
  console.log(`  ${t.line}`);
  console.log(`  home: ${t.home}${blocks.some(b => b.zips.includes((t.home.match(/\d{5}/) || [''])[0])) ? '  [starts in own territory]' : t.home === 'UNKNOWN' ? '  [home unknown]' : '  [outside own territory]'}`);
  console.log(`  as-is days: ${DAYS.map(d => `${d} ${dayH[d].toFixed(1)}`).join('  ')}`);
  for (const b of blocks) console.log(`    ${String(b.hoursPerWeek).padStart(5)}h  ${String(b.visitsPerWeek).padStart(5)}v  ${b.days.join('+').padEnd(8)} drv${String(b.driveMinPerStop).padStart(4)}  ${b.name}  [was ${b.wasTerritory} ${b.wasOwner}]`);
}

out.totalHours = Number(total.toFixed(1));
out.targetPerTech = Number((total / 5).toFixed(1));
out.churn = { blocksChangingOwner: moved, ofBlocks: nBlocks, hoursChangingOwner: Number(movedHours.toFixed(1)) };
console.log(`\nTOTAL ${total.toFixed(1)} h/wk over 5 techs — target ${(total / 5).toFixed(1)}`);
console.log(`Churn: ${moved} of ${nBlocks} blocks change owner (${movedHours.toFixed(1)} h/wk).`);
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Wrote ${OUT}`);
