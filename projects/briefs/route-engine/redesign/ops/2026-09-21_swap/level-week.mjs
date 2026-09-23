#!/usr/bin/env node
/**
 * level-week.mjs — READ-ONLY. LAYER 1 of the proposal for 2026-09-21..2026-09-25.
 *
 * A visit never changes tech. Within one tech, visits move between the weekdays of that one week
 * so the tech's days come out even, compact and under the 9 hour cap.
 *
 * It also reports an ISLAND HANDOFF list: stops sitting inside another technician's settled ground.
 * That list is an APPROVAL LIST, not part of the plan — every one of them would change technician,
 * and nothing changes technician without Spencer's yes. The costed, clustered version of the same
 * idea is layer 2 (edge-shift.mjs).
 *
 * Nothing here talks to Jobber or OptimoRoute. It reads week-live.json (pulled by pull-week.mjs)
 * and the offline route-engine data, and writes leveled-plan.json and leveled-plan.md.
 *
 * The cost model, the sequencer and the day-levelling solver all live in week-model.mjs, shared
 * with layer 2 so the two layers' numbers are comparable.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  SWAP, REDESIGN, DATES, DOW, LABEL, CAP_H, dayIdx, round, addDays,
  HOME, ONSITE, SPENCER_HOME, cyc, cycleFor, haversineKm,
  metrics, effHours, summarize, toStop, buildBoard, levelTech, boardFor,
  insertionCost, removalSaving, nearestKm,
} from './week-model.mjs';

const LOG = path.join(SWAP, 'level-week.log');
fs.writeFileSync(LOG, '');
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n'); };

// Which weekdays each tech may hold work on this week.
//   Tavis is out Mon-Thu and his Friday is frozen by instruction.
//   Spencer is covering Cory's Mon-Thu because of the swap. Friday is the day Tavis is back, so
//   nothing moves ONTO Spencer's Friday; his two visits there may move into Mon-Thu.
//   Courtney is a staging profile, not a technician — excluded and reported.
const WORKDAYS = {
  'Alias Franks': DATES.slice(),
  'Cory Ventura': DATES.slice(),
  'Luke LaVergne': DATES.slice(),
  'Robert Norton': DATES.slice(),
  'Spencer Hill': DATES.slice(0, 4),
  'Tavis Alexander': [],
};
const workdaysOf = t => WORKDAYS[t] || [];

log(`=== LEVEL WEEK (layer 1) ${new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' })} PT ===`);
const { week, items, dupRows } = buildBoard(workdaysOf);
const techs = [...new Set(items.map(i => i.tech))].sort();
log(`board pulled ${week.pulledAt}`);
log(`${week.visits.length} rows pulled, ${dupRows.length} duplicate row(s) dropped, ${items.length} visits, ${techs.length} names on the board`);

const plan = {}, moves = [], flags = [], perTech = [];
const placeAll = new Map(items.map(i => [i.key, i.from]));

// Pre-existing double bookings: two visits of one job already on one day. Not created here, and
// not unwound here either — reported so Spencer can decide.
{
  const pairs = new Map();
  for (const it of items) { const k = `${it.job}|${it.from}`; if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(it); }
  const dbl = [...pairs.values()].filter(a => a.length > 1);
  if (dbl.length) flags.push({ type: 'already-double-booked', count: dbl.length, rows: dbl.map(a => ({ job: a[0].job, client: a[0].client, day: a[0].from, tech: a[0].tech, visits: a.length })), note: 'Two visits of the same job are already booked on the same day. The plan leaves them alone.' });
  log(`pre-existing same-job-same-day pairs: ${dbl.length}\n`);
}

for (const tech of techs) {
  const mine = items.filter(i => i.tech === tech);
  const wd = workdaysOf(tech);
  const hasHome = !!HOME[tech];
  const before = hasHome ? boardFor(mine, tech, null)
    : Object.fromEntries(DATES.map(d => [d, { stops: mine.filter(i => i.from === d).length, routeH: 0, paidH: 0, km: 0, serviceMin: 0, travelMin: 0, commuteMin: 0, order: [] }]));

  if (!wd.length) {
    plan[tech] = { workdays: [], frozen: true, noHome: !hasHome, before: Object.fromEntries(DATES.map(d => [d, summarize(before[d], tech, d)])), after: null, moved: 0 };
    plan[tech].after = plan[tech].before;
    if (hasHome) for (const d of DATES) { const eh = effHours(before[d], tech, d); if (eh > CAP_H) flags.push({ type: 'over-cap-frozen', tech, day: d, hours: round(eh), stops: before[d].stops, note: `${tech.trim()} is frozen this week, so nothing can be moved off this day.` }); }
    else flags.push({ type: 'not-a-technician', tech, count: mine.length, days: [...new Set(mine.map(i => i.from))].sort(), note: `${mine.length} visits sit on "${tech.trim()}", a staging profile rather than a technician with a truck. Left exactly as booked; they still need a real technician before Monday.` });
    for (const it of mine) if (it.overdue) flags.push({ type: 'past-window', tech, visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, lastVisit: it.last, window: `${it.window.from}..${it.window.to}`, placed: it.from, pinned: true, note: 'Past its window and on a frozen technician, so it stays where it is.' });
    perTech.push({ tech, frozen: true, visits: mine.length, moved: 0 });
    log(`${tech.trim()}: FROZEN (${mine.length} visits)${hasHome ? '' : ' — no home on file, stop counts only'}`);
    continue;
  }

  const movable = mine.filter(i => !i.datePinned && i.allowed.filter(d => wd.includes(d)).length > 1);
  log(`${tech}: ${mine.length} visits, ${movable.length} movable, workdays ${wd.map(d => DOW[d]).join('/')}`);
  const res = levelTech({ mine, tech, workdays: wd, log });
  if (res.capUnreachable) log(`  cap unreachable — no day left with room under ${CAP_H} h`);
  if (res.repairs) log(`  capacity repair on sequenced hours: ${res.repairs} further moves`);
  for (const [k, d] of res.place) placeAll.set(k, d);

  const after = boardFor(mine, tech, res.place);
  const moved = mine.filter(i => res.place.get(i.key) !== i.from);
  for (const it of moved) {
    const to = res.place.get(it.key);
    const fromH = round(effHours(before[it.from], tech, it.from));
    let reason = effHours(before[it.from], tech, it.from) > CAP_H
      ? `${LABEL[it.from]} was ${fromH} h, over the 9 h cap — moved to ${LABEL[to]}`
      : `levelling ${tech.split(' ')[0]}'s week — ${LABEL[it.from]} was ${fromH} h, ${LABEL[to]} is the lighter day this stop fits`;
    if (it.overdue) reason += dayIdx(to) > dayIdx(it.from)
      ? `; already past its ${it.window.from} to ${it.window.to} window and this pushes it later still, which only happened because ${LABEL[it.from]} had no room`
      : `; already past its ${it.window.from} to ${it.window.to} window, so it goes as early as capacity allows`;
    else if (it.window?.from) reason += `; inside its ${it.window.from} to ${it.window.to} window`;
    moves.push({ visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, zip: it.zip, tech, fromDay: it.from, toDay: to, startTime: it.startTime, product: it.product, lastVisit: it.last, window: it.window, overdue: !!it.overdue, reason });
  }

  plan[tech] = {
    workdays: wd, frozen: false,
    before: Object.fromEntries(DATES.map(d => [d, summarize(before[d], tech, d)])),
    after: Object.fromEntries(DATES.map(d => [d, summarize(after[d], tech, d)])),
    moved: moved.length,
  };
  perTech.push({ tech, visits: mine.length, movable: movable.length, pinned: mine.length - movable.length, moved: moved.length, ...res, place: undefined });

  const weekH = wd.reduce((s, d) => s + effHours(after[d], tech, d), 0);
  const roomH = wd.length * CAP_H;
  for (const d of wd) {
    const eh = effHours(after[d], tech, d);
    if (eh > CAP_H) flags.push({
      type: 'over-cap-after', tech, day: d, hours: round(eh), stops: after[d].stops,
      note: weekH > roomH
        ? `${tech}'s whole week is ${round(weekH)} h against ${roomH} h of room across ${wd.length} days under the cap. Moving days around cannot fix this — ${round(weekH - roomH)} h has to come off him or the cap has to give.`
        : `No legal day left with room: the remaining stops here are pinned, or their cadence window does not reach a lighter day.`,
    });
  }
  if (weekH > roomH) flags.push({ type: 'week-does-not-fit', tech, weekHours: round(weekH), roomHours: roomH, excessHours: round(weekH - roomH), visits: mine.length, note: `At ${mine.length} visits and this tech's measured pace, the week needs ${round(weekH)} h of door-to-door time. ${wd.length} days under the ${CAP_H} h cap hold ${roomH} h.` });
  for (const it of mine) if (it.overdue) flags.push({ type: 'past-window', tech, visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, lastVisit: it.last, window: `${it.window.from}..${it.window.to}`, placed: res.place.get(it.key), pinned: !!it.datePinned, note: it.datePinned ? `Past its window, but pinned (${it.pinReason}) so it stays where it is.` : 'Its window closed before Monday. Placed as early as capacity allows.' });
  const stuck = mine.filter(i => i.datePinned && !i.isComplete && effHours(before[i.from], tech, i.from) > CAP_H);
  if (stuck.length) flags.push({ type: 'pinned-on-heavy-day', tech, count: stuck.length, note: `${stuck.length} visits could not be considered for a move.`, examples: stuck.slice(0, 6).map(i => ({ orderNo: i.orderNo, client: i.client, day: i.from, why: i.pinReason })) });

  const hB = wd.map(d => effHours(before[d], tech, d)), hA = wd.map(d => effHours(after[d], tech, d));
  log(`  before ${hB.map(h => h.toFixed(1)).join(' ')}  ->  after ${hA.map(h => h.toFixed(1)).join(' ')}   spread ${(Math.max(...hB) - Math.min(...hB)).toFixed(1)} -> ${(Math.max(...hA) - Math.min(...hA)).toFixed(1)}   moves ${moved.length}\n`);
}

// ---------------------------------------------------------------- totals
function otHours(p, which) { let t = 0; for (const d of DATES) { const h = p[which][d]?.capacityHours ?? 0; if (h > CAP_H) t += h - CAP_H; } return t; }
const totals = { overtimeBefore: 0, overtimeAfter: 0, moves: moves.length };
for (const tech of Object.keys(plan)) {
  const p = plan[tech];
  p.overtimeBefore = round(otHours(p, 'before'));
  p.overtimeAfter = round(otHours(p, 'after'));
  totals.overtimeBefore += p.overtimeBefore;
  totals.overtimeAfter += p.overtimeAfter;
}
totals.overtimeBefore = round(totals.overtimeBefore);
totals.overtimeAfter = round(totals.overtimeAfter);
totals.headroom = [];
for (const tech of Object.keys(plan)) {
  const p = plan[tech];
  if (p.frozen) continue;
  let room = 0;
  for (const d of workdaysOf(tech)) { const h = p.after[d]?.capacityHours ?? 0; if (h < CAP_H) room += CAP_H - h; }
  if (room > 0.5) totals.headroom.push({ tech, spareHours: round(room) });
}
totals.headroom.sort((a, b) => b.spareHours - a.spareHours);
totals.spareHoursTotal = round(totals.headroom.reduce((s, x) => s + x.spareHours, 0));

// ================================================================ ISLAND HANDOFF
// A stop sitting inside another technician's SETTLED ground. Settled means the zip's dominant tech
// holds at least 80% of that zip's completed visits in the 2026-08-14..09-17 window AND the zip is
// not one of the five contested seams in seam-pack.json — a contested zip is not somebody's ground,
// it is an open question, and handing work across it would be answering that question by accident.
//
// The swap is taken into account: Mon-Thu, Cory's ground is Spencer's and Tavis's ground is Cory's.
// On Friday everyone is back on their own.
const territory = JSON.parse(fs.readFileSync(path.join(REDESIGN, 'data', 'territory-asbuilt.json'), 'utf8'));
const seamPack = JSON.parse(fs.readFileSync(path.join(REDESIGN, 'data', 'seam-pack.json'), 'utf8'));
const SETTLED_SHARE = 0.8;
const contestedZips = new Set();
for (const s of seamPack.seams || []) for (const z of s.zips || []) contestedZips.add(String(z));
const zipInfo = new Map(territory.zips.map(z => [String(z.zip), z]));
const SWAP_OWNER = { 'Tavis Alexander': 'Cory Ventura', 'Cory Ventura': 'Spencer Hill' };
const ownerFor = (zip, day) => {
  const z = zipInfo.get(String(zip));
  if (!z || z.techShare < SETTLED_SHARE || contestedZips.has(String(zip))) return null;
  const base = z.dominantTech;
  const eff = day !== DATES[4] && SWAP_OWNER[base] ? SWAP_OWNER[base] : base;
  return { base, eff, zip: z.zip, city: z.city, share: z.techShare, dominantWeekday: z.dominantWeekday };
};

// the post-layer-1 board, per tech per day, sequenced — the baseline every handoff is costed against
const boards = {};
for (const tech of techs) {
  const mine = items.filter(i => i.tech === tech);
  boards[tech] = {};
  for (const d of DATES) boards[tech][d] = metrics(mine.filter(i => placeAll.get(i.key) === d).map(toStop), tech, true);
}
const jobDayAll = new Map();
for (const it of items) { const k = `${it.job}|${placeAll.get(it.key)}`; jobDayAll.set(k, (jobDayAll.get(k) || 0) + 1); }

const islands = [];
for (const it of items) {
  if (it.isComplete || it.lat == null) continue;
  const day = placeAll.get(it.key);
  const o = ownerFor(it.zip, day);
  if (!o || o.eff === it.tech) continue;
  if (!HOME[o.eff] || !HOME[it.tech]) continue;
  const ownerDays = workdaysOf(o.eff);
  if (!ownerDays.length) continue;                       // owner is frozen this week (Tavis)

  // what lifting it off its current route saves
  const curOrder = boards[it.tech][day].order;
  const idx = curOrder.findIndex(s => s.key === it.key);
  const save = idx >= 0 ? removalSaving(curOrder, it.tech, idx) : { seconds: 0, metres: 0 };
  const saveMin = save.seconds / 60 + (ONSITE[it.tech] ?? cyc.globalOnSiteMinPerStop);

  // the owner's cheapest day for it: inside the visit's cadence window, no job clash, day has room
  let best = null;
  for (const d of ownerDays) {
    if (it.datePinned && d !== day) continue;            // its date is fixed, so only that day counts
    if (!it.datePinned && it.window?.from && !it.overdue && (d < it.window.from || d > it.window.to)) continue;
    if ((jobDayAll.get(`${it.job}|${d}`) || 0) > 0) continue;
    const ob = boards[o.eff][d];
    const ins = insertionCost(ob.order, o.eff, it);
    if (!ins) continue;
    const insMin = ins.seconds / 60 + (ONSITE[o.eff] ?? cyc.globalOnSiteMinPerStop);
    const near = nearestKm(it, ob.order);
    const newH = effHours({ ...ob, stops: ob.stops + 1, routeH: ob.routeH + insMin / 60, commuteMin: ob.commuteMin }, o.eff, d);
    const cand = { day: d, insertionKm: round(ins.metres / 1000), insertionMin: round(insMin), nearestStopKm: round(near.km), ownerHoursBefore: round(effHours(ob, o.eff, d)), ownerHoursAfter: round(newH), roomLeft: round(CAP_H - newH) };
    if (!best || ins.metres < best._m) { best = { ...cand, _m: ins.metres }; }
  }
  if (!best) continue;
  const curH = effHours(boards[it.tech][day], it.tech, day);
  islands.push({
    visitId: it.id, orderNo: it.orderNo, job: it.job, client: it.client, city: it.city, zip: it.zip,
    currentTech: it.tech, currentDay: day, datePinned: !!it.datePinned,
    groundOwner: o.base, ownerThisWeek: o.eff, zipShare: o.share,
    ownerSwapNote: o.base !== o.eff ? `${o.base}'s ground, run by ${o.eff} Mon-Thu because of the swap` : null,
    ownerNearestDay: best.day, ownerNearestDayLabel: LABEL[best.day],
    kmFromOwnerRoute: best.nearestStopKm,
    insertionKm: best.insertionKm, insertionMin: best.insertionMin,
    removalKm: round(save.metres / 1000), removalMin: round(saveMin),
    kmSaved: round(save.metres / 1000 - best.insertionKm),
    currentTechHours: round(curH), currentTechHoursAfter: round(curH - saveMin / 60),
    ownerHoursBefore: best.ownerHoursBefore, ownerHoursAfter: best.ownerHoursAfter, ownerRoomLeft: best.roomLeft,
    ownerStaysUnderCap: best.ownerHoursAfter <= CAP_H,
  });
}
islands.sort((a, b) => b.kmSaved - a.kmSaved);
const islandsWorth = islands.filter(i => i.kmSaved > 0 && i.ownerStaysUnderCap);
const islandTotals = {
  candidates: islands.length,
  worthTaking: islandsWorth.length,
  kmSavedIfAllAccepted: round(islandsWorth.reduce((s, i) => s + i.kmSaved, 0)),
  hoursOffDonors: round(islandsWorth.reduce((s, i) => s + (i.removalMin / 60), 0)),
  hoursOntoOwners: round(islandsWorth.reduce((s, i) => s + (i.insertionMin / 60), 0)),
  note: 'Marginal, one stop at a time, against the layer 1 board. Accepting several in the same place saves more than the sum of the singles, because they share the detour — layer 2 costs them as blocks.',
};
log(`islands: ${islands.length} candidates, ${islandsWorth.length} save km and keep the owner under the cap (${islandTotals.kmSavedIfAllAccepted} km)`);

// ---------------------------------------------------------------- write JSON
const calib = [];
for (const d of DATES) for (const rt of (week.routes[d] || [])) {
  const p = plan[rt.driver];
  if (!p || !p.before[d]?.stops) continue;
  calib.push({ date: d, driver: rt.driver, optimoStops: rt.stops.length, optimoMin: rt.duration, modelStops: p.before[d].stops, modelMin: round(p.before[d].routeHours * 60) });
}
const out = {
  generatedAt: new Date().toISOString(), layer: 1, week: DATES, cap: CAP_H,
  assumptions: {
    spencerStart: 'ASSUMED — 718 Griffin Ave area, Enumclaw 98022. Spencer has no GPS tracker.',
    homes: Object.fromEntries(Object.entries(HOME).map(([k, v]) => [k, `${v.street || 'assumed'} ${v.city || ''} ${v.zip || ''}`.trim()])),
    onSiteMinPerStop: ONSITE,
    onSiteNote: 'Per-tech median vehicle-GPS dwell at a customer stop, 2026-08-17..09-17. Spencer has no tracker, so he gets the all-tech median.',
    travelModel: 'redesign/data/travel-model.json — observed OptimoRoute legs for pairs ever driven, per-driver haversine fit otherwise. Spencer falls back to the ALL-driver fit.',
    hours: 'route hours = home to sequenced stops to home. paid span = first stop to last stop (paid time tracks first-job-to-last-job, so the commute is unpaid). capacity hours = the worse of route hours and (stops x measured GPS cycle minutes + commute).',
    workdays: 'Tavis: Friday only, frozen. Spencer: Mon-Thu — nothing moves onto his Friday. Everyone else Mon-Fri.',
    islandGround: `Settled ground = the zip's dominant tech holds at least ${SETTLED_SHARE * 100}% of its completed visits in 2026-08-14..09-17 and the zip is not one of the five contested seams in seam-pack.json.`,
    dataCut: 'Jobber board pulled live. Product, activity flags and coordinates come from the 2026-09-18 jobs snapshot; last-completed dates are topped up live through 2026-09-18.',
  },
  totals, perTech, plan, moves, flags, calibration: calib,
  islandHandoff: { totals: islandTotals, candidates: islands },
};
fs.writeFileSync(path.join(SWAP, 'leveled-plan.json'), JSON.stringify(out, null, 1));
log(`\nTOTALS  moves ${totals.moves}   overtime ${totals.overtimeBefore} h -> ${totals.overtimeAfter} h   flags ${flags.length}`);
log('wrote leveled-plan.json');

// ---------------------------------------------------------------- write markdown
const NAME = t => String(t).trim();
const L = [];
L.push(`# Leveled week, 21 to 25 September — proposal only`);
L.push(``);
L.push(`Nothing has been changed. This is a proposal for the week of **Monday 21 to Friday 25 September 2026**, built from the live Jobber board pulled on ${new Date(week.pulledAt).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' })} Pacific.`);
L.push(``);
L.push(`In this layer every visit keeps the technician it is on now. The only thing that changes is which weekday it falls on. Moving work between technicians is the next layer, and none of it happens without your yes.`);
L.push(``);
L.push(`**Headline**`);
L.push(``);
L.push(`| | Before | After |`);
L.push(`|---|---|---|`);
L.push(`| Hours over the 9 hour cap, all techs | ${totals.overtimeBefore} | ${totals.overtimeAfter} |`);
L.push(`| Visits moved | | ${totals.moves} |`);
L.push(``);
L.push(`**Read this first.** Three things this layer cannot fix on its own:`);
L.push(``);
L.push(`1. **Tavis's Friday is a ${plan['Tavis Alexander']?.after[DATES[4]]?.capacityHours} hour day.** He holds ${plan['Tavis Alexander']?.after[DATES[4]]?.stops} stops on 25 September and you told me not to move them, so nothing was moved. That single day is ${plan['Tavis Alexander']?.overtimeAfter} of the ${totals.overtimeAfter} hours still over the cap.`);
L.push(`2. **Alias and Luke have more work than five days can hold.** Their days come out flat and even, but every one lands near the cap because the week itself is too big. Fixing it means taking work off them, which is layer 2.`);
L.push(`3. **${flags.filter(f => f.type === 'past-window').length} visits are already past their five to nine day window** before the week even starts. They are placed as early as capacity allows, but they were late before this plan touched them.`);
L.push(``);
for (const tech of Object.keys(plan).sort()) {
  const p = plan[tech];
  L.push(`## ${NAME(tech)}${p.frozen ? ' — frozen, nothing proposed' : ''}`);
  L.push(``);
  L.push(`| Day | Stops before | Stops after | Hours before | Hours after | Paid span after | Km after |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const d of DATES) {
    const b = p.before[d], a = p.after[d];
    if (!b.stops && !a.stops) continue;
    L.push(`| ${LABEL[d]} | ${b.stops} | ${a.stops} | ${b.capacityHours} | ${a.capacityHours}${a.capacityHours > CAP_H ? ' over' : ''} | ${a.paidSpanHours} | ${a.km} |`);
  }
  L.push(``);
  L.push(`Hours over the cap: **${p.overtimeBefore} before, ${p.overtimeAfter} after**. Visits moved: **${p.moved}**.`);
  L.push(``);
}
L.push(`## The day moves`);
L.push(``);
if (!moves.length) L.push(`None.`);
for (const tech of Object.keys(plan).sort()) {
  const mv = moves.filter(m => m.tech === tech);
  if (!mv.length) continue;
  L.push(`### ${NAME(tech)} — ${mv.length} visits`);
  L.push(``);
  const byPair = {};
  for (const m of mv) { const k = `${m.fromDay}>${m.toDay}`; (byPair[k] = byPair[k] || []).push(m); }
  for (const k of Object.keys(byPair).sort()) {
    const [f, t] = k.split('>');
    L.push(`**${LABEL[f]} to ${LABEL[t]}** — ${byPair[k].length} visits`);
    L.push(``);
    L.push(`| Job | Client | City | Visit id | Note |`);
    L.push(`|---|---|---|---|---|`);
    for (const m of byPair[k]) L.push(`| ${m.job} | ${String(m.client || '').replace(/\|/g, '/')} | ${m.city || ''} | ${m.orderNo} | ${m.overdue ? 'past its window' : (m.window?.from ? `window ${m.window.from} to ${m.window.to}` : 'no cadence constraint')} |`);
    L.push(``);
  }
}

// ---- island handoff
L.push(`## Island handoff — approval list, nothing moves without your yes`);
L.push(``);
L.push(`These are stops sitting inside another technician's settled ground. Settled means that technician has run at least ${SETTLED_SHARE * 100}% of that postcode's work over the last five weeks, and the postcode is not one of the five ownership questions still open. Every line below would change technician, so none of it is in the plan above.`);
L.push(``);
L.push(`Where the swap applies, the owner named is who actually runs that ground this week: Monday to Thursday, Cory's ground is Spencer's and Tavis's ground is Cory's.`);
L.push(``);
L.push(`| | |`);
L.push(`|---|---|`);
L.push(`| Stops inside someone else's settled ground | ${islandTotals.candidates} |`);
L.push(`| Of those, worth handing over (saves driving, owner stays under 9 h) | ${islandTotals.worthTaking} |`);
L.push(`| Kilometres saved if you accept all of them | ${islandTotals.kmSavedIfAllAccepted} |`);
L.push(`| Hours off the technicians handing over | ${islandTotals.hoursOffDonors} |`);
L.push(`| Hours onto the technicians taking over | ${islandTotals.hoursOntoOwners} |`);
L.push(``);
if (islandsWorth.length) {
  L.push(`### Worth taking`);
  L.push(``);
  L.push(`| Client | City | Zip | Now on | Day | Ground owner | Owner's nearest day | Km from that route | Km saved | Donor hours | Owner hours |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const i of islandsWorth) {
    L.push(`| ${String(i.client || '').replace(/\|/g, '/')} | ${i.city || ''} | ${i.zip || ''} | ${NAME(i.currentTech)} | ${LABEL[i.currentDay]} | ${NAME(i.ownerThisWeek)}${i.ownerSwapNote ? ` (${NAME(i.groundOwner)}'s ground)` : ''} | ${i.ownerNearestDayLabel} | ${i.kmFromOwnerRoute} | ${i.kmSaved} | ${i.currentTechHours} to ${i.currentTechHoursAfter} | ${i.ownerHoursBefore} to ${i.ownerHoursAfter} |`);
  }
  L.push(``);
}
const islandsNot = islands.filter(i => !(i.kmSaved > 0 && i.ownerStaysUnderCap));
if (islandsNot.length) {
  L.push(`### Not worth taking, listed so you can see they were considered`);
  L.push(``);
  L.push(`| Client | City | Zip | Now on | Ground owner | Km saved | Why not |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const i of islandsNot) L.push(`| ${String(i.client || '').replace(/\|/g, '/')} | ${i.city || ''} | ${i.zip || ''} | ${NAME(i.currentTech)} | ${NAME(i.ownerThisWeek)} | ${i.kmSaved} | ${!i.ownerStaysUnderCap ? `would put ${NAME(i.ownerThisWeek)} at ${i.ownerHoursAfter} h` : 'the detour costs more than it saves'} |`);
  L.push(``);
}
L.push(`These figures are one stop at a time against the levelled board. Accepting several in the same place saves more than the sum of the singles, because they share the detour. Layer 2 costs them as blocks.`);
L.push(``);

// ---- flags
L.push(`## Flags`);
L.push(``);
const byType = {};
for (const f of flags) (byType[f.type] = byType[f.type] || []).push(f);
const TITLES = {
  'week-does-not-fit': 'Technicians whose week does not fit in five days under the cap',
  'over-cap-after': 'Days still over 9 hours after the plan',
  'over-cap-frozen': 'Days over 9 hours on a frozen technician',
  'past-window': 'Visits already past their 5 to 9 day window',
  'pinned-on-heavy-day': 'Visits that could not be moved',
  'not-a-technician': 'Visits parked on a profile that is not a technician',
  'already-double-booked': 'Jobs already holding two visits on one day',
};
for (const t of Object.keys(byType)) {
  L.push(`### ${TITLES[t] || t}`);
  L.push(``);
  if (t === 'past-window') {
    L.push(`| Tech | Job | Client | City | Last visit | Window | Placed |`);
    L.push(`|---|---|---|---|---|---|---|`);
    for (const f of byType[t]) L.push(`| ${NAME(f.tech)} | ${f.job} | ${String(f.client || '').replace(/\|/g, '/')} | ${f.city || ''} | ${f.lastVisit} | ${f.window} | ${LABEL[f.placed]} |`);
  } else if (t === 'pinned-on-heavy-day') {
    for (const f of byType[t]) L.push(`- **${NAME(f.tech)}** — ${f.count} visits on a day that is over the cap cannot move. Reasons include: ${[...new Set(f.examples.map(e => e.why))].join('; ')}.`);
  } else if (t === 'week-does-not-fit') {
    for (const f of byType[t]) L.push(`- **${NAME(f.tech)}** — ${f.visits} visits need about ${f.weekHours} hours of door-to-door time this week. Five days under the cap hold ${f.roomHours}. That is ${f.excessHours} hours too much, and no amount of moving days can absorb it.`);
    L.push(``);
    L.push(`Nothing could be taken off them in this layer, because a visit never changes technician here. There is spare capacity elsewhere: ${totals.headroom.map(h => `${NAME(h.tech)} ${h.spareHours} h`).join(', ')}, ${totals.spareHoursTotal} hours in all against the ${round(byType[t].reduce((s, f) => s + f.excessHours, 0))} hours that do not fit. Layer 2 spends it.`);
  } else if (t === 'over-cap-after') {
    const g = {};
    for (const f of byType[t]) (g[f.tech] = g[f.tech] || []).push(f);
    for (const tech of Object.keys(g)) {
      const rows = g[tech].sort((a, b) => dayIdx(a.day) - dayIdx(b.day));
      L.push(`- **${NAME(tech)}** — ${rows.map(f => `${LABEL[f.day]} ${f.hours} h on ${f.stops} stops`).join(', ')}. ${rows[0].note}`);
    }
  } else if (t === 'already-double-booked') {
    for (const f of byType[t]) { L.push(`${f.note}`); L.push(``); for (const r of f.rows) L.push(`- Job ${r.job}, ${r.client}, ${NAME(r.tech)}, ${LABEL[r.day]} — ${r.visits} visits.`); }
  } else if (t === 'not-a-technician') {
    for (const f of byType[t]) L.push(`- **${NAME(f.tech)}** — ${f.count} visits on ${f.days.join(', ')}. ${f.note}`);
  } else {
    for (const f of byType[t]) L.push(`- **${NAME(f.tech)}, ${LABEL[f.day]}** — ${f.hours} hours across ${f.stops} stops. ${f.note}`);
  }
  L.push(``);
}
L.push(`## What the numbers mean`);
L.push(``);
L.push(`- **Hours** is the technician's whole day: leave home, drive the stops in the best order, drive home. It is the larger of two estimates, so it leans pessimistic. The first adds modelled driving to the technician's own measured time on each property. The second takes that technician's measured minutes per visit on that weekday, from the truck trackers, and multiplies by the number of stops, which sweeps in the breaks and fuel stops the first cannot see.`);
L.push(`- **Paid span** is first stop to last stop. The tracker study found paid time tracks that span, not the commute, so this is the closer match to what Gusto pays.`);
L.push(`- **Spencer's start point is an assumption.** He has no truck tracker, so the plan starts and ends his day at the Griffin Avenue area in Enumclaw and gives him the all-technician average time on site.`);
L.push(`- **Tavis is frozen.** He is out Monday to Thursday and works Friday exactly as booked, so none of his Friday work was considered.`);
L.push(`- **Spencer works Monday to Thursday.** Friday is the day Tavis is back, so nothing was moved onto Spencer's Friday; the two visits he holds that day were allowed to move into Monday to Thursday.`);
L.push(`- Four visits sit on a profile called Courtney, a staging bucket rather than a technician. They were left alone.`);
L.push(``);
fs.writeFileSync(path.join(SWAP, 'leveled-plan.md'), L.join('\n'));
log('wrote leveled-plan.md');
