#!/usr/bin/env node
/**
 * week-model.mjs — the shared cost model and day-levelling solver for the week of 2026-09-21.
 *
 * Offline. No network. Imported by level-week.mjs (layer 1, day moves inside one tech) and
 * edge-shift.mjs (layer 2, territory edge shifts between techs), so both layers score a day the
 * same way and their numbers can be compared stage to stage.
 *
 * COST MODEL
 *   route time  = home -> sequenced stops -> home. Travel from redesign/scripts/travel.mjs
 *                 (observed OptimoRoute legs where the pair was ever driven, per-driver haversine
 *                 fit otherwise); on-site time from the vehicle-GPS medians in cycle-times-gps.json.
 *   paid span   = first stop to last stop, i.e. route time minus both commute legs. The GPS study
 *                 found paid time tracks first-job-to-last-job, so this is the Gusto number.
 *   gps cycle   = stops x that tech/weekday's measured minutes-per-visit. Measured, so it carries
 *                 the breaks and non-customer stops the travel model cannot see.
 *   capacity    = the WORSE of route hours and (gps cycle hours + commute). Deliberately pessimistic.
 *
 * SEQUENCING
 *   sequence.mjs optimises an OPEN path — it costs the leg in from home but not the leg back, so it
 *   will finish the day on the far side of the territory. A real day is a closed tour, so the same
 *   2-opt and or-opt moves are re-scored against home -> stops -> home. Construction is still
 *   sequence.mjs's nearest-neighbour and every leg still comes from travel.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { travel } from '../../scripts/travel.mjs';
import { nearestNeighbour, pathSeconds, pathMetres } from '../../scripts/sequence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SWAP = __dirname;
export const REDESIGN = path.resolve(__dirname, '../..');
export const ENGINE = path.resolve(REDESIGN, '..');

export const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
export const DOW = { '2026-09-21': 'mon', '2026-09-22': 'tue', '2026-09-23': 'wed', '2026-09-24': 'thu', '2026-09-25': 'fri' };
export const LABEL = { '2026-09-21': 'Mon 09-21', '2026-09-22': 'Tue 09-22', '2026-09-23': 'Wed 09-23', '2026-09-24': 'Thu 09-24', '2026-09-25': 'Fri 09-25' };
export const CAP_H = 9.0;
export const WEEK_SOFT_H = 42.0;
export const dayIdx = d => DATES.indexOf(d);
export const round = x => Math.round(x * 100) / 100;
export const addDays = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd) + n * 86400e3).toISOString().slice(0, 10); };

const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export const gps = J(path.join(REDESIGN, 'data', 'gps-ground-truth.json'));
export const cyc = J(path.join(REDESIGN, 'data', 'cycle-times-gps.json'));

// ---------------------------------------------------------------- techs
// Homes are the GPS-derived overnight locations. Spencer has no tracker, so his start is an
// ASSUMPTION: Enumclaw 98022, the 718 Griffin Avenue area.
export const SPENCER_HOME = { lat: 47.2043, lng: -121.9927, street: '718 Griffin Ave area (assumed)', city: 'Enumclaw', zip: '98022', assumed: true };
export const HOME = {};
export const ONSITE = {};
const CYCLE_DOW = {};
for (const t of gps.perTech) if (t.home) HOME[t.tech] = { lat: t.home.lat, lng: t.home.lng, street: t.home.street, city: t.home.city, zip: t.home.zip };
HOME['Spencer Hill'] = SPENCER_HOME;
for (const r of cyc.byTech) ONSITE[r.tech] = r.onSiteMinPerStop;
ONSITE['Spencer Hill'] = cyc.globalOnSiteMinPerStop;   // no tracker — all-tech median
for (const r of cyc.byTechDow) CYCLE_DOW[`${r.tech}|${r.dow}`] = r.cycleMinPerStop;
export const cycleFor = (tech, dow) => CYCLE_DOW[`${tech}|${dow}`]
  ?? (cyc.byTech.find(x => x.tech === tech)?.cycleMinPerStop)
  ?? cyc.globalCycleMinPerStop;

// ---------------------------------------------------------------- geometry
export function haversineKm(a, b) {
  const R = 6371.0088, rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function medoid(pts) {
  if (!pts.length) return null;
  let best = pts[0], bs = Infinity;
  for (const p of pts) { let s = 0; for (const q of pts) s += haversineKm(p, q); if (s < bs) { bs = s; best = p; } }
  return best;
}

// ---------------------------------------------------------------- route metrics
const legOf = (a, b, tech) => travel(a, b, tech);
function closedSeconds(order, tech, home) { return pathSeconds(order, tech, home) + legOf(order[order.length - 1], home, tech).seconds; }

export function sequenceClosed(stops, tech, home, { maxSweeps = 24, minGain = 1 } = {}) {
  let best = nearestNeighbour(stops, tech, home);
  let bestC = closedSeconds(best, tech, home);
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        const c = closedSeconds(cand, tech, home);
        if (c < bestC - minGain) { best = cand; bestC = c; improved = true; }
      }
    }
    for (let len = 1; len <= 3 && len < best.length; len++) {
      for (let i = 0; i + len <= best.length; i++) {
        const seg = best.slice(i, i + len);
        const rest = best.slice(0, i).concat(best.slice(i + len));
        for (let j = 0; j <= rest.length; j++) {
          if (j === i) continue;
          const cand = rest.slice(0, j).concat(seg, rest.slice(j));
          const c = closedSeconds(cand, tech, home);
          if (c < bestC - minGain) { best = cand; bestC = c; improved = true; i = Math.max(-1, i - 1); break; }
        }
      }
    }
    if (!improved) break;
  }
  return best;
}

/** stops: [{lat,lng,serviceMin}]. `full` runs the closed-tour improvement, otherwise nearest-neighbour. */
export function metrics(stops, tech, full) {
  const n = stops.length;
  if (!n || !HOME[tech]) return { stops: n, routeH: 0, paidH: 0, km: 0, serviceMin: 0, travelMin: 0, commuteMin: 0, order: [] };
  const home = HOME[tech];
  const order = n === 1 ? stops.slice() : (full ? sequenceClosed(stops, tech, home) : nearestNeighbour(stops, tech, home));
  const inA = legOf(home, order[0], tech);
  const outA = legOf(order[n - 1], home, tech);
  const innerSec = pathSeconds(order, tech, null);
  const innerM = pathMetres(order, tech, null);
  const serviceMin = order.reduce((s, x) => s + Number(x.serviceMin || 0), 0);
  const travelMin = (inA.seconds + innerSec + outA.seconds) / 60;
  return {
    stops: n, order,
    routeH: (travelMin + serviceMin) / 60,
    paidH: (innerSec / 60 + serviceMin) / 60,
    km: (inA.metres + innerM + outA.metres) / 1000,
    serviceMin, travelMin, commuteMin: (inA.seconds + outA.seconds) / 60,
  };
}

/** Conservative capacity hours: the worse of the travel model and the measured GPS cycle. */
export function effHours(m, tech, date) {
  if (!m.stops || !HOME[tech]) return 0;
  return Math.max(m.routeH, (m.stops * cycleFor(tech, DOW[date]) + m.commuteMin) / 60);
}

export function summarize(m, tech, d) {
  return {
    stops: m.stops,
    routeHours: round(m.routeH),
    paidSpanHours: round(m.paidH),
    capacityHours: round(effHours(m, tech, d)),
    gpsCycleHours: round(m.stops ? (m.stops * cycleFor(tech, DOW[d]) + m.commuteMin) / 60 : 0),
    km: round(m.km),
    serviceMin: round(m.serviceMin),
    travelMin: round(m.travelMin),
    commuteMin: round(m.commuteMin),
  };
}

export const toStop = it => ({ key: it.key, lat: it.lat, lng: it.lng, serviceMin: it.serviceMin, job: it.job });

// ---------------------------------------------------------------- the board
const DAYWORD = /\b(mon|tues?|wed|weds|thur?s?|fri|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
const TIMEWORD = /\b(\d{1,2}\s*(:\d{2})?\s*(am|pm)|\d{1,2}:\d{2}|morning|afternoon|noon|first thing|early|before\s+\d|after\s+\d)\b/i;
const REQWORD = /(customer\s+request|cust\s*req|client\s+request|requested|per\s+customer|only\s+on|must\s+be)/i;
const SETWORD = /\bset\b/i;

export function productOf(job) {
  const names = (job?.lineItems || []).map(li => String(li.name || '').toLowerCase()).join(' | ');
  if (/total mole control/.test(names)) return 'TMCP';
  if (/quick fix/.test(names)) return 'QUICK_FIX';
  if (/barter|friends and family/.test(names)) return 'TMCP';
  return 'OTHER';
}
function cfOf(job, label) { const f = (job?.customFields || []).find(c => String(c.label || '').trim().toLowerCase() === label); return f ? f.value : null; }
export function isActive(job) {
  const act = String(cfOf(job, 'latest activity') ?? '').trim().toLowerCase();
  if ((Number(cfOf(job, 'moles caught (last visit)') ?? 0) || 0) > 0) return true;
  if ((Number(cfOf(job, 'misses (last visit)') ?? 0) || 0) > 0) return true;
  return !!act && act !== 'none';
}

/**
 * Builds the week's items from the live board. Deduplicates Jobber's cursor pagination (it can
 * hand back the same visit on two pages, and a duplicate row turns itself into a phantom
 * same-job-same-day collision). Attaches product, activity, last completed visit, pin reasons and
 * the cadence window.
 */
export function buildBoard(workdaysOf) {
  const week = J(path.join(SWAP, 'week-live.json'));
  const jobs = J(path.join(REDESIGN, 'data', 'jobber', 'jobs.json'));
  const snapVisits = J(path.join(REDESIGN, 'data', 'jobber', 'visits.json'));
  const completedAug = J(path.join(ENGINE, 'data', 'completed-visits_2026-08-17_2026-09-17.json'));
  const recent = J(path.join(SWAP, 'recent-completed.json'));

  const jobByNum = new Map(jobs.map(j => [j.jobNumber, j]));
  const lastDone = new Map();
  const note = (jn, d) => { if (jn == null || !d) return; const c = lastDone.get(jn); if (!c || d > c) lastDone.set(jn, d); };
  for (const v of completedAug) note(v.job, (v.completedAt || v.startAt || '').slice(0, 10));
  for (const v of snapVisits) if (v.isComplete) note(v.jobNumber, new Date(v.startAt).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10));
  for (const v of recent.completed) note(v.job, v.date);
  for (const [jn, d] of [...lastDone]) if (d >= DATES[0]) lastDone.delete(jn);

  const seen = new Set();
  const dupRows = [];
  const rows = week.visits.filter(v => { if (seen.has(v.id)) { dupRows.push(v); return false; } seen.add(v.id); return true; });

  const items = rows.map(v => {
    const tech = v.assignees[0]?.name || '(unassigned)';
    const job = jobByNum.get(v.jobNumber) || null;
    return {
      key: v.id, id: v.id, visitNum: v.visitNum, orderNo: `${v.jobNumber}-${v.visitNum}`,
      job: v.jobNumber, client: v.client, city: v.city, zip: v.zip, title: v.title,
      instructions: v.instructions || '', address: v.address,
      tech0: tech, tech, from: v.date, startTime: v.startTime,
      lat: v.lat, lng: v.lng, isComplete: v.isComplete,
      assignees: v.assignees,
      product: productOf(job), active: job ? isActive(job) : false,
      last: lastDone.get(v.jobNumber) || null,
      jobObj: job,
      serviceMin: ONSITE[tech] ?? cyc.globalOnSiteMinPerStop,
    };
  });

  const jobHasHistory = new Set([...lastDone.keys()]);
  const firstOfJob = new Map();
  for (const it of items) { const c = firstOfJob.get(it.job); if (!c || it.from < c) firstOfJob.set(it.job, it.from); }

  for (const it of items) {
    const text = `${it.title} ${it.instructions}`;
    const reasons = [];
    if (it.isComplete) reasons.push('already completed');
    if (SETWORD.test(it.title)) reasons.push('title says SET');
    if (!jobHasHistory.has(it.job) && it.from === firstOfJob.get(it.job)) reasons.push("job's first visit — no completed history");
    if (DAYWORD.test(text)) reasons.push('title or instructions name a day');
    if (TIMEWORD.test(text)) reasons.push('title or instructions name a time');
    if (REQWORD.test(text)) reasons.push('customer requested');
    it.datePinned = reasons.length > 0;                       // its DATE is fixed
    it.pinReason = reasons.join('; ') || null;
  }
  applyWindows(items, workdaysOf);
  return { week, jobs, items, dupRows, lastDone };
}

/**
 * Cadence window -> allowed days. Computed for EVERY visit, pinned or not, so a pinned visit that
 * is already past its window is still reported; only `allowed` is frozen.
 * Quick Fix and active TMCP hold 5 to 9 days from the last completed visit. Quiet TMCP and
 * anything with no completed visit carry no cadence constraint.
 */
export function applyWindows(items, workdaysOf) {
  for (const it of items) {
    const wd = workdaysOf(it.tech) || [];
    const pool = wd.length ? wd : [it.from];
    const needs = it.last && (it.product === 'QUICK_FIX' || (it.product === 'TMCP' && it.active));
    it.overdue = false;
    if (!needs) {
      it.window = { from: null, to: null, basis: !it.last ? 'no completed visit on record — no cadence constraint' : (it.product === 'TMCP' ? 'quiet TMCP — no 5 to 9 day constraint' : 'no cadence constraint for this product') };
      it.allowed = it.datePinned ? [it.from] : pool.slice();
      continue;
    }
    const wf = addDays(it.last, 5), wt = addDays(it.last, 9);
    let allowed = pool.filter(d => d >= wf && d <= wt);
    if (!allowed.length) {
      if (wt < DATES[0]) { allowed = pool.slice(); it.overdue = true; }
      else allowed = [pool[pool.length - 1]];
    }
    it.window = { from: wf, to: wt, basis: `${it.product === 'QUICK_FIX' ? 'Quick Fix' : 'active TMCP'} — 5 to 9 days after ${it.last}` };
    it.allowed = it.datePinned ? [it.from] : allowed;
  }
}

// ---------------------------------------------------------------- layer 1 solver
// Adapted from scripts/policies/week-solve.mjs: day-zone medoids for compactness, a quadratic
// capacity penalty, and a move/swap local search. Differences: the board starts from the real
// booked week rather than from scratch, the tech is fixed, day cost is real sequenced route time
// rather than stops x cycle, and the objective carries an evenness term because that is what
// Spencer asked for. The capacity number is often the GPS cycle term, which depends only on stop
// count and therefore cannot see driving at all — so travel is priced separately from capacity,
// otherwise the search scatters a day across the territory for free.
export const DEFAULT_W = { cap: 400, even: 14, zone: 0.20, travel: 12, move: 0.6, late: 1.2 };

/**
 * Levels one tech's week. `mine` are that tech's items with `.place` meaning the current day.
 * Returns the new placement plus counters. Mutates nothing outside the returned Map.
 */
export function levelTech({ mine, tech, workdays, startPlace, W = DEFAULT_W, maxPasses = 14, budgetMs = 240000, log = () => {} }) {
  const wd = workdays.slice();
  const place = new Map(mine.map(i => [i.key, startPlace ? startPlace.get(i.key) : i.from]));
  if (!wd.length || !HOME[tech]) return { place, passes: 0, moves: 0, swaps: 0, repairs: 0, capUnreachable: false };

  const movable = mine.filter(i => !i.datePinned && i.allowed.filter(d => wd.includes(d)).length > 1);
  const dayStops = d => mine.filter(i => place.get(i.key) === d).map(toStop);
  const cache = new Map();
  const mOf = d => { let v = cache.get(d); if (v === undefined) { v = metrics(dayStops(d), tech, false); cache.set(d, v); } return v; };
  const bust = d => cache.delete(d);

  let medoids = {};
  const rebuildMedoids = () => { medoids = {}; for (const d of wd) medoids[d] = medoid(dayStops(d)); };
  rebuildMedoids();

  const hoursNow = () => wd.map(d => effHours(mOf(d), tech, d));
  function objective() {
    const hs = hoursNow();
    const mean = hs.reduce((a, b) => a + b, 0) / (hs.length || 1);
    let c = 0;
    for (const h of hs) { if (h > CAP_H) c += W.cap * (h - CAP_H) ** 2; c += W.even * (h - mean) ** 2; }
    for (const d of wd) c += W.travel * (mOf(d).travelMin / 60);
    for (const it of mine) {
      const d = place.get(it.key);
      const md = medoids[d];
      if (md && it.lat != null) c += W.zone * haversineKm(it, md);
      if (it.overdue) c += W.late * dayIdx(d);
      if (d !== it.from) c += W.move;
    }
    return c;
  }

  const jobDays = new Map();
  for (const it of mine) { const d = place.get(it.key); if (!jobDays.has(it.job)) jobDays.set(it.job, new Map()); const m = jobDays.get(it.job); m.set(d, (m.get(d) || 0) + 1); }
  const jobFree = (it, d) => !(jobDays.get(it.job)?.get(d) > 0) || place.get(it.key) === d;
  function applyMove(it, to) {
    const from = place.get(it.key);
    if (from === to) return;
    const jm = jobDays.get(it.job);
    jm.set(from, jm.get(from) - 1);
    jm.set(to, (jm.get(to) || 0) + 1);
    place.set(it.key, to);
    bust(from); bust(to);
  }

  let cur = objective(), passes = 0, accepted = 0, swapped = 0, improved = true;
  const t0 = Date.now();
  while (improved && passes < maxPasses && Date.now() - t0 < budgetMs) {
    improved = false; passes++;
    rebuildMedoids();
    const order = movable.slice().sort((a, b) => effHours(mOf(place.get(b.key)), tech, place.get(b.key)) - effHours(mOf(place.get(a.key)), tech, place.get(a.key)));
    for (const it of order) {
      const from = place.get(it.key);
      let bestD = null, bestC = cur;
      for (const d of it.allowed) {
        if (d === from || !wd.includes(d) || !jobFree(it, d)) continue;
        applyMove(it, d);
        const c = objective();
        if (c < bestC - 1e-9) { bestC = c; bestD = d; }
        applyMove(it, from);
      }
      if (bestD) { applyMove(it, bestD); cur = bestC; accepted++; improved = true; }
    }
    for (let i = 0; i < movable.length; i++) {
      const a = movable[i], da = place.get(a.key);
      for (let j = i + 1; j < movable.length; j++) {
        const b = movable[j], db = place.get(b.key);
        if (da === db || a.job === b.job) continue;
        if (!a.allowed.includes(db) || !b.allowed.includes(da)) continue;
        if ((jobDays.get(a.job).get(db) || 0) > 0 || (jobDays.get(b.job).get(da) || 0) > 0) continue;
        applyMove(a, db); applyMove(b, da);
        const c = objective();
        if (c < cur - 1e-9) { cur = c; swapped++; improved = true; break; }
        applyMove(a, da); applyMove(b, db);
      }
    }
    log(`  pass ${passes}: cost ${Math.round(cur)}  moves ${accepted}  swaps ${swapped}  hours ${hoursNow().map(h => h.toFixed(1)).join(' ')}`);
  }

  // Capacity repair against properly sequenced hours. Repair only buys something when a day still
  // has genuine room under the cap; if every day is already over, one more shuffle does not fix the
  // day, it only adds a move for Spencer to apply.
  const after = {};
  const recompute = () => { for (const d of DATES) after[d] = metrics(mine.filter(i => place.get(i.key) === d).map(toStop), tech, true); };
  recompute();
  let repairs = 0, capUnreachable = false;
  for (let guard = 0; guard < 30; guard++) {
    const over = wd.filter(d => effHours(after[d], tech, d) > CAP_H).sort((a, b) => effHours(after[b], tech, b) - effHours(after[a], tech, a));
    if (!over.length) break;
    const d = over[0];
    let best = null;
    for (const it of movable.filter(i => place.get(i.key) === d)) {
      for (const t of it.allowed) {
        if (t === d || !wd.includes(t) || (jobDays.get(it.job)?.get(t) || 0) > 0) continue;
        const th = effHours(after[t], tech, t);
        if (th >= CAP_H - 0.15) continue;
        const md = medoids[t];
        const score = th + (md ? 0.02 * haversineKm(it, md) : 0);
        if (!best || score < best.score) best = { it, to: t, score };
      }
    }
    if (!best) { capUnreachable = true; break; }
    applyMove(best.it, best.to); repairs++; recompute();
  }
  return { place, passes, moves: accepted, swaps: swapped, repairs, capUnreachable };
}

/**
 * Marginal cost of slotting one stop into an already-sequenced closed tour, at its cheapest
 * position. Returns the extra drive only — on-site time is added by the caller, since it depends on
 * which tech does the work. `order` is the sequenced stop list; the tour is home -> order -> home.
 */
export function insertionCost(order, tech, stop) {
  const home = HOME[tech];
  if (!home) return null;
  if (!order.length) {
    const a = legOf(home, stop, tech), b = legOf(stop, home, tech);
    return { seconds: a.seconds + b.seconds, metres: a.metres + b.metres, at: 0 };
  }
  let best = null;
  for (let i = 0; i <= order.length; i++) {
    const prev = i === 0 ? home : order[i - 1];
    const next = i === order.length ? home : order[i];
    const cur = legOf(prev, next, tech);
    const a = legOf(prev, stop, tech), b = legOf(stop, next, tech);
    const seconds = a.seconds + b.seconds - cur.seconds;
    const metres = a.metres + b.metres - cur.metres;
    if (!best || seconds < best.seconds) best = { seconds, metres, at: i };
  }
  return best;
}

/** Drive saved by lifting the stop at `idx` out of a sequenced closed tour. On-site is separate. */
export function removalSaving(order, tech, idx) {
  const home = HOME[tech];
  if (!home || !order.length) return { seconds: 0, metres: 0 };
  const prev = idx === 0 ? home : order[idx - 1];
  const next = idx === order.length - 1 ? home : order[idx + 1];
  const a = legOf(prev, order[idx], tech), b = legOf(order[idx], next, tech);
  const bridge = order.length === 1 ? { seconds: 0, metres: 0 } : legOf(prev, next, tech);
  return { seconds: a.seconds + b.seconds - bridge.seconds, metres: a.metres + b.metres - bridge.metres };
}

/** Kilometres from a stop to the nearest stop in a list. */
export function nearestKm(stop, list) {
  let best = Infinity, which = null;
  for (const s of list) { const d = haversineKm(stop, s); if (d < best) { best = d; which = s; } }
  return { km: best, stop: which };
}

/** Sequenced day metrics for one tech given a placement. */
export function boardFor(mine, tech, place) {
  const out = {};
  for (const d of DATES) out[d] = metrics(mine.filter(i => (place ? place.get(i.key) : i.from) === d).map(toStop), tech, true);
  return out;
}
export function weekHours(board, tech, days = DATES) { return days.reduce((s, d) => s + effHours(board[d], tech, d), 0); }
export function overtimeH(board, tech, days = DATES) { return days.reduce((s, d) => { const h = effHours(board[d], tech, d); return s + (h > CAP_H ? h - CAP_H : 0); }, 0); }
export function kmTotal(board, days = DATES) { return days.reduce((s, d) => s + (board[d]?.km || 0), 0); }
