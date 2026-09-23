#!/usr/bin/env node
/**
 * edge-shift.mjs — READ-ONLY. LAYER 2 of the proposal for 2026-09-21..2026-09-25.
 *
 * Spencer's objective, in his words: "super dense routes; when one technician is too overloaded we
 * shift jobs to the CLOSEST technician to those jobs and shift the territories as necessary; no
 * criss-crossing; technician-owned territories."
 *
 * Layer 1 (level-week.mjs) moves visits between weekdays inside one technician. Layer 2 sits on top
 * of it and moves whole EDGE BLOCKS of customers from an overloaded technician to the neighbour
 * whose work is already closest to them, then re-levels both technicians' weeks.
 *
 *   1. Weekly load per tech after layer 1. Overloaded = any day over 9.0 h, or the week over 42 h.
 *   2. Edge score per customer of an overloaded tech:
 *        (km to the nearest stop on a NEIGHBOUR tech's week) - (km to his own nearest other stop)
 *      Negative means the customer is closer to somebody else's work than to his own. A house in
 *      the interior scores strongly positive and is therefore never picked up.
 *      Neighbour = any tech whose stops come within 6 km of this tech's stops.
 *   3. Edge customers are clustered by proximity (single linkage, 1.5 km) and moved as whole
 *      blocks, never a lone house lifted out of the middle of a run. Islands go first.
 *   4. Blocks are handed over until the overloaded tech's days are all under 9.0 h, and only while
 *      the receiving tech's days stay under 9.0 h. Both techs then re-level their days.
 *
 * Nothing is written anywhere. Output: leveled-plan-2.json, leveled-plan-2.md, leveled-map.html.
 * Applying it is apply-leveled-plan.mjs --with-edge-shift, which is dry by default and gated.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  SWAP, REDESIGN, DATES, DOW, LABEL, CAP_H, WEEK_SOFT_H, dayIdx, round,
  HOME, ONSITE, cyc, cycleFor, haversineKm, medoid,
  metrics, effHours, summarize, toStop, buildBoard, applyWindows, levelTech, boardFor,
  insertionCost, removalSaving, nearestKm, weekHours, overtimeH, kmTotal,
} from './week-model.mjs';
import { renderMap } from './map-render.mjs';

const LOG = path.join(SWAP, 'edge-shift.log');
fs.writeFileSync(LOG, '');
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n'); };
const NAME = t => String(t).trim();

// Layer 1 workdays: Spencer Mon-Thu, nothing onto his Friday.
const WD1 = {
  'Alias Franks': DATES.slice(), 'Cory Ventura': DATES.slice(), 'Luke LaVergne': DATES.slice(),
  'Robert Norton': DATES.slice(), 'Spencer Hill': DATES.slice(0, 4), 'Tavis Alexander': [],
};
// Layer 2 workdays: Spencer's Friday OPENS as a receiving day. He holds one stop that day and
// starts in Enumclaw, which puts him on the doorstep of Luke's Pierce ground on the one day Luke
// has no relief anywhere else.
const WD2 = { ...WD1, 'Spencer Hill': DATES.slice() };
const wd1 = t => WD1[t] || [];
const wd2 = t => WD2[t] || [];
const FROZEN = new Set(['Tavis Alexander', 'Courtney ', 'Courtney']);

const NEIGHBOUR_KM = 6;        // a tech is a neighbour if its stops come this close
const CLUSTER_KM = 1.5;        // single-linkage block radius
// A customer is an edge customer when a neighbour's work is comparably close to it — not only when
// the neighbour is strictly closer. In dense ground like Bellevue a tech's own next stop is often
// 300 m away, so a strict test finds no edge at all and the whole layer jams. 1.5 km still excludes
// the deep interior, where the neighbour is kilometres off.
const EDGE_MAX = 1.5;          // km: neighbour's nearest stop minus own tech's nearest other stop
const LONE_HOUSE_EDGE = -0.5;  // a one-house block must be at least this far onto the neighbour's side
// A handover that clears overtime is allowed to cost some extra driving, priced against what it
// buys: up to 10 km per hour of overtime cleared, and never more than 15 km whatever it buys. An
// hour of a technician's time is worth far more than ten kilometres of fuel, but a 50 km detour is
// the criss-crossing Spencer is trying to get rid of, so it is refused however much it relieves.
const RELIEF_KM_PER_HOUR = 10.0;
const RELIEF_KM_HARD_FLOOR = -15.0;
const reliefKmOk = c => c.kmSaved >= Math.max(RELIEF_KM_HARD_FLOOR, -RELIEF_KM_PER_HOUR * c.reliefH);
const ROOM_KM_FLOOR = 0.5;     // a handover made only to free room must save driving on its own

// Settled ground, for the lone-house test. A single customer may cross on its own only if it is
// standing in the receiving tech's own settled postcode — a real island — or it is at least
// LONE_HOUSE_EDGE km deeper into the neighbour's side than its own tech's nearest other stop.
const territory = JSON.parse(fs.readFileSync(path.join(REDESIGN, 'data', 'territory-asbuilt.json'), 'utf8'));
const zipOwner = new Map(territory.zips.filter(z => z.techShare >= 0.8).map(z => [String(z.zip), z.dominantTech]));
const SWAP_OWNER = { 'Tavis Alexander': 'Cory Ventura', 'Cory Ventura': 'Spencer Hill' };
const settledOwner = (zip, day) => {
  const base = zipOwner.get(String(zip));
  if (!base) return null;
  return day !== DATES[4] && SWAP_OWNER[base] ? SWAP_OWNER[base] : base;
};

log(`=== EDGE SHIFT (layer 2) ${new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' })} PT ===`);

// ---------------------------------------------------------------- stage 0 + stage 1
const { week, items, dupRows } = buildBoard(wd1);
const techs0 = [...new Set(items.map(i => i.tech))].sort();
log(`${items.length} visits (${dupRows.length} duplicate row dropped), ${techs0.length} names on the board`);

const stage0 = {};
for (const t of techs0) stage0[t] = boardFor(items.filter(i => i.tech === t), t, null);

log(`\n--- layer 1: levelling each tech's own week ---`);
const place1 = new Map(items.map(i => [i.key, i.from]));
for (const t of techs0) {
  if (!wd1(t).length || !HOME[t]) continue;
  const mine = items.filter(i => i.tech === t);
  const r = levelTech({ mine, tech: t, workdays: wd1(t) });
  for (const [k, d] of r.place) place1.set(k, d);
  log(`  ${NAME(t).padEnd(16)} ${wd1(t).map(d => effHours(metrics(mine.filter(i => r.place.get(i.key) === d).map(toStop), t, true), t, d).toFixed(1)).join(' ')}`);
}
const stage1 = {};
for (const t of techs0) stage1[t] = boardFor(items.filter(i => i.tech === t), t, place1);

// ---------------------------------------------------------------- who is overloaded
function loadOf(board, tech, days) {
  const dayH = Object.fromEntries(days.map(d => [d, effHours(board[d], tech, d)]));
  return { dayH, weekH: Object.values(dayH).reduce((a, b) => a + b, 0), maxH: Math.max(0, ...Object.values(dayH)) };
}
const load1 = {};
for (const t of techs0) load1[t] = loadOf(stage1[t], t, wd1(t).length ? wd1(t) : DATES);
log(`\n--- load after layer 1 ---`);
for (const t of techs0) log(`  ${NAME(t).padEnd(16)} week ${load1[t].weekH.toFixed(1)} h   heaviest day ${load1[t].maxH.toFixed(1)} h   ${load1[t].maxH > CAP_H ? 'DAY OVER' : ''}${load1[t].weekH > WEEK_SOFT_H ? ' WEEK OVER 42' : ''}`);

const donors = techs0.filter(t => !FROZEN.has(t) && HOME[t] && wd1(t).length && load1[t].maxH > CAP_H);
const weekOnly = techs0.filter(t => !donors.includes(t) && !FROZEN.has(t) && HOME[t] && load1[t].weekH > WEEK_SOFT_H);
log(`\ndonors (a day over ${CAP_H} h): ${donors.map(NAME).join(', ') || 'none'}`);
log(`over 42 h for the week but no day over the cap: ${weekOnly.map(NAME).join(', ') || 'none'}`);

// ---------------------------------------------------------------- layer 2 state
// assign: key -> { tech, day }. Starts as layer 1 and is mutated by the transfer loop.
const assign = new Map(items.map(i => [i.key, { tech: i.tech, day: place1.get(i.key) }]));
const stopsOf = (tech, day) => items.filter(i => { const a = assign.get(i.key); return a.tech === tech && a.day === day; });
const techStops = tech => items.filter(i => assign.get(i.key).tech === tech);
const boardCache = new Map();
// Nearest-neighbour ordering during the search: the block loop trial-applies and reverts hundreds
// of candidates, and a full 2-opt on every one of them is far too slow. Every candidate is scored
// the same way, so the comparison holds; stage 2 is re-sequenced properly at the end.
const bOf = (tech, day) => { const k = `${tech}|${day}`; let v = boardCache.get(k); if (v === undefined) { v = metrics(stopsOf(tech, day).map(toStop), tech, false); boardCache.set(k, v); } return v; };
const bust = (tech, day) => boardCache.delete(`${tech}|${day}`);
const hOf = (tech, day) => effHours(bOf(tech, day), tech, day);
const jobDay = new Map();
for (const i of items) { const a = assign.get(i.key); const k = `${i.job}|${a.day}`; jobDay.set(k, (jobDay.get(k) || 0) + 1); }

// ---------------------------------------------------------------- neighbours and edge scores
function neighboursOf(tech) {
  const mine = techStops(tech);
  const out = [];
  for (const other of techs0) {
    if (other === tech || FROZEN.has(other) || !HOME[other] || !wd2(other).length) continue;
    const theirs = techStops(other);
    if (!theirs.length) continue;
    let min = Infinity;
    for (const a of mine) { const n = nearestKm(a, theirs); if (n.km < min) min = n.km; }
    if (min <= NEIGHBOUR_KM) out.push({ tech: other, minKm: round(min) });
  }
  return out.sort((a, b) => a.minKm - b.minKm);
}

function edgeScores(tech, neigh) {
  const mine = techStops(tech);
  const pools = new Map(neigh.map(n => [n.tech, techStops(n.tech)]));
  return mine.map(it => {
    const own = mine.filter(x => x.key !== it.key);
    const ownKm = own.length ? nearestKm(it, own).km : Infinity;
    let bestT = null, bestKm = Infinity;
    for (const [t, pool] of pools) { const n = nearestKm(it, pool); if (n.km < bestKm) { bestKm = n.km; bestT = t; } }
    return { it, ownKm: round(ownKm), nearTech: bestT, nearKm: round(bestKm), score: round(bestKm - ownKm) };
  }).sort((a, b) => a.score - b.score);
}

/** Single-linkage clustering at CLUSTER_KM over a set of scored customers. */
function clusterEdge(rows) {
  const n = rows.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (haversineKm(rows[i].it, rows[j].it) <= CLUSTER_KM) { const a = find(i), b = find(j); if (a !== b) parent[a] = b; }
  }
  const groups = new Map();
  rows.forEach((r, i) => { const k = find(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  return [...groups.values()];
}

// ---------------------------------------------------------------- transferring a block
/** Best (tech, day) for one visit on the receiving tech: cheapest insertion that stays legal. */
function bestSlot(it, toTech) {
  const days = wd2(toTech);
  let best = null;
  for (const d of days) {
    if (it.datePinned && d !== assign.get(it.key).day) continue;
    if (!it.datePinned && it.window?.from && !it.overdue && (d < it.window.from || d > it.window.to)) continue;
    if ((jobDay.get(`${it.job}|${d}`) || 0) > 0 && assign.get(it.key).day !== d) continue;
    const b = bOf(toTech, d);
    const ins = insertionCost(b.order, toTech, it);
    if (!ins) continue;
    const svc = ONSITE[toTech] ?? cyc.globalOnSiteMinPerStop;
    const newH = effHours({ ...b, stops: b.stops + 1, routeH: b.routeH + (ins.seconds / 60 + svc) / 60 }, toTech, d);
    if (newH > CAP_H) continue;
    if (!best || ins.seconds < best.ins.seconds) best = { day: d, ins, newH, svc };
  }
  return best;
}

function moveVisit(it, toTech, toDay) {
  const a = assign.get(it.key);
  jobDay.set(`${it.job}|${a.day}`, (jobDay.get(`${it.job}|${a.day}`) || 1) - 1);
  bust(a.tech, a.day);
  a.tech = toTech; a.day = toDay;
  it.tech = toTech;
  it.serviceMin = ONSITE[toTech] ?? cyc.globalOnSiteMinPerStop;
  jobDay.set(`${it.job}|${toDay}`, (jobDay.get(`${it.job}|${toDay}`) || 0) + 1);
  bust(toTech, toDay);
}


// Block names carry the street as well as the city and postcode, because "Bonney Lake 98391" three
// times over tells Spencer nothing about which three groups of houses they are.
const streetOf = it => String(it.address || '').split(',')[0].replace(/^\s*[\d-]+\s*/, '').replace(/\s+(apt|unit|ste|#).*$/i, '').trim();
function blockName(group) {
  const cities = [...new Set(group.map(r => r.it.city).filter(Boolean))];
  const zips = [...new Set(group.map(r => r.it.zip).filter(Boolean))];
  const counts = {};
  for (const r of group) { const st = streetOf(r.it); if (st) counts[st] = (counts[st] || 0) + 1; }
  const streets = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s);
  const head = `${cities.slice(0, 2).join(' / ') || 'unknown'} ${zips.slice(0, 2).join('/')}`.trim();
  return streets.length ? `${head} — ${streets.join(', ')}` : head;
}

const blocks = [];
/**
 * How overloaded a tech is. Two parts, because they fail differently.
 *   structural — the week itself is bigger than the days can hold. Moving ANY customer off helps,
 *                whichever day he sits on. This is Alias and Luke's problem.
 *   shape      — individual days over the cap. Layer 1 already flattened these, and the re-level
 *                after each handover flattens them again, so it carries half weight.
 * Measuring only the shape made the search reject every block whose customers happened to sit on a
 * light day, which is most of them once layer 1 has done its work.
 */
const dayOverOf = tech => wd2(tech).reduce((s, d) => { const h = hOf(tech, d); return s + (h > CAP_H ? h - CAP_H : 0); }, 0);
const structuralOf = tech => Math.max(0, wd2(tech).reduce((s, d) => s + hOf(tech, d), 0) - wd2(tech).length * CAP_H);
const excessOf = tech => structuralOf(tech) + 0.5 * dayOverOf(tech);
const kmOf = tech => DATES.reduce((s, d) => s + bOf(tech, d).km, 0);

/**
 * Trial-applies one block to one receiving tech, measures it, and reverts. Returns null when the
 * block cannot legally land. Nothing is committed: the caller compares every candidate and commits
 * the best one with commitBlock.
 */
function evaluateBlock(fromTech, group, toTech, why) {
  if (!toTech || toTech === fromTech || !HOME[toTech] || !wd2(toTech).length) return null;
  const snapshot = group.map(r => ({ it: r.it, tech: assign.get(r.it.key).tech, day: assign.get(r.it.key).day, svc: r.it.serviceMin }));
  const revert = () => { for (const s of snapshot) { if (assign.get(s.it.key).tech !== s.tech || assign.get(s.it.key).day !== s.day) moveVisit(s.it, s.tech, s.day); s.it.serviceMin = s.svc; } };

  const kmBefore = kmOf(fromTech) + kmOf(toTech);
  const exFromBefore = excessOf(fromTech), exToBefore = excessOf(toTech);
  const placements = [];
  for (const r of group) {
    const slot = bestSlot(r.it, toTech);
    if (!slot) { if (why) why.noSlot++; revert(); return null; }
    moveVisit(r.it, toTech, slot.day);
    placements.push({ it: r.it, day: slot.day });
  }
  if (wd2(toTech).some(d => hOf(toTech, d) > CAP_H)) { if (why) why.receiverOverCap++; revert(); return null; }
  const kmAfter = kmOf(fromTech) + kmOf(toTech);
  const exFromAfter = excessOf(fromTech), exToAfter = excessOf(toTech);
  const days = [...new Set(placements.map(p => p.day))].sort();
  revert();

  return {
    fromTech, toTech, group, days,
    customers: group.length,
    kmSaved: round(kmBefore - kmAfter),
    reliefH: round((exFromBefore - exFromAfter) + (exToBefore - exToAfter)),
    meanEdgeScoreKm: round(group.reduce((s, r) => s + r.score, 0) / group.length),
    placements: placements.map(p => ({ key: p.it.key, day: p.day })),
  };
}

function commitBlock(cand, reasonTag) {
  for (const p of cand.placements) {
    const it = cand.group.find(r => r.it.key === p.key).it;
    moveVisit(it, cand.toTech, p.day);
  }
  const cities = [...new Set(cand.group.map(r => r.it.city).filter(Boolean))];
  const zips = [...new Set(cand.group.map(r => r.it.zip).filter(Boolean))];
  const c = medoid(cand.group.map(r => r.it));
  const blk = {
    name: blockName(cand.group),
    fromTech: cand.fromTech, toTech: cand.toTech, customers: cand.customers, reason: reasonTag,
    cities, zips, centroid: c ? { lat: round(c.lat), lng: round(c.lng) } : null,
    meanEdgeScoreKm: cand.meanEdgeScoreKm, kmSaved: cand.kmSaved, reliefHours: cand.reliefH, islandShare: cand.islandShare ?? null,
    days: cand.days,
    visits: cand.placements.map(p => { const it = cand.group.find(r => r.it.key === p.key).it; return { visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, zip: it.zip, day: p.day, fromDay: it.from }; }),
  };
  blocks.push(blk);
  // Re-level both technicians straight away, with a short search. Without this the donor's relief
  // stays hidden in one heavy day and the next round cannot see that the handover helped.
  for (const t of [cand.fromTech, cand.toTech]) {
    const mine = techStops(t);
    if (!mine.length || !wd2(t).length) continue;
    const start = new Map(mine.map(i => [i.key, assign.get(i.key).day]));
    const r = levelTech({ mine, tech: t, workdays: wd2(t), startPlace: start, maxPasses: 3, budgetMs: 45000 });
    for (const [k, d] of r.place) { const a = assign.get(k); if (a.day !== d) { bust(a.tech, a.day); a.day = d; bust(a.tech, d); } }
  }
  log(`  MOVE  ${blk.name} — ${blk.customers} customer${blk.customers > 1 ? 's' : ''}, ${NAME(blk.fromTech)} -> ${NAME(blk.toTech)}, ${blk.kmSaved} km saved, ${blk.reliefHours} h of overtime cleared, lands ${blk.days.map(d => DOW[d]).join('/')}`);
  return blk;
}

/** Every legal candidate block out of one tech, already costed. */
const lastWhy = {};
function candidatesFrom(fromTech) {
  const why = lastWhy[fromTech] = { edgeCustomers: 0, clusters: 0, loneHouseSkipped: 0, noSlot: 0, receiverOverCap: 0, legal: 0 };
  const neigh = neighboursOf(fromTech);
  if (!neigh.length) return [];
  const scored = edgeScores(fromTech, neigh).filter(r => r.score <= EDGE_MAX && !r.it.isComplete);
  why.edgeCustomers = scored.length;
  if (!scored.length) return [];
  const out = [];
  for (const g of clusterEdge(scored)) {
    why.clusters++;
    // A one-house block only crosses if it is a real island in the receiver's settled postcode, or
    // it stands well onto the neighbour's side. That is what stops a house being lifted out of the
    // middle of a run.
    if (g.length === 1) {
      const r = g[0];
      const owner = settledOwner(r.it.zip, assign.get(r.it.key).day);
      const island = owner && owner !== fromTech;
      if (!island && r.score > LONE_HOUSE_EDGE) { why.loneHouseSkipped++; continue; }
    }
    for (const n of neigh) {
      const c = evaluateBlock(fromTech, g, n.tech, why);
      if (c) { out.push(c); why.legal++; }
    }
  }
  return out;
}

// ---------------------------------------------------------------- the transfer loop
// Fleet-wide greedy. Each round takes the technician carrying the most overtime and looks for the
// best block he can hand to a neighbour. If nothing of his can move because the neighbour is full,
// the round instead tries to MAKE ROOM by shifting one of that neighbour's own edge blocks on to a
// third technician — but only when that second move saves driving in its own right. That is what
// lets the territory line shift twice in one week rather than jamming at the first full neighbour.
log(`\n--- layer 2: edge blocks ---`);
for (const t of techs0) if (!FROZEN.has(t) && HOME[t] && wd2(t).length) {
  const n = neighboursOf(t);
  log(`  ${NAME(t).padEnd(16)} neighbours within ${NEIGHBOUR_KM} km: ${n.map(x => `${NAME(x.tech)} ${x.minKm} km`).join(', ') || 'none'}`);
}
log(``);
const stuck = new Set();
const stuckDetail = {};
for (let round_ = 0; round_ < 80; round_++) {
  const pool = techs0.filter(t => !FROZEN.has(t) && HOME[t] && wd2(t).length && !stuck.has(t) && excessOf(t) > 0.01);
  if (!pool.length) break;
  pool.sort((a, b) => excessOf(b) - excessOf(a));
  const donor = pool[0];

  // relief handovers: clear the donor's overtime, allowed to cost a little extra driving
  const all = candidatesFrom(donor);
  const cands = all.filter(c => c.reliefH > 0.01 && reliefKmOk(c));
  // Islands first: a block already standing in the receiving tech's own settled postcode is the
  // least disruptive thing to hand over, so it goes before an ordinary edge block of equal value.
  const islandShare = c => c.group.filter(r => settledOwner(r.it.zip, assign.get(r.it.key).day) === c.toTech).length / c.group.length;
  for (const c of cands) c.islandShare = round(islandShare(c));
  cands.sort((a, b) => (b.islandShare - a.islandShare) || ((b.reliefH * 20 + b.kmSaved) - (a.reliefH * 20 + a.kmSaved)));
  if (cands.length) { commitBlock(cands[0], `${NAME(donor)} is over what his week can hold`); continue; }

  // Nothing of his can move, which normally means the neighbour is full. Free room on the
  // neighbour by shifting the neighbour's OWN edge blocks to a third tech, and keep doing it until
  // the donor has somewhere to go. This is the chain that lets a territory line shift twice.
  let freed = 0;
  for (let inner = 0; inner < 8; inner++) {
    let best = null;
    for (const n of neighboursOf(donor)) {
      for (const c of candidatesFrom(n.tech)) {
        if (c.toTech === donor) continue;
        if (c.kmSaved < ROOM_KM_FLOOR) continue;
        if (!best || c.kmSaved > best.kmSaved) best = c;
      }
    }
    if (!best) break;
    commitBlock(best, excessOf(best.fromTech) > 0.01
      ? `to free room on ${NAME(best.fromTech)} for ${NAME(donor)}`
      : `${NAME(best.fromTech)} was crossing ${NAME(best.toTech)}'s ground here — ${best.kmSaved} km of pointless driving`);
    freed++;
    const retry = candidatesFrom(donor).filter(c => c.reliefH > 0.01 && reliefKmOk(c));
    if (retry.length) break;
  }
  if (freed) {
    const retry = candidatesFrom(donor).filter(c => c.reliefH > 0.01 && reliefKmOk(c));
    if (retry.length) continue;
  }

  // Genuinely stuck. Record why, with the best rejected candidates, so the reason is inspectable
  // rather than a shrug.
  stuck.add(donor);
  const fresh = candidatesFrom(donor);
  const near = fresh.slice().sort((a, b) => b.reliefH - a.reliefH || b.kmSaved - a.kmSaved).slice(0, 5)
    .map(c => ({ to: c.toTech, customers: c.customers, cities: [...new Set(c.group.map(r => r.it.city))].slice(0, 3), kmSaved: c.kmSaved, reliefH: c.reliefH, rejectedFor: c.reliefH <= 0.01 ? 'clears no overtime' : `costs ${Math.abs(c.kmSaved)} km of extra driving for ${c.reliefH} h` }));
  const neighRoom = neighboursOf(donor).map(n => ({ tech: n.tech, minKm: n.minKm, roomH: round(wd2(n.tech).reduce((s, d) => s + Math.max(0, CAP_H - hOf(n.tech, d)), 0)) }));
  stuckDetail[donor] = { excessHours: round(excessOf(donor)), legalBlocksFound: fresh.length, search: lastWhy[donor], neighbours: neighRoom, bestRejected: near };
  log(`        search: ${JSON.stringify(lastWhy[donor])}`);
  log(`  STUCK ${NAME(donor)} — ${round(excessOf(donor))} h of overtime left. ${fresh.length} legal blocks existed; the best were rejected: ${near.map(c => `${c.cities.join('/')} to ${NAME(c.to)} (${c.rejectedFor})`).join('; ') || 'none legal at all'}`);
  log(`        neighbour room: ${neighRoom.map(n => `${NAME(n.tech)} ${n.roomH} h`).join(', ') || 'no neighbours'}`);
}
for (const t of techs0) if (!FROZEN.has(t) && HOME[t] && wd2(t).length) log(`  ${NAME(t).padEnd(16)} ${wd2(t).map(d => hOf(t, d).toFixed(1)).join(' ')}`);

// ---------------------------------------------------------------- re-level everyone touched
const touched = [...new Set(blocks.flatMap(b => [b.fromTech, b.toTech]))];
log(`\n--- re-levelling after the handovers: ${touched.map(NAME).join(', ') || 'nothing to re-level'} ---`);
applyWindows(items, wd2);                      // windows follow the tech's workdays, which may have changed
for (const t of touched) {
  const mine = techStops(t);
  const start = new Map(mine.map(i => [i.key, assign.get(i.key).day]));
  const r = levelTech({ mine, tech: t, workdays: wd2(t), startPlace: start });
  for (const [k, d] of r.place) { const a = assign.get(k); if (a.day !== d) { bust(a.tech, a.day); a.day = d; bust(a.tech, d); } }
  log(`  ${NAME(t).padEnd(16)} ${wd2(t).map(d => hOf(t, d).toFixed(1)).join(' ')}`);
}

// ---------------------------------------------------------------- net blocks
// The search reaches its answer by trial: it will hand a block over to free room and later hand
// part of it back once a better home appears. Those intermediate steps are not what Spencer should
// be approving. What matters is the NET change per visit — who has it now versus who had it on the
// booked board — reclustered into blocks, with each block costed by asking what refusing it alone
// would cost. The raw search order is kept in the JSON as searchTrace.
// Attribution is measured on the PROPERLY SEQUENCED tour, not the nearest-neighbour ordering the
// search uses. The search compares thousands of candidates and only needs a consistent yardstick;
// these numbers are shown to Spencer next to the stage totals, so they have to be in the same
// units as those totals or they read two or three times too big.
const fullDay = (tech, day) => metrics(stopsOf(tech, day).map(toStop), tech, true);
function fullOf(tech) {
  let km = 0, h = 0, over = 0;
  for (const d of wd2(tech)) { const m = fullDay(tech, d); km += m.km; const x = effHours(m, tech, d); h += x; if (x > CAP_H) over += x - CAP_H; }
  return { km, h, over };
}

/**
 * What refusing this one block would cost, with everything else left exactly as planned.
 * Marginal, so the block figures do not add up to the stage totals: several blocks in the same
 * place share a detour, and refusing them one at a time counts that detour more than once.
 */
function attributeBlock(group, fromTech, toTech) {
  const snap = group.map(r => ({ it: r.it, tech: assign.get(r.it.key).tech, day: assign.get(r.it.key).day, svc: r.it.serviceMin }));
  const planF = fullOf(fromTech), planT = fullOf(toTech);
  let ok = true;
  const done = [];
  for (const sn of snap) {
    const d = wd2(fromTech).includes(sn.day) ? sn.day : (wd2(fromTech).includes(sn.it.from) ? sn.it.from : null);
    if (d == null) { ok = false; break; }
    moveVisit(sn.it, fromTech, d);
    done.push(sn);
  }
  let res = null;
  if (ok) {
    const refF = fullOf(fromTech), refT = fullOf(toTech);
    res = {
      kmSaved: round((refF.km + refT.km) - (planF.km + planT.km)),
      hoursOffDonor: round(refF.h - planF.h),
      hoursOntoReceiver: round(planT.h - refT.h),
      overtimeCleared: round((refF.over + refT.over) - (planF.over + planT.over)),
    };
  }
  for (const sn of snap) { moveVisit(sn.it, sn.tech, sn.day); sn.it.serviceMin = sn.svc; }
  return res;
}

function computeNetBlocks() {
 const byPair = {};
 for (const it of items) {
  const a = assign.get(it.key);
  if (a.tech === it.tech0) continue;
  const k = `${it.tech0}>${a.tech}`;
  (byPair[k] = byPair[k] || []).push({ it, score: 0 });
 }
 const netBlocks = [];
 for (const k of Object.keys(byPair)) {
  const [fromTech, toTech] = k.split('>');
  for (const g of clusterEdge(byPair[k])) {
    const cities = [...new Set(g.map(r => r.it.city).filter(Boolean))];
    const zips = [...new Set(g.map(r => r.it.zip).filter(Boolean))];
    const c = medoid(g.map(r => r.it));
    const att = attributeBlock(g, fromTech, toTech) || {};
    netBlocks.push({
      name: blockName(g),
      streets: [...new Set(g.map(r => streetOf(r.it)).filter(Boolean))],
      fromTech, toTech, customers: g.length, cities, zips,
      centroid: c ? { lat: round(c.lat), lng: round(c.lng) } : null,
      ...att,
      islandsInReceiverGround: g.filter(r => settledOwner(r.it.zip, assign.get(r.it.key).day) === toTech).length,
      days: [...new Set(g.map(r => assign.get(r.it.key).day))].sort(),
      group: g,
      visits: g.map(r => ({ visitId: r.it.id, orderNo: r.it.orderNo, job: r.it.job, client: r.it.client, city: r.it.city, zip: r.it.zip, day: assign.get(r.it.key).day, bookedDay: r.it.from })),
    });
  }
 }
 netBlocks.sort((a, b) => (b.customers - a.customers) || ((b.kmSaved ?? 0) - (a.kmSaved ?? 0)));
 return netBlocks;
}

// Prune handovers that turn out to be worth nothing. The search compares candidates on a
// nearest-neighbour ordering for speed; measured on the properly sequenced tour, a handful of them
// add driving without clearing any overtime. Those are exactly the criss-crossing Spencer wants
// gone, so they are sent back.
let netBlocks = computeNetBlocks();
for (let prune = 0; prune < 5; prune++) {
  // A handover has to pay for itself: either it saves driving, or the overtime it clears is worth
  // the driving it adds at 10 km per hour. Measured on the sequenced tour, not the search's
  // nearest-neighbour estimate — that is where a 51 km detour bought 23 minutes and survived.
  const worthIt = b => (b.kmSaved ?? 0) >= Math.max(RELIEF_KM_HARD_FLOOR, -RELIEF_KM_PER_HOUR * Math.max(0, b.overtimeCleared ?? 0)) - 1;
  const harmful = netBlocks.filter(b => !worthIt(b));
  if (!harmful.length) break;
  for (const b of harmful) {
    log(`  UNDO  ${b.name} — ${NAME(b.fromTech)} -> ${NAME(b.toTech)} costs ${Math.abs(b.kmSaved)} km and clears only ${b.overtimeCleared ?? 0} h`);
    for (const r of b.group) {
      const day = assign.get(r.it.key).day;
      const d = wd2(b.fromTech).includes(day) ? day : r.it.from;
      if (wd2(b.fromTech).includes(d)) moveVisit(r.it, b.fromTech, d);
    }
  }
  for (const t of [...new Set(harmful.flatMap(b => [b.fromTech, b.toTech]))]) {
    const mine = techStops(t);
    if (!mine.length || !wd2(t).length) continue;
    const start = new Map(mine.map(i => [i.key, assign.get(i.key).day]));
    const r = levelTech({ mine, tech: t, workdays: wd2(t), startPlace: start, maxPasses: 4 });
    for (const [k2, d] of r.place) { const a = assign.get(k2); if (a.day !== d) { bust(a.tech, a.day); a.day = d; bust(a.tech, d); } }
  }
  netBlocks = computeNetBlocks();
}
for (const b of netBlocks) delete b.group;
log(`
net blocks after collapsing the search trace: ${netBlocks.length} (search made ${blocks.length} intermediate handovers)`);
for (const b of netBlocks) log(`  ${NAME(b.fromTech)} -> ${NAME(b.toTech)}  ${String(b.customers).padStart(2)} customers  ${b.name}  ${b.kmSaved ?? '?'} km, ${b.hoursOffDonor ?? '?'} h off the donor`);

// ---------------------------------------------------------------- stage 2 boards
const techs2 = [...new Set(items.map(i => assign.get(i.key).tech))].sort();
const stage2 = {};
for (const t of techs2) {
  stage2[t] = {};
  for (const d of DATES) stage2[t][d] = metrics(stopsOf(t, d).map(toStop), t, true);
}

// ---------------------------------------------------------------- Tavis Friday, costed but NOT applied
// He is 13.5 h on Friday and frozen by instruction, which leaves him the single biggest remaining
// problem. This prices the relief so the decision is on the table with numbers behind it.
const tavisOption = { applied: false, note: 'Not part of the plan. Tavis is frozen by instruction, so this is priced only so the decision can be made with numbers.' };
{
  const tav = 'Tavis Alexander';
  const fri = DATES[4];
  const tb = stage2[tav]?.[fri];
  if (tb && tb.stops) {
    const mine = items.filter(i => assign.get(i.key).tech === tav);
    const neigh = [];
    for (const other of techs2) {
      if (other === tav || FROZEN.has(other) || !HOME[other]) continue;
      const theirs = stopsOf(other, fri);
      if (!theirs.length) continue;
      let min = Infinity;
      for (const a of mine) { const n = nearestKm(a, theirs); if (n.km < min) min = n.km; }
      if (min <= NEIGHBOUR_KM) neigh.push({ tech: other, minKm: round(min), roomH: round(Math.max(0, CAP_H - effHours(stage2[other][fri], other, fri))) });
    }
    tavisOption.fridayHours = round(effHours(tb, tav, fri));
    tavisOption.fridayStops = tb.stops;
    tavisOption.excessHours = round(Math.max(0, effHours(tb, tav, fri) - CAP_H));
    tavisOption.neighboursOnFriday = neigh.sort((a, b) => a.minKm - b.minKm);
    tavisOption.roomOnFriday = round(neigh.reduce((s, n) => s + n.roomH, 0));
    const scored = mine.map(it => {
      let bestT = null, bestKm = Infinity;
      for (const n of neigh) { const k = nearestKm(it, stopsOf(n.tech, fri)).km; if (k < bestKm) { bestKm = k; bestT = n.tech; } }
      const own = mine.filter(x => x.key !== it.key);
      const ownKm = own.length ? nearestKm(it, own).km : Infinity;
      return { it, nearTech: bestT, nearKm: round(bestKm), score: round(bestKm - ownKm) };
    }).filter(r => r.nearTech && r.score <= EDGE_MAX).sort((a, b) => a.score - b.score);
    tavisOption.edgeCustomers = scored.length;
    tavisOption.blocks = clusterEdge(scored).map(g => {
      const votes = {};
      for (const r of g) votes[r.nearTech] = (votes[r.nearTech] || 0) + 1;
      const to = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
      const c = medoid(g.map(r => r.it));
      return {
        name: `${[...new Set(g.map(r => r.it.city).filter(Boolean))].slice(0, 2).join(' / ')} ${[...new Set(g.map(r => r.it.zip).filter(Boolean))].slice(0, 2).join('/')}`.trim(),
        customers: g.length, toTech: to, meanEdgeScoreKm: round(g.reduce((s, r) => s + r.score, 0) / g.length),
        centroid: c ? { lat: round(c.lat), lng: round(c.lng) } : null,
        approxHoursOff: round(g.length * cycleFor(tav, 'fri') / 60),
        clients: g.map(r => ({ job: r.it.job, client: r.it.client, city: r.it.city })),
      };
    }).sort((a, b) => a.meanEdgeScoreKm - b.meanEdgeScoreKm);
  }
}

// ---------------------------------------------------------------- totals per stage
function stageTotals(boards, wdFn) {
  let ot = 0, km = 0, hours = 0, stops = 0;
  for (const t of Object.keys(boards)) {
    const days = (wdFn(t).length ? wdFn(t) : DATES);
    ot += overtimeH(boards[t], t, days);
    km += kmTotal(boards[t], DATES);
    hours += weekHours(boards[t], t, days);
    for (const d of DATES) stops += boards[t][d].stops;
  }
  return { overtimeHours: round(ot), km: round(km), capacityHours: round(hours), stops };
}
const fleet = {
  stage0: stageTotals(stage0, t => (WD1[t] || [])),
  stage1: stageTotals(stage1, t => (WD1[t] || [])),
  stage2: stageTotals(stage2, t => (WD2[t] || [])),
};
log(`\n--- fleet totals ---`);
for (const s of ['stage0', 'stage1', 'stage2']) log(`  ${s}: overtime ${fleet[s].overtimeHours} h, ${fleet[s].km} km, ${fleet[s].capacityHours} capacity h, ${fleet[s].stops} stops`);

// ---------------------------------------------------------------- per tech, three stages
const perTech = {};
for (const t of [...new Set([...techs0, ...techs2])].sort()) {
  const row = { tech: t, frozen: FROZEN.has(t) || !wd2(t).length, workdaysLayer1: wd1(t), workdaysLayer2: wd2(t), days: {} };
  for (const d of DATES) {
    row.days[d] = {
      stage0: stage0[t] ? summarize(stage0[t][d], t, d) : null,
      stage1: stage1[t] ? summarize(stage1[t][d], t, d) : null,
      stage2: stage2[t] ? summarize(stage2[t][d], t, d) : null,
    };
  }
  const days = wd2(t).length ? wd2(t) : DATES;
  row.weekHours = {
    stage0: stage0[t] ? round(weekHours(stage0[t], t, wd1(t).length ? wd1(t) : DATES)) : 0,
    stage1: stage1[t] ? round(weekHours(stage1[t], t, wd1(t).length ? wd1(t) : DATES)) : 0,
    stage2: stage2[t] ? round(weekHours(stage2[t], t, days)) : 0,
  };
  row.overtime = {
    stage0: stage0[t] ? round(overtimeH(stage0[t], t, wd1(t).length ? wd1(t) : DATES)) : 0,
    stage1: stage1[t] ? round(overtimeH(stage1[t], t, wd1(t).length ? wd1(t) : DATES)) : 0,
    stage2: stage2[t] ? round(overtimeH(stage2[t], t, days)) : 0,
  };
  row.km = {
    stage0: stage0[t] ? round(kmTotal(stage0[t])) : 0,
    stage1: stage1[t] ? round(kmTotal(stage1[t])) : 0,
    stage2: stage2[t] ? round(kmTotal(stage2[t])) : 0,
  };
  perTech[t] = row;
}

// ---------------------------------------------------------------- the apply list
const dayMoves = [], techMoves = [];
for (const it of items) {
  const a = assign.get(it.key);
  if (a.tech !== it.tech0) techMoves.push({ visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, zip: it.zip, fromTech: it.tech0, toTech: a.tech, day: a.day, assigneeIds: it.assignees.map(x => x.id), assigneeNames: it.assignees.map(x => x.name) });
  if (a.day !== it.from) dayMoves.push({ visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, tech: a.tech, fromDay: it.from, toDay: a.day, startTime: it.startTime });
}
log(`\napply list: ${techMoves.length} technician changes, ${dayMoves.length} date changes`);

// ---------------------------------------------------------------- still over after layer 2
const stillOver = [];
for (const t of Object.keys(perTech)) {
  const days = wd2(t).length ? wd2(t) : DATES;
  for (const d of days) {
    const h = perTech[t].days[d].stage2?.capacityHours ?? 0;
    if (h > CAP_H) stillOver.push({ tech: t, day: d, hours: h, stops: perTech[t].days[d].stage2.stops });
  }
}

// ---------------------------------------------------------------- flags
const layerFlags = [];
{
  const sp = perTech['Spencer Hill'];
  if (sp) layerFlags.push({
    type: 'spencer-becomes-a-full-route',
    weekHoursBooked: sp.weekHours.stage0, weekHoursAfter: sp.weekHours.stage2,
    stopsBooked: DATES.reduce((a, d) => a + (sp.days[d].stage0?.stops ?? 0), 0),
    stopsAfter: DATES.reduce((a, d) => a + (sp.days[d].stage2?.stops ?? 0), 0),
    fridayStopsBooked: sp.days[DATES[4]].stage0?.stops ?? 0,
    fridayStopsAfter: sp.days[DATES[4]].stage2?.stops ?? 0,
    note: "This plan turns Spencer into a five-day route technician. The standing rule is that Spencer does minimal field work and never absorbs overflow. The swap already put him in the field Monday to Thursday; layer 2 adds Friday and more stops on top. It is the single biggest assumption in the plan and it is Spencer's to accept or refuse.",
  });
  for (const [t, d] of Object.entries(stuckDetail)) layerFlags.push({ type: 'still-over-after-layer-2', tech: t, ...d, note: `${NAME(t)} still carries ${d.excessHours} h more than his week can hold, and no further edge block can move.` });
  const tav = perTech['Tavis Alexander'];
  if (tav) layerFlags.push({ type: 'tavis-frozen', tech: 'Tavis Alexander', fridayHours: tav.days[DATES[4]].stage2?.capacityHours ?? 0, note: 'Frozen by instruction, so none of his Friday work was touched. Costed separately under the Tavis option.' });
  const zipShift = {};
  for (const b of netBlocks) for (const z of b.zips) { const k = `${z}|${b.fromTech}>${b.toTech}`; zipShift[k] = (zipShift[k] || 0) + 1; }
  layerFlags.push({ type: 'territory-lines-that-would-move', count: Object.keys(zipShift).length, rows: Object.entries(zipShift).map(([k, n]) => { const [zip, pair] = k.split('|'); const [f, t] = pair.split('>'); return { zip, fromTech: f, toTech: t, customers: n }; }).sort((a, b) => b.customers - a.customers), note: 'Postcodes where customers cross from one technician to another. If the handover is accepted permanently, these are the lines that move on the territory map.' });
  const court = items.filter(i => FROZEN.has(i.tech0) && !HOME[i.tech0]);
  if (court.length) layerFlags.push({ type: 'not-a-technician', count: court.length, note: `${court.length} visits sit on the Courtney staging profile. Untouched by both layers; they still need a real technician before Monday.` });
}

const out = {
  generatedAt: new Date().toISOString(), layer: 2, week: DATES, cap: CAP_H, weekSoftCap: WEEK_SOFT_H,
  parameters: { neighbourKm: NEIGHBOUR_KM, clusterKm: CLUSTER_KM, edgeScoreMax: EDGE_MAX },
  assumptions: {
    spencerStart: 'ASSUMED — 718 Griffin Ave area, Enumclaw 98022. Spencer has no GPS tracker, so he also gets the all-tech median time on site.',
    spencerFriday: "Layer 2 opens Spencer's Friday as a receiving day. He holds one stop that day and starts in Enumclaw, on the doorstep of Luke's Pierce ground.",
    swap: "Cory runs Tavis's ground Monday to Thursday and Spencer runs Cory's, because of this morning's swap. Permanently, Tavis's ground is Tavis's.",
    tavis: 'Tavis is frozen: out Monday to Thursday, Friday exactly as booked. His Friday relief is costed separately and is NOT part of the plan.',
    hours: 'capacity hours = the worse of modelled route time (home to sequenced stops to home) and (stops x that tech and weekday\'s measured GPS cycle minutes + commute).',
    dataCut: 'Jobber board pulled live 2026-09-19. Territory ownership from territory-asbuilt.json (2026-08-14..09-17). Cycle times from vehicle GPS 2026-08-17..09-17.',
  },
  fleet, perTech, blocks: netBlocks, searchTrace: blocks, stuckDetail, techMoves, dayMoves, stillOver, tavisOption, flags: layerFlags,
};
fs.writeFileSync(path.join(SWAP, 'leveled-plan-2.json'), JSON.stringify(out, null, 1));
log('wrote leveled-plan-2.json');

// ================================================================ markdown
const M = [];
M.push(`# Territory edge shift, 21 to 25 September — proposal only`);
M.push(``);
M.push(`Nothing has been changed. This builds on the day-levelling proposal and adds the second thing you asked for: when a technician is overloaded, hand the customers on his edge to the technician whose work is already closest to them, in whole blocks, and shift the territory line to match.`);
M.push(``);
M.push(`**Three stages.** Stage 0 is the week as booked. Stage 1 is day levelling inside each technician, which is the first proposal. Stage 2 adds the block handovers.`);
M.push(``);
M.push(`| Fleet | As booked | After day levelling | After edge shift |`);
M.push(`|---|---|---|---|`);
M.push(`| Hours over the 9 hour cap | ${fleet.stage0.overtimeHours} | ${fleet.stage1.overtimeHours} | ${fleet.stage2.overtimeHours} |`);
M.push(`| Kilometres driven, whole week | ${fleet.stage0.km} | ${fleet.stage1.km} | ${fleet.stage2.km} |`);
M.push(`| Total hours worked | ${fleet.stage0.capacityHours} | ${fleet.stage1.capacityHours} | ${fleet.stage2.capacityHours} |`);
M.push(``);
M.push(`Technician changes: **${techMoves.length}**. Date changes: **${dayMoves.length}**. Nothing changes technician without your yes, block by block.`);
M.push(``);
M.push(`## The blocks that move`);
M.push(``);
M.push(`Each block is costed by asking what refusing **that one block** would cost, with everything else left as planned. Do not add the block figures up: several blocks in the same place share one detour, so counting them one at a time counts that detour several times. The fleet table above is the number that adds up.`);
M.push(``);
if (!netBlocks.length) M.push(`None. No edge block could move without pushing the receiving technician over the cap.`);
for (const b of netBlocks) {
  M.push(`### ${b.name} — ${b.customers} customers, ${NAME(b.fromTech)} to ${NAME(b.toTech)}`);
  M.push(``);
  M.push(`Lands on ${b.days.map(d => LABEL[d]).join(' and ')}. Refusing this block alone would add ${b.kmSaved} km back and put ${b.hoursOffDonor} hours back on ${NAME(b.fromTech)}${b.overtimeCleared ? `, ${b.overtimeCleared} of them over the cap` : ''}. It costs ${NAME(b.toTech)} ${b.hoursOntoReceiver} hours.`);
  M.push(``);
  M.push(`| Job | Client | City | Zip | Day |`);
  M.push(`|---|---|---|---|---|`);
  for (const v of b.visits) M.push(`| ${v.job} | ${String(v.client || '').replace(/\|/g, '/')} | ${v.city || ''} | ${v.zip || ''} | ${LABEL[v.day]} |`);
  M.push(``);
  M.push(`**Territory implication:** ${b.zips.join(', ')} would become ${NAME(b.toTech)}'s ground, not just this week.`);
  M.push(``);
}
M.push(`## Each technician, three stages`);
M.push(``);
for (const t of Object.keys(perTech).sort()) {
  const r = perTech[t];
  M.push(`### ${NAME(t)}${r.frozen ? ' — frozen' : ''}`);
  M.push(``);
  M.push(`| Day | Stops booked | Stops after levelling | Stops after edge shift | Hours booked | After levelling | After edge shift | Km after |`);
  M.push(`|---|---|---|---|---|---|---|---|`);
  for (const d of DATES) {
    const x = r.days[d];
    if (!x.stage0?.stops && !x.stage1?.stops && !x.stage2?.stops) continue;
    M.push(`| ${LABEL[d]} | ${x.stage0?.stops ?? 0} | ${x.stage1?.stops ?? 0} | ${x.stage2?.stops ?? 0} | ${x.stage0?.capacityHours ?? 0} | ${x.stage1?.capacityHours ?? 0} | ${x.stage2?.capacityHours ?? 0}${(x.stage2?.capacityHours ?? 0) > CAP_H ? ' over' : ''} | ${x.stage2?.km ?? 0} |`);
  }
  M.push(``);
  M.push(`Week: ${r.weekHours.stage0} h booked, ${r.weekHours.stage1} h after levelling, **${r.weekHours.stage2} h after the edge shift**. Hours over the cap: ${r.overtime.stage0} to ${r.overtime.stage1} to **${r.overtime.stage2}**. Kilometres: ${r.km.stage0} to ${r.km.stage1} to **${r.km.stage2}**.`);
  M.push(``);
}
M.push(`## Still over nine hours after both layers`);
M.push(``);
if (!stillOver.length) M.push(`Nothing.`);
else {
  const g = {};
  for (const s of stillOver) (g[s.tech] = g[s.tech] || []).push(s);
  for (const t of Object.keys(g)) M.push(`- **${NAME(t)}** — ${g[t].sort((a, b) => dayIdx(a.day) - dayIdx(b.day)).map(s => `${LABEL[s.day]} ${s.hours} h on ${s.stops} stops`).join(', ')}.`);
}
M.push(``);
if (tavisOption.fridayHours) {
  M.push(`## Tavis's Friday — costed, not proposed`);
  M.push(``);
  M.push(`You told me not to move Tavis's Friday work, so none of it moved. It is worth seeing the size of what that decision costs: **${tavisOption.fridayHours} hours on ${tavisOption.fridayStops} stops, ${tavisOption.excessHours} hours over the cap.**`);
  M.push(``);
  M.push(`On that Friday his neighbours are ${tavisOption.neighboursOnFriday.map(n => `${NAME(n.tech)} (${n.minKm} km away, ${n.roomH} h of room)`).join(', ')}. That is ${tavisOption.roomOnFriday} hours of room within reach. ${tavisOption.edgeCustomers} of his customers sit closer to a neighbour's Friday work than to his own, in these blocks:`);
  M.push(``);
  M.push(`| Block | Customers | Nearest technician | Hours it would take off Tavis |`);
  M.push(`|---|---|---|---|`);
  for (const b of tavisOption.blocks) M.push(`| ${b.name} | ${b.customers} | ${NAME(b.toTech)} | ${b.approxHoursOff} |`);
  M.push(``);
  M.push(`None of this is in the plan. Say the word and it costs out properly.`);
  M.push(``);
}
M.push(`## Flags`);
M.push(``);
for (const f of layerFlags) {
  if (f.type === 'spencer-becomes-a-full-route') {
    M.push(`### This plan turns Spencer into a five-day route technician`);
    M.push(``);
    M.push(`Booked, Spencer carries ${f.stopsBooked} stops and about ${f.weekHoursBooked} hours, with ${f.fridayStopsBooked} stops on Friday. After both layers he carries ${f.stopsAfter} stops and about ${f.weekHoursAfter} hours, with ${f.fridayStopsAfter} on Friday. ${f.note}`);
    M.push(``);
  } else if (f.type === 'still-over-after-layer-2') {
    M.push(`### ${NAME(f.tech)} is still ${f.excessHours} hours over what his week holds`);
    M.push(``);
    M.push(`Neighbour room left: ${f.neighbours.map(n => `${NAME(n.tech)} ${n.roomH} h at ${n.minKm} km`).join(', ') || 'none'}. ${f.legalBlocksFound} further blocks were legal and every one was refused: ${f.bestRejected.map(c => `${c.cities.join('/')} to ${NAME(c.to)} because it ${c.rejectedFor}`).join('; ') || 'none'}.`);
    M.push(``);
  } else if (f.type === 'territory-lines-that-would-move') {
    M.push(`### Territory lines that would move`);
    M.push(``);
    M.push(`${f.note}`);
    M.push(``);
    M.push(`| Zip | From | To | Customers |`);
    M.push(`|---|---|---|---|`);
    for (const r of f.rows) M.push(`| ${r.zip} | ${NAME(r.fromTech)} | ${NAME(r.toTech)} | ${r.customers} |`);
    M.push(``);
  } else if (f.type === 'not-a-technician') {
    M.push(`### Visits on a profile that is not a technician`);
    M.push(``);
    M.push(`${f.note}`);
    M.push(``);
  }
}
M.push(`## How a block was chosen`);
M.push(``);
M.push(`- A technician is **overloaded** when any day runs over 9 hours, or the whole week runs over 42.`);
M.push(`- A customer's **edge score** is how far it sits from the nearest neighbouring technician's work, minus how far it sits from its own technician's nearest other stop. Negative means it is closer to somebody else's round than to its own. A house in the middle of a run scores strongly positive and is never picked up.`);
M.push(`- A **neighbour** is any technician whose stops come within ${NEIGHBOUR_KM} km.`);
M.push(`- Edge customers are grouped into **blocks** where they sit within ${CLUSTER_KM} km of each other, and a block moves whole or not at all. That is what stops the criss-crossing: one lone house never crosses a line.`);
M.push(`- A block only moves if the receiving technician's every day stays under 9 hours afterwards, every visit stays inside its five to nine day window, and no job ends up with two visits on one day.`);
M.push(`- Both technicians then re-level their own days.`);
M.push(``);
M.push(`## Assumptions`);
M.push(``);
M.push(`- **Spencer's start is assumed** at the Griffin Avenue area in Enumclaw. He has no truck tracker, so he also gets the all-technician average time on site.`);
M.push(`- **Layer 2 opens Spencer's Friday.** He holds one stop that day and starts in Enumclaw, which is the doorstep of Luke's Pierce ground on the one day Luke has no other relief.`);
M.push(`- **The swap is respected.** Monday to Thursday, Cory runs Tavis's ground and Spencer runs Cory's. Permanently, that ground goes back to Tavis.`);
M.push(`- **Hours** are the larger of two estimates: modelled driving plus measured time on site, or that technician's measured minutes per visit on that weekday times the stop count plus the commute. The second sweeps in breaks and fuel stops.`);
M.push(`- Territory ownership comes from what the field actually ran between 14 August and 17 September, not from the territory file.`);
M.push(``);
fs.writeFileSync(path.join(SWAP, 'leveled-plan-2.md'), M.join('\n'));
log('wrote leveled-plan-2.md');

// ================================================================ map data
const movedIds = new Set(techMoves.map(m => m.visitId));
const mapStops = items.map(it => {
  const a = assign.get(it.key);
  return {
    id: it.id, job: it.job, client: it.client, city: it.city, zip: it.zip,
    lat: round(it.lat), lng: round(it.lng),
    t0: it.tech0, d0: it.from,
    t1: it.tech0, d1: place1.get(it.key),
    t2: a.tech, d2: a.day,
    moved: movedIds.has(it.id),
  };
});
fs.writeFileSync(path.join(SWAP, 'leveled-map-data.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), dates: DATES, labels: LABEL,
  homes: Object.fromEntries(Object.entries(HOME).map(([k, v]) => [k, { lat: round(v.lat), lng: round(v.lng), label: `${v.street || ''} ${v.city || ''}`.trim() }])),
  stops: mapStops,
  blocks: netBlocks.map(b => ({ name: b.name, fromTech: b.fromTech, toTech: b.toTech, customers: b.customers, kmSaved: b.kmSaved, centroid: b.centroid, ids: b.visits.map(v => v.visitId) })),
  perTech: Object.fromEntries(Object.entries(perTech).map(([t, r]) => [t, { days: Object.fromEntries(DATES.map(d => [d, { s0: r.days[d].stage0?.stops ?? 0, s1: r.days[d].stage1?.stops ?? 0, s2: r.days[d].stage2?.stops ?? 0, h0: r.days[d].stage0?.capacityHours ?? 0, h1: r.days[d].stage1?.capacityHours ?? 0, h2: r.days[d].stage2?.capacityHours ?? 0 }])) }])),
  fleet,
}, null, 1));
log('wrote leveled-map-data.json');

// ---------------------------------------------------------------- the map
const MAP_DATA = {
  dates: DATES, labels: LABEL,
  techs: [...new Set(mapStops.flatMap(s => [s.t0, s.t2]))].filter(Boolean).sort(),
  homes: Object.fromEntries(Object.entries(HOME).map(([k, v]) => [k, { lat: round(v.lat), lng: round(v.lng) }])),
  stops: mapStops,
  blocks: netBlocks.map(b => ({ name: b.name, fromTech: b.fromTech, toTech: b.toTech, customers: b.customers, kmSaved: b.kmSaved })),
  perTech: Object.fromEntries(Object.entries(perTech).map(([t, r]) => [t, Object.fromEntries(DATES.map(d => [d, {
    s0: r.days[d].stage0?.stops ?? 0, s1: r.days[d].stage1?.stops ?? 0, s2: r.days[d].stage2?.stops ?? 0,
    h0: r.days[d].stage0?.capacityHours ?? 0, h1: r.days[d].stage1?.capacityHours ?? 0, h2: r.days[d].stage2?.capacityHours ?? 0,
  }]))])),
  fleet,
};
fs.writeFileSync(path.join(SWAP, 'leveled-map.html'), renderMap(MAP_DATA));
log('wrote leveled-map.html');
