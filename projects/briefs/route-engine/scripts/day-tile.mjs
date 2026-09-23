#!/usr/bin/env node
// DAY TILE — second pass on the five-way cut: spread each territory's blocks across
// Mon-Fri so no route-day is dead and none runs past the 8h target.
//
// Why this is a separate pass (2026-08-12): territories.json v8 was built so each tech's
// blocks tile the week exactly one per weekday. Re-dealing 22 blocks into 5 territories
// breaks that tiling — the ownership search left every tech one empty weekday and two days
// over 9h. Fixing it means some blocks change weekday, which moves real customers off the
// day they are used to. That cost is COUNTED here, never hidden: the report states how many
// visits/week change weekday, so Spencer decides whether the balance is worth it.
//
// A block may be spread over 2 weekdays (its zips split between them). Blocks over 8h MUST
// be, since a single route-day cannot hold them under the 8h target.
//
// READ-ONLY. Consumes data/five-way-cut.json. Touches no live system.
//
// Usage: node day-tile.mjs [--churn-weight=0.06] [--json=out.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const IN = flag('in', path.join(__dirname, '../data/five-way-cut.json'));
const CHURN_W = Number(flag('churn-weight', 0.06));
const OUT = flag('json', path.join(__dirname, '../data/five-way-day-plan.json'));

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const cut = JSON.parse(fs.readFileSync(IN, 'utf8'));

// every 1- and 2-day combination a block could run on
const OPTIONS = [];
for (let i = 0; i < 5; i++) OPTIONS.push([DAYS[i]]);
for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) OPTIONS.push([DAYS[i], DAYS[j]]);

// visits/week that land on a different weekday than they do today
function churnOf(block, chosen) {
  const orig = block.days;
  const perNew = block.visitsPerWeek / chosen.length;
  let moved = 0;
  for (const d of chosen) if (!orig.includes(d)) moved += perNew;
  return moved;
}

function planTerritory(t) {
  const blocks = t.blocks;
  const best = { cost: Infinity };
  const chosen = new Array(blocks.length);

  const recurse = (bi, dayHours) => {
    if (bi === blocks.length) {
      let over = 0, dead = 0, spread = 0;
      const mean = t.hoursPerWeek / 5;
      for (const d of DAYS) {
        const h = dayHours[d];
        if (h > 8) over += (h - 8) ** 2;
        if (h < 0.5) dead += 1;
        spread += (h - mean) ** 2;
      }
      let churn = 0;
      for (let i = 0; i < blocks.length; i++) churn += churnOf(blocks[i], chosen[i]);
      const cost = over * 4 + dead * 25 + spread * 1 + churn * CHURN_W;
      if (cost < best.cost) {
        best.cost = cost;
        best.assign = chosen.slice();
        best.dayHours = { ...dayHours };
        best.churnVisits = churn;
        best.over = over; best.dead = dead;
      }
      return;
    }
    const b = blocks[bi];
    for (const opt of OPTIONS) {
      if (b.hoursPerWeek > 8 && opt.length < 2) continue;   // cannot fit one route-day
      const per = b.hoursPerWeek / opt.length;
      if (per > 8) continue;
      for (const d of opt) dayHours[d] += per;
      chosen[bi] = opt;
      recurse(bi + 1, dayHours);
      for (const d of opt) dayHours[d] -= per;
    }
  };
  recurse(0, Object.fromEntries(DAYS.map(d => [d, 0])));
  return best;
}

const out = { generated: new Date().toISOString().slice(0, 10), churnWeight: CHURN_W, territories: [] };
let totalChurn = 0, totalVisits = 0, worstDay = 0;

console.log(`\nDAY TILE — five-way cut, ${cut.totalHours} h/wk, target ${(cut.totalHours / 25).toFixed(1)} h per route-day\n`);

for (const t of cut.territories) {
  const p = planTerritory(t);
  const dayStr = DAYS.map(d => `${d} ${p.dayHours[d].toFixed(1)}`).join('  ');
  const tv = t.blocks.reduce((s, b) => s + b.visitsPerWeek, 0);
  totalChurn += p.churnVisits; totalVisits += tv;
  worstDay = Math.max(worstDay, ...DAYS.map(d => p.dayHours[d]));

  console.log(`${t.tech}  —  ${t.hoursPerWeek} h/wk`);
  console.log(`  ${dayStr}`);
  console.log(`  weekday changes: ${p.churnVisits.toFixed(1)} of ${tv.toFixed(1)} visits/wk (${(100 * p.churnVisits / tv).toFixed(0)}%)`);
  const rows = [];
  for (let i = 0; i < t.blocks.length; i++) {
    const b = t.blocks[i], now = p.assign[i];
    const same = now.join('+') === b.days.join('+');
    console.log(`    ${b.days.join('+').padEnd(8)} -> ${now.join('+').padEnd(8)} ${same ? '   ' : '<--'} ${String(b.hoursPerWeek).padStart(5)}h  ${b.name}`);
    rows.push({ block: b.name, wasDays: b.days, nowDays: now, hoursPerWeek: b.hoursPerWeek, visitsPerWeek: b.visitsPerWeek, changed: !same, visitsMovingWeekday: Number(churnOf(b, now).toFixed(1)), zips: b.zips });
  }
  console.log('');
  out.territories.push({
    tech: t.tech, home: t.home, hoursPerWeek: t.hoursPerWeek,
    dayHours: Object.fromEntries(DAYS.map(d => [d, Number(p.dayHours[d].toFixed(1))])),
    visitsPerWeek: Number(tv.toFixed(1)),
    visitsChangingWeekday: Number(p.churnVisits.toFixed(1)),
    blocks: rows,
  });
}

out.summary = {
  visitsPerWeek: Number(totalVisits.toFixed(1)),
  visitsChangingWeekday: Number(totalChurn.toFixed(1)),
  pctChangingWeekday: Number((100 * totalChurn / totalVisits).toFixed(1)),
  worstRouteDayHours: Number(worstDay.toFixed(1)),
  deadRouteDays: out.territories.reduce((s, t) => s + DAYS.filter(d => t.dayHours[d] < 0.5).length, 0),
};
console.log(`TOTAL weekday changes: ${totalChurn.toFixed(1)} of ${totalVisits.toFixed(1)} visits/wk (${out.summary.pctChangingWeekday}%)`);
console.log(`Worst route-day: ${worstDay.toFixed(1)}h    Dead route-days: ${out.summary.deadRouteDays}`);
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nWrote ${OUT}`);
