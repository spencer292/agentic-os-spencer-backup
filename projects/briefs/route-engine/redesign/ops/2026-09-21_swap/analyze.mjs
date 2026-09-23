#!/usr/bin/env node
// analyze.mjs — offline. Reads live.json + probe-drivers.json + cycle-times-gps.json and writes
// dry-run.json / dry-run.md. No network, no writes to Jobber or OptimoRoute.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const L = JSON.parse(fs.readFileSync(path.join(__dirname, 'live.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'probe-drivers.json'), 'utf8'));
const C = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/cycle-times-gps.json'), 'utf8'));

const DATES = L.window.dates;
const DOWOF = { '2026-09-21': 'mon', '2026-09-22': 'tue', '2026-09-23': 'wed', '2026-09-24': 'thu' };
const TAVIS = 'Tavis Alexander', CORY = 'Cory Ventura', SPENCER = 'Spencer Hill';
const userId = n => (L.users.find(u => u.name === n && u.status === 'ACTIVATED') || {}).id || null;
const IDS = { [TAVIS]: userId(TAVIS), [CORY]: userId(CORY), [SPENCER]: userId(SPENCER) };

// ---------------- cycle time lookup ----------------
const byTechDow = (t, d) => (C.byTechDow.find(r => r.tech === t && r.dow === d) || {}).cycleMinPerStop;
const byTech = t => (C.byTech.find(r => r.tech === t) || {}).cycleMinPerStop;
function rate(tech, dow) {
  const d = byTechDow(tech, dow);
  if (d) return { min: d, basis: `${tech} ${dow} GPS cycle` };
  const a = byTech(tech);
  if (a) return { min: a, basis: `${tech} all-week GPS cycle` };
  return { min: C.globalCycleMinPerStop, basis: 'all-tech median (no GPS row for this tech)' };
}

// ---------------- 1. Jobber picture ----------------
const inWindow = L.visits.filter(v => DATES.includes(v.date));
const outOfWindow = L.visits.filter(v => !DATES.includes(v.date));
const weekend = L.visits.filter(v => { const g = new Date(v.date + 'T12:00:00Z').getUTCDay(); return g === 0 || g === 6; });

const nameSet = v => v.assignees.map(a => a.name).filter(Boolean);
const primary = v => nameSet(v)[0] || null;
const has = (v, n) => nameSet(v).includes(n);

const moving = inWindow.filter(v => has(v, TAVIS) || has(v, CORY));
const tavisV = inWindow.filter(v => has(v, TAVIS));
const coryV = inWindow.filter(v => has(v, CORY));
const spencerV = inWindow.filter(v => has(v, SPENCER));
const unassigned = inWindow.filter(v => v.assignees.length === 0);
const rideAlong = inWindow.filter(v => v.assignees.length > 1);
const completed = inWindow.filter(v => v.isComplete);
const dupVisit = (() => { const m = new Map(); for (const v of inWindow) m.set(v.id, (m.get(v.id) || 0) + 1); return [...m].filter(([, n]) => n > 1); })();
const dupJobDate = (() => {
  const m = new Map();
  for (const v of inWindow) { const k = `${v.jobNumber}|${v.date}`; m.set(k, [...(m.get(k) || []), v.visitNum]); }
  return [...m].filter(([, a]) => a.length > 1).map(([k, a]) => ({ key: k, visits: a }));
})();

// per-day per-tech counts
const perDay = {};
for (const d of DATES) {
  const day = inWindow.filter(v => v.date === d);
  const cnt = {};
  for (const v of day) {
    const key = v.assignees.length === 0 ? '(unassigned)' : nameSet(v).join(' + ');
    cnt[key] = (cnt[key] || 0) + 1;
  }
  perDay[d] = {
    dow: DOWOF[d], totalJobberVisits: day.length,
    tavis: day.filter(v => has(v, TAVIS)).length,
    cory: day.filter(v => has(v, CORY)).length,
    spencer: day.filter(v => has(v, SPENCER)).length,
    unassigned: day.filter(v => v.assignees.length === 0).length,
    complete: day.filter(v => v.isComplete).length,
    byAssigneeList: cnt,
  };
}

// ---------------- 2. the reassignment plan ----------------
// visitEditAssignedUsers REPLACES the whole list. So for each moving visit the new list is the
// old list with the leaving tech swapped for the arriving one, every other assignee kept in place.
// Cory's own visits must be resolved BEFORE Tavis's land on him, or the second pass would sweep
// the first pass's work straight on to Spencer. Order: Cory->Spencer first, then Tavis->Cory.
function plan(from, to) {
  return inWindow.filter(v => has(v, from)).map(v => {
    const oldList = v.assignees.map(a => ({ id: a.id, name: a.name }));
    const newList = oldList.map(a => (a.name === from ? { id: IDS[to], name: to } : a));
    // de-dupe: if `to` was already a ride-along on this visit, the swap would list them twice
    const seen = new Set(); const dedup = [];
    for (const a of newList) { if (seen.has(a.id)) continue; seen.add(a.id); dedup.push(a); }
    return {
      visitId: v.id, visitNum: v.visitNum, jobNumber: v.jobNumber, client: v.clientName,
      city: v.city, zip: v.zip, date: v.date, title: v.title,
      from, to, rideAlong: oldList.length > 1, collapsed: dedup.length !== newList.length,
      currentAssignees: oldList.map(a => a.name),
      newAssignees: dedup.map(a => a.name),
      newAssignedUserIds: dedup.map(a => a.id),
      isComplete: v.isComplete,
    };
  });
}
const passA = plan(CORY, SPENCER);          // runs first
const passB = plan(TAVIS, CORY);            // runs second
const mutations = [...passA, ...passB];

// ---------------- 3. OptimoRoute picture ----------------
const OURS = /^\d+-\d+$/;
const orRoutes = {};
for (const d of DATES) {
  const r = L.routes[d] || {};
  orRoutes[d] = (r.routes || []).map(rt => ({
    driver: rt.driverName,
    stops: (rt.stops || []).length,
    durationMin: rt.duration ?? null,
    distanceKm: rt.distance ?? null,
    startTime: (rt.stops || [])[0]?.scheduledAtDt || (rt.stops || [])[0]?.scheduledAt || null,
    endTime: (rt.stops || []).slice(-1)[0]?.scheduledAtDt || (rt.stops || []).slice(-1)[0]?.scheduledAt || null,
  }));
}
const orderByNo = new Map();
for (const o of L.orders) { const d = o.data || o; orderByNo.set(String(d.orderNo || ''), d); }
const movingOrders = [];
for (const m of mutations) {
  const no = `${m.jobNumber}-${m.visitNum}`;
  const d = orderByNo.get(no);
  movingOrders.push({
    orderNo: no, present: !!d, date: d?.date || null,
    assignedTo: d?.assignedTo?.serial ?? null, duration: d?.duration ?? null,
    wantDriver: m.to, jobberDate: m.date,
  });
}
const missingOrders = movingOrders.filter(o => !o.present);
const orderDateMismatch = movingOrders.filter(o => o.present && o.date !== o.jobberDate);
const foreignOrders = L.orders.map(o => String((o.data || o).orderNo || '')).filter(n => !OURS.test(n));

// ghost stops: an OR stop in the window whose visit is not in the live Jobber window
const jobberKeys = new Set(inWindow.map(v => `${v.jobNumber}-${v.visitNum}`));
const ghostStops = [];
for (const d of DATES) for (const rt of (L.routes[d]?.routes || [])) for (const s of (rt.stops || [])) {
  const no = String(s.orderNo || '');
  if (!OURS.test(no)) continue;
  if (!jobberKeys.has(no)) ghostStops.push({ date: d, driver: rt.driverName, orderNo: no });
}
// and the reverse: a live Jobber visit with no OR order at all
const orderKeys = new Set([...orderByNo.keys()]);
const notInOptimo = inWindow.filter(v => !orderKeys.has(`${v.jobNumber}-${v.visitNum}`));

// ---------------- 4. projected load ----------------
const projected = {};
for (const d of DATES) {
  const dow = DOWOF[d];
  const day = inWindow.filter(v => v.date === d && !v.isComplete);
  const after = new Map();               // driver -> stops after the swap
  for (const v of day) {
    let who = primary(v);
    if (who === CORY) who = SPENCER; else if (who === TAVIS) who = CORY;
    if (!who) who = '(unassigned)';
    after.set(who, (after.get(who) || 0) + 1);
  }
  const before = new Map();
  for (const v of day) { const w = primary(v) || '(unassigned)'; before.set(w, (before.get(w) || 0) + 1); }
  const rows = [];
  for (const [driver, stops] of [...after].sort((a, b) => b[1] - a[1])) {
    // Cory is driving Tavis's ground, so his OWN measured pace is the right rate for him.
    // Spencer has no GPS row at all -> all-tech median, stated.
    const r = rate(driver, dow);
    const h = +(stops * r.min / 60).toFixed(2);
    rows.push({
      driver, stops, beforeStops: before.get(driver) || 0,
      cycleMinPerStop: r.min, rateBasis: r.basis, hours: h,
      over8: h > 8, over95: h > 9.5,
    });
  }
  projected[d] = { dow, rows };
}

// ---------------- 5. freeze ----------------
const nowPT = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
const todayPT = nowPT.slice(0, 10), hourPT = Number(nowPT.slice(11, 13));
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const freeze = DATES.map(d => ({
  date: d,
  writableNow: !(d <= todayPT || (d === addDays(todayPT, 1) && hourPT >= 14)),
  freezesAt: `${addDays(d, -1)} 14:00 PT`,
}));

const spencerOr = P.history.filter(h => h.drivers.some(x => x.driver === SPENCER));

// ---------------- 6. geography of the ground being handed over ----------------
// The swap is a CROSS-TERRITORY move, not a like-for-like cover. Recorded explicitly because the
// cycle-time projection excludes the home commute by definition (cycle = first customer arrival to
// last customer departure), so a tech sent to the far side of the metro looks free in that table.
const geography = {};
for (const d of DATES) {
  const g = {};
  for (const [tech, label] of [[TAVIS, 'tavis->cory'], [CORY, 'cory->spencer']]) {
    const vs = inWindow.filter(v => v.date === d && has(v, tech));
    const c = {};
    for (const v of vs) { const k = (v.city || '?').trim(); c[k] = (c[k] || 0) + 1; }
    g[label] = { from: tech, stops: vs.length, cities: Object.entries(c).sort((a, b) => b[1] - a[1]).map(([city, n]) => `${city} ${n}`) };
  }
  geography[d] = g;
}

const out = {
  generatedAt: new Date().toISOString(), generatedAtPT: nowPT,
  pulledAtPT: L.pulledAtPT,
  window: DATES,
  writeGate: { state: 'CLOSED', file: 'projects/briefs/route-engine/write-authority.json', writesEnabled: false },
  jobber: {
    visitsInWindow: inWindow.length, visitsReturnedOutsideWindow: outOfWindow.length,
    weekendVisits: weekend.length, completedAlready: completed.length,
    unassigned: unassigned.length, rideAlongVisits: rideAlong.length,
    duplicateVisitIds: dupVisit.length, sameJobSameDay: dupJobDate,
    userIds: IDS, perDay,
    tavisTotal: tavisV.length, coryTotal: coryV.length, spencerTotal: spencerV.length,
    movingTotal: moving.length,
  },
  optimoroute: {
    routes: orRoutes,
    ordersInWindow: L.orders.length,
    foreignOrders: foreignOrders.length,
    movingVisitsWithNoOrder: missingOrders.length,
    orderDateDisagreesWithJobber: orderDateMismatch,
    ghostStops, ghostStopCount: ghostStops.length,
    liveVisitsWithNoOrder: notInOptimo.length,
    driverProbe: {
      get_drivers: P.endpoints.get_drivers,
      spencerHillExistsAsDriver: spencerOr.length > 0,
      spencerHillLastRouteDay: spencerOr.length ? spencerOr[spencerOr.length - 1].date : null,
      spencerHillRouteDays: spencerOr.map(h => h.date),
      availabilityReadable: false,
      availabilityNote: 'OptimoRoute exposes no read endpoint for per-date driver availability (get_drivers and get_vehicles both return AUTH_KEY_UNKNOWN on this key; get_drivers_parameters is 404). Enabled/disabled state for 09-21..24 is therefore UNVERIFIED and the live run must set it explicitly.',
    },
  },
  freeze, freezeRule: 'jobber-to-optimo-sync emailCutoffOk(): a date is frozen once it is today or past, and tomorrow freezes at 14:00 PT today. It is a clock rule — it does not check whether notifications actually went out.',
  plan: { passA_coryToSpencer: passA, passB_tavisToCory: passB, mutationCount: mutations.length },
  projectedLoad: projected,
  geography,
  loadCaveat: 'cycleMinPerStop is first-customer-arrival to last-customer-departure divided by visits. The home commute at each end is NOT in it. Both receiving techs are being sent to ground they do not normally drive, so add their commute separately before reading any hours figure as a working day.',
  spencerSensitivity: DATES.map(d => {
    const r = projected[d].rows.find(x => x.driver === SPENCER);
    if (!r) return null;
    const coryRate = byTechDow(CORY, DOWOF[d]);
    return { date: d, stops: r.stops, atAllTechMedian: r.hours, atCorysOwnRateForThisGround: +(r.stops * coryRate / 60).toFixed(2) };
  }).filter(Boolean),
  rideAlongDetail: rideAlong.map(v => ({
    visitNum: v.visitNum, jobNumber: v.jobNumber, client: v.clientName, date: v.date,
    current: nameSet(v),
    wouldBecome: (mutations.find(m => m.visitId === v.id) || {}).newAssignees || null,
  })),
};
fs.writeFileSync(path.join(__dirname, 'dry-run.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({
  perDay, mutationCount: mutations.length, passA: passA.length, passB: passB.length,
  rideAlong: rideAlong.length, unassigned: unassigned.length, completed: completed.length,
  ghost: ghostStops.length, noOrder: notInOptimo.length, missingOrders: missingOrders.length,
  orderDateMismatch: orderDateMismatch.length, weekend: weekend.length,
  dupJobDate: dupJobDate.length, projected,
  freeze, spencerOr: out.optimoroute.driverProbe.spencerHillLastRouteDay,
}, null, 1));
