#!/usr/bin/env node
// gps-ground-truth.mjs - S2c. Vehicle GPS as the true record of a route-day.
//
// Inputs (all offline):
//   private/gps/_trackers.json                          6 trackers (imei -> truck name)
//   private/gps/trips_2026-08-17_2026-09-17.json        1,126 trips (engine-off to engine-off)
//   private/gps/stops_2026-08-17_2026-09-17.json        3,637 stops ('Engine Off' | 'Idling')
//   data/jobber/jobs.json                               job -> property lat/lng, client
//   data/jobber/visits.json                             completed visits with tech + lat/lng
//   ../data/completed-visits_2026-08-17_2026-09-17.json tech/completedAt/job (cross-check)
//   data/plan-vs-actual.json                            planned + stamp-derived per route-day
//   data/route-day-ledger.json (or private/gusto/paid-hours.json)  paid hours per tech per date
//   ../data/route-day-drive_2026-08-17_2026-09-17.json  stamp-derived cycle times (comparison)
//
// Outputs:
//   data/gps-ground-truth.json
//   data/cycle-times-gps.json
//
// Only Tavis's truck ('2022 Ranger') turns the engine off at customers; the other four idle
// through their stops, so TRIPS do not split at a visit. STOPS are therefore the visit record and
// drive time is derived from the gaps BETWEEN stops, never from trip durations (which swallow the
// idling stops that happen inside them).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REDESIGN = path.resolve(HERE, '..');
const ROOT = path.resolve(REDESIGN, '..');
const DATA = path.join(REDESIGN, 'data');
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const exists = f => fs.existsSync(f);

const WIN_FROM = '2026-08-17';
const WIN_TO = '2026-09-17';
const TZ_OFF = 7 * 3600000;                       // PDT, UTC-7 for the whole window
const dateOf = ms => new Date(ms - TZ_OFF).toISOString().slice(0, 10);
const hhmm = ms => new Date(ms - TZ_OFF).toISOString().slice(11, 16);
const minOfDay = ms => { const d = new Date(ms - TZ_OFF); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; };
const DOWS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dowOf = dstr => DOWS[new Date(dstr + 'T12:00:00Z').getUTCDay()];
const weekOf = dstr => {                           // Monday-anchored week key
  const d = new Date(dstr + 'T12:00:00Z');
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
};

const CUSTOMER_RADIUS_M = 150;
const HOME_RADIUS_M = 300;
const MERGE_GAP_MIN = 4;        // adjacent stops at the same place inside this gap are one dwell
const MERGE_DIST_M = 120;
const IDLE_DROP_MIN = 2;        // idling under 2 min is traffic
const MAX_CUSTOMER_MIN = 120;   // a dwell longer than this is the truck PARKED, not a mole check
                                // (the longest real job on the board is the 11-job Barbee Mill
                                //  cluster, directed at 120 min for the whole place)

const hav = (aLat, aLng, bLat, bLng) => {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (bLat - aLat) * t, dLng = (bLng - aLng) * t;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * t) * Math.cos(bLat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) / 2; return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2; };
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))]; };
const r1 = n => n == null || !isFinite(n) ? null : +n.toFixed(1);
const r2 = n => n == null || !isFinite(n) ? null : +n.toFixed(2);
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ---------------------------------------------------------------- load
const trackers = rd(path.join(REDESIGN, 'private/gps/_trackers.json'));
const tripsRaw = rd(path.join(REDESIGN, 'private/gps/trips_2026-08-17_2026-09-17.json'));
const stopsRaw = rd(path.join(REDESIGN, 'private/gps/stops_2026-08-17_2026-09-17.json'));
const jobs = rd(path.join(DATA, 'jobber/jobs.json'));
const visits = rd(path.join(DATA, 'jobber/visits.json'));
const completed = rd(path.join(ROOT, 'data/completed-visits_2026-08-17_2026-09-17.json'));
const pva = rd(path.join(DATA, 'plan-vs-actual.json'));
const driveStamp = rd(path.join(ROOT, 'data/route-day-drive_2026-08-17_2026-09-17.json'));
const LEDGER = path.join(DATA, 'route-day-ledger.json');
const GUSTO = path.join(REDESIGN, 'private/gusto/paid-hours.json');

// paid hours per tech per date
const paidBy = new Map();      // "tech|date" -> {hours, clockInMin, clockOutMin, salaried}
let paidSource = 'none';
if (exists(LEDGER)) {
  const L = rd(LEDGER);
  paidSource = 'data/route-day-ledger.json';
  for (const d of L.days || []) {
    paidBy.set(d.tech + '|' + d.date, {
      hours: d.paid?.hours ?? null, clockInMin: d.paid?.clockInMin ?? null,
      clockOutMin: d.paid?.clockOutMin ?? null, salaried: !!d.salaried, label: d.label || null,
    });
  }
} else if (exists(GUSTO)) {
  const G = rd(GUSTO);
  paidSource = 'private/gusto/paid-hours.json';
  const toMin = s => { if (!s) return null; const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(s); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); };
  for (const r of G.rows || []) paidBy.set(r.tech + '|' + r.date, { hours: r.totalHours ?? null, clockInMin: toMin(r.clockIn), clockOutMin: toMin(r.clockOut), salaried: false, label: null });
}

// ---------------------------------------------------------------- jobber indexes
const jobByNumber = new Map();
const propPoints = [];                     // every distinct job property
for (const j of jobs) {
  if (j.jobNumber != null) jobByNumber.set(j.jobNumber, j);
  const p = j.property;
  if (p && p.lat != null && p.lng != null) propPoints.push({ lat: p.lat, lng: p.lng, job: j.jobNumber, client: j.client?.name || null });
}
const clientNames = new Set();
for (const j of jobs) if (j.client?.name) clientNames.add(norm(j.client.name));
for (const v of visits) if (v.clientName) clientNames.add(norm(v.clientName));

// completed visits in window, by date -> tech
const visitsByDateTech = new Map();       // date -> Map(tech -> [{lat,lng,job,client,ms}])
const completedCountByTechDate = new Map();
for (const v of visits) {
  if (!v.isComplete || !v.completedAt || v.lat == null) continue;
  const d = dateOf(Date.parse(v.completedAt));
  if (d < WIN_FROM || d > WIN_TO) continue;
  const tech = (v.techs || [])[0];
  if (!tech) continue;
  if (!visitsByDateTech.has(d)) visitsByDateTech.set(d, new Map());
  const m = visitsByDateTech.get(d);
  if (!m.has(tech)) m.set(tech, []);
  m.get(tech).push({ lat: v.lat, lng: v.lng, job: v.jobNumber, client: v.clientName, ms: Date.parse(v.completedAt) });
  const k = tech + '|' + d;
  completedCountByTechDate.set(k, (completedCountByTechDate.get(k) || 0) + 1);
}
// cross-check source (completed-visits file) — count only
const completedFileCount = new Map();
for (const c of completed) {
  const d = dateOf(Date.parse(c.completedAt));
  const k = c.tech + '|' + d;
  completedFileCount.set(k, (completedFileCount.get(k) || 0) + 1);
}

// plan-vs-actual per route-day
const pvaBy = new Map();
for (const r of pva.routeDays || []) pvaBy.set(r.driver + '|' + r.date, r);

// ---------------------------------------------------------------- stops: clean + merge
const truckByImei = new Map(trackers.map(t => [t.imei, t.firstName]));
const allStops = stopsRaw
  .map(s => ({
    truck: s.driverName || truckByImei.get(s.imei) || s.imei,
    appDriverName: (s.appDriverName && !/^no driver assigned$/i.test(s.appDriverName)) ? s.appDriverName : null,
    imei: s.imei,
    begin: s.beginDate, end: s.endDate, dur: s.duration,
    lat: s.latitude, lng: s.longitude,
    street: s.street, city: s.city, zip: s.postalCode,
    geofence: s.geofenceName || null, type: s.stopType,
  }))
  .filter(s => s.lat != null && s.begin != null);

// the feed repeats some rows verbatim (same device, same begin/end, same point)
const seenStop = new Set();
let dupStops = 0;
const deduped = allStops.filter(s => {
  const k = s.imei + '|' + s.begin + '|' + s.end + '|' + s.lat + '|' + s.lng;
  if (seenStop.has(k)) { dupStops++; return false; }
  seenStop.add(k); return true;
});

const droppedShortIdle = deduped.filter(s => s.type === 'Idling' && s.dur < IDLE_DROP_MIN).length;
const kept = deduped.filter(s => !(s.type === 'Idling' && s.dur < IDLE_DROP_MIN)).sort((a, b) => a.begin - b.begin);

// merge adjacent same-place stops per truck
const byTruck = new Map();
for (const s of kept) { if (!byTruck.has(s.truck)) byTruck.set(s.truck, []); byTruck.get(s.truck).push(s); }
const mergedByTruck = new Map();
let mergeCount = 0;
for (const [truck, list] of byTruck) {
  const out = [];
  for (const s of list) {
    const p = out[out.length - 1];
    if (p && (s.begin - p.end) / 60000 <= MERGE_GAP_MIN && hav(p.lat, p.lng, s.lat, s.lng) <= MERGE_DIST_M) {
      p.end = Math.max(p.end, s.end);
      p.dur = (p.end - p.begin) / 60000;
      p.parts++;
      if (!p.geofence && s.geofence) p.geofence = s.geofence;
      if (s.type === 'Engine Off') p.type = 'Engine Off';
      mergeCount++;
    } else {
      out.push({ ...s, dur: (s.end - s.begin) / 60000, parts: 1 });
    }
  }
  mergedByTruck.set(truck, out);
}

// ---------------------------------------------------------------- home medoid per truck
const homeByTruck = new Map();
for (const [truck, list] of mergedByTruck) {
  // overnight anchors: stops longer than 3 h
  const cands = list.filter(s => s.dur >= 180);
  const pts = cands.length ? cands : list;
  let best = null, bestScore = Infinity;
  for (const a of pts) {
    let sc = 0;
    for (const b of pts) sc += Math.min(hav(a.lat, a.lng, b.lat, b.lng), 50000) * (b.dur / 60);
    if (sc < bestScore) { bestScore = sc; best = a; }
  }
  const near = pts.filter(s => hav(best.lat, best.lng, s.lat, s.lng) <= HOME_RADIUS_M);
  homeByTruck.set(truck, {
    lat: +best.lat.toFixed(5), lng: +best.lng.toFixed(5),
    street: best.street, city: best.city, zip: best.zip,
    geofence: best.geofence,
    overnightStops: pts.length, atHome: near.length,
    shareAtHomePct: r1(near.length / pts.length * 100),
    medianOvernightMin: r1(med(near.map(s => s.dur))),
  });
}

// ---------------------------------------------------------------- truck -> tech per date
const truckDates = new Map();  // truck -> Map(date -> stops[])
for (const [truck, list] of mergedByTruck) {
  const m = new Map();
  for (const s of list) {
    const d = dateOf(s.begin);
    if (d < WIN_FROM || d > WIN_TO) continue;
    if (!m.has(d)) m.set(d, []);
    m.get(d).push(s);
  }
  truckDates.set(truck, m);
}

const mapRows = [];
for (const [truck, dm] of truckDates) {
  const home = homeByTruck.get(truck);
  for (const [date, ss] of [...dm].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const field = ss.filter(s => hav(s.lat, s.lng, home.lat, home.lng) > HOME_RADIUS_M);
    const tm = visitsByDateTech.get(date) || new Map();
    const scored = [];
    for (const [tech, pts] of tm) {
      let hit = 0;
      for (const s of field) if (pts.some(p => hav(s.lat, s.lng, p.lat, p.lng) <= CUSTOMER_RADIUS_M)) hit++;
      scored.push({ tech, hit, sharePct: field.length ? r1(hit / field.length * 100) : 0, techVisits: pts.length });
    }
    scored.sort((a, b) => b.hit - a.hit);
    const best = scored[0] || null;
    const second = scored[1] || null;
    mapRows.push({
      truck, date, dow: dowOf(date), week: weekOf(date),
      stops: ss.length, fieldStops: field.length,
      appDriverName: ss.find(s => s.appDriverName)?.appDriverName || null,
      tech: best && best.hit > 0 ? best.tech : null,
      matched: best?.hit || 0, matchSharePct: best?.sharePct ?? 0,
      runnerUp: second ? { tech: second.tech, matched: second.hit } : null,
    });
  }
}
// usual tech per truck = modal winner weighted by matched stops
const usualTech = new Map();
for (const truck of truckDates.keys()) {
  const c = {};
  for (const r of mapRows) if (r.truck === truck && r.tech) c[r.tech] = (c[r.tech] || 0) + r.matched;
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  usualTech.set(truck, top ? top[0] : null);
}
for (const r of mapRows) {
  r.usualTech = usualTech.get(r.truck);
  r.anomaly = !r.tech ? 'no customer match (non-field day)'
    : (r.tech !== r.usualTech ? 'matched a different tech than usual' : null);
}
// truck x week match share
const truckWeek = [];
{
  const agg = new Map();
  for (const r of mapRows) {
    const k = r.truck + '|' + r.week;
    if (!agg.has(k)) agg.set(k, { truck: r.truck, week: r.week, days: 0, fieldStops: 0, matched: 0, techs: {} });
    const a = agg.get(k);
    a.days++; a.fieldStops += r.fieldStops; a.matched += r.matched;
    if (r.tech) a.techs[r.tech] = (a.techs[r.tech] || 0) + 1;
  }
  for (const a of agg.values()) truckWeek.push({ ...a, matchSharePct: a.fieldStops ? r1(a.matched / a.fieldStops * 100) : 0 });
  truckWeek.sort((a, b) => a.truck === b.truck ? (a.week < b.week ? -1 : 1) : (a.truck < b.truck ? -1 : 1));
}
const truckTechMap = [...truckDates.keys()].map(truck => {
  const rows = mapRows.filter(r => r.truck === truck);
  const fsum = rows.reduce((a, r) => a + r.fieldStops, 0), mt = rows.reduce((a, r) => a + r.matched, 0);
  const tr = trackers.find(t => t.firstName === truck);
  return {
    truck, tech: usualTech.get(truck),
    basis: rows.some(r => r.appDriverName) ? 'tracker appDriverName + stop-to-visit proximity'
      : (/lavergne/i.test(truck) ? 'truck named for the tech + stop-to-visit proximity' : 'stop-to-visit proximity (150 m, same date)'),
    vehicle: tr ? ([tr.year, tr.make, tr.model].filter(Boolean).join(' ') || tr.deviceTypeDescription) : null,
    days: rows.length, fieldStops: fsum, matched: mt, matchSharePct: r1(mt / fsum * 100),
    anomalyDates: rows.filter(r => r.anomaly).map(r => ({ date: r.date, dow: r.dow, stops: r.stops, anomaly: r.anomaly, matchSharePct: r.matchSharePct })),
    home: homeByTruck.get(truck),
  };
});
const techForTruckDate = new Map(mapRows.map(r => [r.truck + '|' + r.date, r.tech || usualTech.get(r.truck)]));

// ---------------------------------------------------------------- stop classification
const REGION_GEOFENCE = /(~|complete service area|^north$|^seattle$|renton-newcastle|maple valley covington|northbend|federal way-milton|olympia-yelm|tacoma-south hill|enumclaw-buckley|lake tapps-buckley)/i;

// pass 1: home, and the shared depot. A place several trucks call at on many different days is a
// company location, not a customer — even when a Jobber job sits on it (the owner's own property
// carries a barter job). Depot detection therefore runs BEFORE the customer test.
for (const [truck, list] of mergedByTruck) {
  const home = homeByTruck.get(truck);
  for (const s of list) {
    s.date = dateOf(s.begin);
    s.tech = techForTruckDate.get(truck + '|' + s.date) || usualTech.get(truck);
    s.klass = hav(s.lat, s.lng, home.lat, home.lng) <= HOME_RADIUS_M ? 'HOME' : null;
  }
}
const depotClusters = [];
for (const s of [...mergedByTruck.values()].flat()) {
  if (s.klass === 'HOME') continue;
  let c = depotClusters.find(c => hav(c.lat, c.lng, s.lat, s.lng) <= 200);
  if (!c) { c = { lat: s.lat, lng: s.lng, street: s.street, city: s.city, zip: s.zip, stops: [] }; depotClusters.push(c); }
  c.stops.push(s);
}
// several trucks on many days is not enough on its own — a customer on a territory border gets
// three techs across a month. A company location also holds the truck: real dwell, and at least
// one long stay (meet-up, load-out, overnight).
const depots = depotClusters.filter(c =>
  new Set(c.stops.map(s => s.truck)).size >= 3 &&
  new Set(c.stops.map(s => s.date)).size >= 4 &&
  c.stops.reduce((a, s) => a + s.dur, 0) >= 300 &&
  Math.max(...c.stops.map(s => s.dur)) >= 60);
for (const c of depots) for (const s of c.stops) s.klass = 'DEPOT';
const depotList = depots.map(c => {
  let nearest = null, nd = Infinity;
  for (const p of propPoints) { const d = hav(c.lat, c.lng, p.lat, p.lng); if (d < nd) { nd = d; nearest = p; } }
  return {
    street: c.street, city: c.city, zip: c.zip, lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5),
    trucks: [...new Set(c.stops.map(s => s.truck))], calls: c.stops.length,
    days: new Set(c.stops.map(s => s.date)).size,
    totalMin: r1(c.stops.reduce((a, s) => a + s.dur, 0)),
    medianMin: r1(med(c.stops.map(s => s.dur))),
    longestMin: r1(Math.max(...c.stops.map(s => s.dur))),
    nearestJobberJob: nearest && nd < 300 ? { job: nearest.job, client: nearest.client, metres: Math.round(nd) } : null,
  };
});

// pass 2: everything else
for (const [truck, list] of mergedByTruck) {
  for (const s of list) {
    const date = s.date;
    if (s.klass) continue;
    // a dwell over the cap is the truck parked somewhere (overnight away, weekend, repair shop),
    // never a mole check — even when it sits inside a customer geofence
    if (s.dur > MAX_CUSTOMER_MIN) { s.klass = 'PARKED'; continue; }
    // customer: within 150 m of a property the assigned tech stamped that day
    const pts = (visitsByDateTech.get(date) || new Map()).get(s.tech) || [];
    let hit = null, hd = Infinity;
    for (const p of pts) { const d = hav(s.lat, s.lng, p.lat, p.lng); if (d < hd) { hd = d; hit = p; } }
    if (hit && hd <= CUSTOMER_RADIUS_M) { s.klass = 'CUSTOMER'; s.match = 'stamped visit ' + Math.round(hd) + ' m'; s.job = hit.job; s.client = hit.client; continue; }
    // customer geofence naming a real client
    if (s.geofence && !REGION_GEOFENCE.test(s.geofence) && clientNames.has(norm(s.geofence))) {
      s.klass = 'CUSTOMER'; s.match = 'customer geofence'; s.client = s.geofence; continue;
    }
    // any job property (visit not stamped by this tech / not stamped at all)
    let ph = null, pd = Infinity;
    for (const p of propPoints) { const d = hav(s.lat, s.lng, p.lat, p.lng); if (d < pd) { pd = d; ph = p; } }
    if (ph && pd <= CUSTOMER_RADIUS_M) { s.klass = 'CUSTOMER_UNSTAMPED'; s.match = 'job property ' + Math.round(pd) + ' m'; s.job = ph.job; s.client = ph.client; continue; }
    s.klass = 'OTHER';
  }
}
// recurring non-customer stops: fuel, food, breaks, overnight parking away from home
const otherStops = [...mergedByTruck.values()].flat().filter(s => s.klass === 'OTHER' || s.klass === 'PARKED');
const clusters = [];
for (const s of otherStops) {
  let c = clusters.find(c => hav(c.lat, c.lng, s.lat, s.lng) <= CUSTOMER_RADIUS_M);
  if (!c) { c = { lat: s.lat, lng: s.lng, street: s.street, city: s.city, zip: s.zip, geofence: s.geofence, stops: [] }; clusters.push(c); }
  c.stops.push(s);
}
for (const c of clusters) {
  c.trucks = new Set(c.stops.map(s => s.truck));
  c.dates = new Set(c.stops.map(s => s.date));
  c.minutes = c.stops.reduce((a, s) => a + s.dur, 0);
}
const otherTop = clusters
  .sort((a, b) => b.minutes - a.minutes).slice(0, 25)
  .map(c => ({ street: c.street, city: c.city, zip: c.zip, geofence: c.geofence, trucks: [...c.trucks], visits: c.stops.length, days: c.dates.size, totalMin: r1(c.minutes), medianMin: r1(med(c.stops.map(s => s.dur))) }));
// per-truck top recurring non-customer stop addresses
const otherByTruck = {};
for (const truck of mergedByTruck.keys()) {
  const cs = clusters.filter(c => c.stops.some(s => s.truck === truck));
  otherByTruck[truck] = cs.map(c => {
    const mine = c.stops.filter(s => s.truck === truck);
    return { street: c.street, city: c.city, visits: mine.length, days: new Set(mine.map(s => s.date)).size, totalMin: r1(mine.reduce((a, s) => a + s.dur, 0)) };
  }).filter(x => x.visits >= 3).sort((a, b) => b.totalMin - a.totalMin).slice(0, 8);
}

// ---------------------------------------------------------------- trips index
const tripsByTruckDate = new Map();
for (const t of tripsRaw) {
  const truck = t.personName || truckByImei.get(t.imei);
  const d = dateOf(t.startDateTime);
  if (d < WIN_FROM || d > WIN_TO) continue;
  const k = truck + '|' + d;
  if (!tripsByTruckDate.has(k)) tripsByTruckDate.set(k, []);
  tripsByTruckDate.get(k).push(t);
}
for (const arr of tripsByTruckDate.values()) arr.sort((a, b) => a.startDateTime - b.startDateTime);

// ---------------------------------------------------------------- route-days
const routeDays = [];
for (const [truck, dm] of truckDates) {
  const all = mergedByTruck.get(truck);
  for (const [date, ssRaw] of [...dm].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const ss = [...ssRaw].sort((a, b) => a.begin - b.begin);
    const tech = techForTruckDate.get(truck + '|' + date);
    const cust = ss.filter(s => s.klass === 'CUSTOMER' || s.klass === 'CUSTOMER_UNSTAMPED');
    const trips = tripsByTruckDate.get(truck + '|' + date) || [];
    if (!cust.length) {
      routeDays.push({
        truck, tech, date, dow: dowOf(date), week: weekOf(date), fieldDay: false,
        note: 'no customer stops on this date', stops: ss.length,
        tripMin: r1(trips.reduce((a, t) => a + t.durationMinutes, 0)),
        tripMiles: r1(trips.reduce((a, t) => a + (t.distanceMilesDetailed || 0), 0)),
      });
      continue;
    }
    const firstCust = cust[0], lastCust = cust[cust.length - 1];
    // a route-day may not bleed into the next: earliest 03:00 on D, latest 03:00 on D+1
    const dayStart = Date.parse(date + 'T00:00:00Z') + TZ_OFF + 3 * 3600000;
    const dayEnd = dayStart + 24 * 3600000;
    // departure: end of the last base stop (home, or the shared depot when the truck slept there)
    const isBase = s => s.klass === 'HOME' || s.klass === 'DEPOT';
    const homeBefore = all.filter(s => isBase(s) && s.end <= firstCust.begin && s.end >= dayStart)
      .sort((a, b) => b.end - a.end)[0];
    const departMs = homeBefore ? homeBefore.end
      : (trips.length && trips[0].startDateTime >= dayStart && trips[0].startDateTime <= firstCust.begin ? trips[0].startDateTime : firstCust.begin);
    const departBasis = homeBefore ? 'home stop end'
      : (departMs === firstCust.begin ? 'first customer arrival (no home stop found)' : 'first trip start');
    // arrival: begin of the first HOME stop starting after the last customer stop ends
    const homeAfter = all.filter(s => isBase(s) && s.begin >= lastCust.end && s.begin <= dayEnd)
      .sort((a, b) => a.begin - b.begin)[0];
    const lastTripEnd = trips.length ? trips[trips.length - 1].endDateTime : null;
    const arriveMs = homeAfter ? homeAfter.begin
      : (lastTripEnd != null && lastTripEnd >= lastCust.end && lastTripEnd <= dayEnd ? lastTripEnd : lastCust.end);
    const arriveBasis = homeAfter ? 'home stop begin'
      : (arriveMs === lastCust.end ? 'last customer departure (no home stop found)' : 'last trip end');

    // a dwell can straddle an anchor (the truck idles for a few minutes after the engine restarts
    // that ended the overnight stop), so every stop is counted only for the part inside the window
    const overlap = (s, from, to) => Math.max(0, (Math.min(s.end, to) - Math.max(s.begin, from)) / 60000);
    const inWindow = all.filter(s => s.end > departMs && s.begin < arriveMs && s.klass !== 'HOME');
    const nonCust = s => s.klass === 'OTHER' || s.klass === 'DEPOT' || s.klass === 'PARKED';
    const onSiteMin = cust.reduce((a, s) => a + s.dur, 0);
    const otherBeforeMin = inWindow.filter(nonCust).reduce((a, s) => a + overlap(s, departMs, firstCust.begin), 0);
    const otherDuringMin = inWindow.filter(nonCust).reduce((a, s) => a + overlap(s, firstCust.begin, lastCust.end), 0);
    const otherAfterMin = inWindow.filter(nonCust).reduce((a, s) => a + overlap(s, lastCust.end, arriveMs), 0);
    const otherMin = otherBeforeMin + otherDuringMin + otherAfterMin;
    const doorToDoor = (arriveMs - departMs) / 60000;
    const firstToLast = (lastCust.end - firstCust.begin) / 60000;
    // drive INSIDE the route is the capacity-relevant number; the commute legs are reported apart
    const driveWithinRouteMin = firstToLast - onSiteMin - otherDuringMin;
    const commuteOutMin = (firstCust.begin - departMs) / 60000 - otherBeforeMin;
    const commuteInMin = (arriveMs - lastCust.end) / 60000 - otherAfterMin;
    const driveMin = driveWithinRouteMin + commuteOutMin + commuteInMin;
    const tripMin = trips.reduce((a, t) => a + t.durationMinutes, 0);
    const tripMiles = trips.reduce((a, t) => a + (t.distanceMilesDetailed || 0), 0);
    const p = pvaBy.get(tech + '|' + date) || null;
    const paid = paidBy.get(tech + '|' + date) || null;
    const jobberCompleted = completedCountByTechDate.get(tech + '|' + date) || 0;
    const durs = cust.map(s => s.dur);

    routeDays.push({
      truck, tech, date, dow: dowOf(date), week: weekOf(date), fieldDay: true,
      depart: hhmm(departMs), departBasis,
      arriveHome: hhmm(arriveMs), arriveBasis,
      doorToDoorMin: r1(doorToDoor), doorToDoorH: r2(doorToDoor / 60),
      workingSpanMin: r1(doorToDoor - otherBeforeMin - otherAfterMin),
      firstCustomer: hhmm(firstCust.begin), lastCustomerLeft: hhmm(lastCust.end),
      firstToLastMin: r1(firstToLast), firstToLastH: r2(firstToLast / 60),
      onSiteMin: r1(onSiteMin), driveMin: r1(driveMin), otherMin: r1(otherMin),
      driveWithinRouteMin: r1(driveWithinRouteMin),
      commuteOutMin: r1(commuteOutMin), commuteInMin: r1(commuteInMin),
      commuteMin: r1(commuteOutMin + commuteInMin),
      otherBeforeMin: r1(otherBeforeMin), otherDuringMin: r1(otherDuringMin), otherAfterMin: r1(otherAfterMin),
      tripDriveMinRaw: r1(tripMin), tripMiles: r1(tripMiles),
      customerStops: cust.length,
      customerStopsUnstamped: cust.filter(s => s.klass === 'CUSTOMER_UNSTAMPED').length,
      jobberCompleted, plannedStops: p?.planned?.stops ?? null,
      onSitePerStop: { median: r1(med(durs)), p25: r1(pct(durs, 0.25)), p75: r1(pct(durs, 0.75)), min: r1(Math.min(...durs)), max: r1(Math.max(...durs)) },
      drivePerStopMin: r1(driveWithinRouteMin / cust.length),
      driveInclCommutePerStopMin: r1(driveMin / cust.length),
      cycleMinPerStop: r1(firstToLast / cust.length),
      // the demand model counts JOBBER VISITS, and one GPS stop can serve several jobs at the same
      // property (Barbee Mill is 11 jobs at one address), so the model input is per visit
      cycleMinPerVisit: jobberCompleted > 0 ? r1(firstToLast / jobberCompleted) : null,
      cycleDoorToDoorMinPerStop: r1(doorToDoor / cust.length),
      stamp: p ? {
        firstStamp: p.actual?.firstStamp ?? null, lastStamp: p.actual?.lastStamp ?? null,
        spanMin: p.actual?.spanMin ?? null,
        serviceMin: p.actual?.stampDerived?.serviceMin ?? null,
        driveMin: p.actual?.stampDerived?.driveMin ?? null,
        stops: p.actual?.stops ?? null,
        plannedSpanMin: p.planned?.spanMin ?? null, plannedDriveMin: p.planned?.driveMin ?? null,
      } : null,
      reconcile: {
        gpsFirstToLastMinusStampSpanMin: p?.actual?.spanMin != null ? r1(firstToLast - p.actual.spanMin) : null,
        gpsOnSiteMinusStampServiceMin: p?.actual?.stampDerived?.serviceMin != null ? r1(onSiteMin - p.actual.stampDerived.serviceMin) : null,
        gpsDriveMinusStampDriveMin: p?.actual?.stampDerived?.driveMin != null ? r1(driveMin - p.actual.stampDerived.driveMin) : null,
        gpsCustomerStopsMinusJobberCompleted: cust.length - jobberCompleted,
      },
      paid: paid ? {
        hours: paid.hours, salaried: paid.salaried,
        clockIn: paid.clockInMin != null ? String(Math.floor(paid.clockInMin / 60)).padStart(2, '0') + ':' + String(Math.round(paid.clockInMin % 60)).padStart(2, '0') : null,
        clockOut: paid.clockOutMin != null ? String(Math.floor(paid.clockOutMin / 60)).padStart(2, '0') + ':' + String(Math.round(paid.clockOutMin % 60)).padStart(2, '0') : null,
        paidMinusDoorToDoorMin: paid.hours != null ? r1(paid.hours * 60 - doorToDoor) : null,
        paidMinusFirstToLastMin: paid.hours != null ? r1(paid.hours * 60 - firstToLast) : null,
        clockInVsDepartMin: paid.clockInMin != null ? r1(paid.clockInMin - minOfDay(departMs)) : null,
        clockOutVsArriveMin: paid.clockOutMin != null ? r1(paid.clockOutMin - minOfDay(arriveMs)) : null,
      } : null,
    });
  }
}
routeDays.sort((a, b) => a.date === b.date ? (String(a.tech) < String(b.tech) ? -1 : 1) : (a.date < b.date ? -1 : 1));
const fieldDays = routeDays.filter(r => r.fieldDay);

// ---------------------------------------------------------------- per tech, per tech x dow
const TECHS = [...new Set(fieldDays.map(r => r.tech))].filter(Boolean).sort();
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// directed service times (CLAUDE.local.md rule of 2026-08-15)
const DIRECTED = { 'Cory Ventura': { check: 12, set: 24 }, _default: { check: 15, set: 30 } };
const directedFor = t => DIRECTED[t] || DIRECTED._default;

// stamp-derived cycle for comparison
const stampCycle = new Map();
for (const r of driveStamp.summary || []) {
  if (!r.medianSpanH || !r.medianStops) continue;
  stampCycle.set(r.tech + '|' + r.dow, { cycle: r.medianSpanH * 60 / r.medianStops, driveMinPerStop: r.driveMinPerStop, medianStops: r.medianStops, medianSpanH: r.medianSpanH });
}

const custDursFor = (tech, dow) => fieldDays
  .filter(r => r.tech === tech && (!dow || r.dow === dow))
  .flatMap(r => mergedByTruck.get(r.truck).filter(x => x.date === r.date && (x.klass === 'CUSTOMER' || x.klass === 'CUSTOMER_UNSTAMPED')).map(x => x.dur));

const perTechDow = [];
for (const tech of TECHS) {
  for (const dow of WEEKDAYS) {
    const rows = fieldDays.filter(r => r.tech === tech && r.dow === dow);
    if (!rows.length) continue;
    const allDurs = custDursFor(tech, dow);
    const sc = stampCycle.get(tech + '|' + dow);
    const gpsCycle = med(rows.map(r => r.cycleMinPerStop));
    perTechDow.push({
      tech, dow, days: rows.length,
      medianCustomerStops: r1(med(rows.map(r => r.customerStops))),
      medianOnSiteMinPerStop: r1(med(allDurs)),
      p25OnSiteMinPerStop: r1(pct(allDurs, 0.25)), p75OnSiteMinPerStop: r1(pct(allDurs, 0.75)),
      medianDriveMinPerStop: r1(med(rows.map(r => r.drivePerStopMin))),
      medianCycleMinPerStop: r1(gpsCycle),
      medianCycleMinPerVisit: r1(med(rows.filter(r => r.cycleMinPerVisit != null).map(r => r.cycleMinPerVisit))),
      medianJobberVisits: r1(med(rows.map(r => r.jobberCompleted))),
      medianCycleDoorToDoorMinPerStop: r1(med(rows.map(r => r.cycleDoorToDoorMinPerStop))),
      medianFirstToLastH: r2(med(rows.map(r => r.firstToLastMin)) / 60),
      medianDoorToDoorH: r2(med(rows.map(r => r.doorToDoorMin)) / 60),
      medianWorkingSpanH: r2(med(rows.map(r => r.workingSpanMin)) / 60),
      medianOtherMin: r1(med(rows.map(r => r.otherMin))),
      stampCycleMinPerStop: sc ? r1(sc.cycle) : null,
      stampMedianStops: sc ? sc.medianStops : null,
      stampMedianSpanH: sc ? sc.medianSpanH : null,
      gpsMinusStampCycleMin: sc ? r1(med(rows.filter(r => r.cycleMinPerVisit != null).map(r => r.cycleMinPerVisit)) - sc.cycle) : null,
      directedCheckMin: directedFor(tech).check,
      gpsMinusDirectedMin: r1(med(allDurs) - directedFor(tech).check),
    });
  }
}
const perTech = TECHS.map(tech => {
  const rows = fieldDays.filter(r => r.tech === tech);
  const allDurs = custDursFor(tech, null);
  const paidRows = rows.filter(r => r.paid && r.paid.hours != null && r.paid.hours > 0);
  return {
    tech, truck: rows[0]?.truck, fieldDays: rows.length,
    medianCustomerStops: r1(med(rows.map(r => r.customerStops))),
    totalCustomerStops: rows.reduce((a, r) => a + r.customerStops, 0),
    totalJobberCompleted: rows.reduce((a, r) => a + r.jobberCompleted, 0),
    onSiteMinPerStop: { median: r1(med(allDurs)), p25: r1(pct(allDurs, 0.25)), p75: r1(pct(allDurs, 0.75)), p90: r1(pct(allDurs, 0.9)), n: allDurs.length },
    directedCheckMin: directedFor(tech).check, directedSetMin: directedFor(tech).set,
    gpsMinusDirectedMin: r1(med(allDurs) - directedFor(tech).check),
    medianDriveMinPerStop: r1(med(rows.map(r => r.drivePerStopMin))),
    medianCycleMinPerStop: r1(med(rows.map(r => r.cycleMinPerStop))),
    medianCycleMinPerVisit: r1(med(rows.filter(r => r.cycleMinPerVisit != null).map(r => r.cycleMinPerVisit))),
    medianJobberVisits: r1(med(rows.map(r => r.jobberCompleted))),
    medianCycleDoorToDoorMinPerStop: r1(med(rows.map(r => r.cycleDoorToDoorMinPerStop))),
    medianDoorToDoorH: r2(med(rows.map(r => r.doorToDoorMin)) / 60),
    medianWorkingSpanH: r2(med(rows.map(r => r.workingSpanMin)) / 60),
    medianFirstToLastH: r2(med(rows.map(r => r.firstToLastMin)) / 60),
    medianOnSiteH: r2(med(rows.map(r => r.onSiteMin)) / 60),
    medianDriveH: r2(med(rows.map(r => r.driveMin)) / 60),
    medianDriveWithinRouteH: r2(med(rows.map(r => r.driveWithinRouteMin)) / 60),
    medianOtherMin: r1(med(rows.map(r => r.otherMin))),
    medianOtherDuringRouteMin: r1(med(rows.map(r => r.otherDuringMin))),
    medianCommuteMin: r1(med(rows.map(r => r.commuteMin))),
    medianCommuteOutMin: r1(med(rows.map(r => r.commuteOutMin))),
    medianCommuteInMin: r1(med(rows.map(r => r.commuteInMin))),
    medianPaidH: paidRows.length ? r2(med(paidRows.map(r => r.paid.hours))) : null,
    medianPaidMinusDoorToDoorMin: paidRows.length ? r1(med(paidRows.map(r => r.paid.paidMinusDoorToDoorMin))) : null,
    medianPaidMinusFirstToLastMin: paidRows.length ? r1(med(paidRows.map(r => r.paid.paidMinusFirstToLastMin))) : null,
    medianStampSpanMinusGpsFirstToLastMin: r1(med(rows.filter(r => r.reconcile.gpsFirstToLastMinusStampSpanMin != null).map(r => -r.reconcile.gpsFirstToLastMinusStampSpanMin))),
    medianGpsOnSiteMinusStampServiceMin: r1(med(rows.filter(r => r.reconcile.gpsOnSiteMinusStampServiceMin != null).map(r => r.reconcile.gpsOnSiteMinusStampServiceMin))),
    medianGpsDriveMinusStampDriveMin: r1(med(rows.filter(r => r.reconcile.gpsDriveMinusStampDriveMin != null).map(r => r.reconcile.gpsDriveMinusStampDriveMin))),
    medianGpsStopsMinusJobberStops: r1(med(rows.map(r => r.reconcile.gpsCustomerStopsMinusJobberCompleted))),
    home: homeByTruck.get(rows[0]?.truck) || null,
  };
});

// per tech per week
const perTechWeek = [];
const WEEKS = [...new Set(fieldDays.map(r => r.week))].sort();
for (const tech of TECHS) {
  for (const week of WEEKS) {
    const rows = fieldDays.filter(r => r.tech === tech && r.week === week);
    if (!rows.length) continue;
    const paidRows = rows.filter(r => r.paid && r.paid.hours != null && r.paid.hours > 0);
    perTechWeek.push({
      tech, week, days: rows.length,
      customerStops: rows.reduce((a, r) => a + r.customerStops, 0),
      doorToDoorH: r2(rows.reduce((a, r) => a + r.doorToDoorMin, 0) / 60),
      workingSpanH: r2(rows.reduce((a, r) => a + r.workingSpanMin, 0) / 60),
      firstToLastH: r2(rows.reduce((a, r) => a + r.firstToLastMin, 0) / 60),
      onSiteH: r2(rows.reduce((a, r) => a + r.onSiteMin, 0) / 60),
      driveH: r2(rows.reduce((a, r) => a + r.driveMin, 0) / 60),
      driveWithinRouteH: r2(rows.reduce((a, r) => a + r.driveWithinRouteMin, 0) / 60),
      commuteH: r2(rows.reduce((a, r) => a + r.commuteMin, 0) / 60),
      otherH: r2(rows.reduce((a, r) => a + r.otherMin, 0) / 60),
      paidH: paidRows.length ? r2(paidRows.reduce((a, r) => a + r.paid.hours, 0)) : null,
      paidDays: paidRows.length,
    });
  }
}

// cover / absence cross-check: a weekday on which a truck did no customer work while others did
const fieldDates = [...new Set(fieldDays.map(r => r.date))].sort();
const truckIdleDays = [];
for (const [truck, dm] of truckDates) {
  const tech = usualTech.get(truck);
  for (const date of fieldDates) {
    if (!['sat', 'sun'].includes(dowOf(date)) && !fieldDays.some(r => r.truck === truck && r.date === date)) {
      const others = fieldDays.filter(r => r.date === date);
      const stampedElsewhere = completedCountByTechDate.get(tech + '|' + date) || 0;
      truckIdleDays.push({
        truck, tech, date, dow: dowOf(date),
        truckStopsThatDay: (dm.get(date) || []).length,
        techStampedVisits: stampedElsewhere,
        otherTrucksWorking: others.length,
        reading: stampedElsewhere > 0
          ? 'tech stamped visits with no truck movement — worked from another vehicle, or stamps were batched'
          : 'tech did no customer work — absence or holiday',
      });
    }
  }
}
// who picked the work up: a tech whose customer stops that day sit far from their own usual ground
const techCentroid = new Map();
for (const tech of [...new Set(fieldDays.map(r => r.tech))]) {
  const pts = fieldDays.filter(r => r.tech === tech).flatMap(r => mergedByTruck.get(r.truck).filter(x => x.date === r.date && x.klass === 'CUSTOMER'));
  if (!pts.length) continue;
  techCentroid.set(tech, { lat: med(pts.map(p => p.lat)), lng: med(pts.map(p => p.lng)) });
}
const coverCandidates = [];
for (const r of fieldDays) {
  const c = techCentroid.get(r.tech); if (!c) continue;
  const pts = mergedByTruck.get(r.truck).filter(x => x.date === r.date && (x.klass === 'CUSTOMER' || x.klass === 'CUSTOMER_UNSTAMPED'));
  const dists = pts.map(p => hav(p.lat, p.lng, c.lat, c.lng) / 1000);
  const m = med(dists);
  coverCandidates.push({ tech: r.tech, date: r.date, dow: r.dow, stops: r.customerStops, medianKmFromOwnGround: r1(m) });
}
const ownGroundMedian = new Map();
for (const tech of [...new Set(coverCandidates.map(c => c.tech))]) ownGroundMedian.set(tech, med(coverCandidates.filter(c => c.tech === tech).map(c => c.medianKmFromOwnGround)));
const coverDaysGps = coverCandidates
  .filter(c => c.medianKmFromOwnGround > Math.max(12, 3 * (ownGroundMedian.get(c.tech) || 0)))
  .map(c => ({ ...c, techUsualMedianKm: r1(ownGroundMedian.get(c.tech)), reading: 'worked well outside their own ground — likely a cover day' }));

// paid-time definition test: is paid time door-to-door or first-job-to-last-job?
const paidTest = (() => {
  const rows = fieldDays.filter(r => r.paid && r.paid.hours != null && r.paid.hours > 0);
  const vsDoor = rows.map(r => r.paid.paidMinusDoorToDoorMin);
  const vsF2L = rows.map(r => r.paid.paidMinusFirstToLastMin);
  const inD = rows.filter(r => r.paid.clockInVsDepartMin != null).map(r => r.paid.clockInVsDepartMin);
  const outD = rows.filter(r => r.paid.clockOutVsArriveMin != null).map(r => r.paid.clockOutVsArriveMin);
  const absMed = a => r1(med(a.map(Math.abs)));
  return {
    n: rows.length,
    paidMinusDoorToDoorMin: { median: r1(med(vsDoor)), p25: r1(pct(vsDoor, 0.25)), p75: r1(pct(vsDoor, 0.75)), medianAbs: absMed(vsDoor) },
    paidMinusFirstToLastMin: { median: r1(med(vsF2L)), p25: r1(pct(vsF2L, 0.25)), p75: r1(pct(vsF2L, 0.75)), medianAbs: absMed(vsF2L) },
    clockInMinusDepartMin: { median: r1(med(inD)), p25: r1(pct(inD, 0.25)), p75: r1(pct(inD, 0.75)) },
    clockOutMinusArriveHomeMin: { median: r1(med(outD)), p25: r1(pct(outD, 0.25)), p75: r1(pct(outD, 0.75)) },
    verdict: absMed(vsDoor) <= absMed(vsF2L)
      ? 'paid time tracks DOOR-TO-DOOR (home to home): the commute is on the clock'
      : 'paid time tracks FIRST-JOB-TO-LAST-JOB: the commute is unpaid',
    note: 'Cory Ventura is salaried and has no clock rows, so he is excluded from this test.',
  };
})();

// ---------------------------------------------------------------- cycle times file
const cycleOut = {
  generatedAt: new Date().toISOString(),
  source: 'scripts/gps-ground-truth.mjs — vehicle GPS stops + trips, 2026-08-17..2026-09-17',
  definition: {
    cycleMinPerStop: 'median over that tech route-days of (first-customer-arrival to last-customer-departure) / JOBBER COMPLETED VISITS that day. Drive between stops and any mid-route break is inside it; the home commute is not. This is the demand-model input, because the model counts visits.',
    cycleMinPerGpsStop: 'the same span divided by PHYSICAL GPS stops. Lower than the per-visit figure wherever several jobs share one property.',
    cycleDoorToDoorMinPerStop: 'same but home-to-home, i.e. including the commute at both ends.',
    onSiteMinPerStop: 'median GPS dwell at a customer stop (adjacent stops at the same place merged; idling under 2 min dropped).',
    driveMinPerStop: 'median over route-days of (door-to-door minus all stop dwell) / customer stops.',
  },
  globalOnSiteMinPerStop: r1(med(custDursFor(null, null).length ? custDursFor(null, null) : [])),
  globalCycleMinPerStop: r1(med(fieldDays.filter(r => r.cycleMinPerVisit != null).map(r => r.cycleMinPerVisit))),
  globalCycleMinPerGpsStop: r1(med(fieldDays.map(r => r.cycleMinPerStop))),
  globalCycleDoorToDoorMinPerStop: r1(med(fieldDays.map(r => r.cycleDoorToDoorMinPerStop))),
  byTechDow: perTechDow.map(r => ({
    tech: r.tech, dow: r.dow, days: r.days,
    cycleMinPerStop: r.medianCycleMinPerVisit,
    cycleMinPerGpsStop: r.medianCycleMinPerStop,
    cycleDoorToDoorMinPerStop: r.medianCycleDoorToDoorMinPerStop,
    onSiteMinPerStop: r.medianOnSiteMinPerStop,
    driveMinPerStop: r.medianDriveMinPerStop,
    medianCustomerStops: r.medianJobberVisits,
    medianGpsStops: r.medianCustomerStops,
    medianFirstToLastH: r.medianFirstToLastH,
    medianDoorToDoorH: r.medianDoorToDoorH,
    medianWorkingSpanH: r.medianWorkingSpanH,
    stampCycleMinPerStop: r.stampCycleMinPerStop,
    gpsMinusStampCycleMin: r.gpsMinusStampCycleMin,
  })),
  byTech: perTech.map(r => ({
    tech: r.tech, cycleMinPerStop: r.medianCycleMinPerVisit,
    cycleMinPerGpsStop: r.medianCycleMinPerStop,
    cycleDoorToDoorMinPerStop: r.medianCycleDoorToDoorMinPerStop,
    onSiteMinPerStop: r.onSiteMinPerStop.median, driveMinPerStop: r.medianDriveMinPerStop,
    medianCustomerStops: r.medianJobberVisits, medianGpsStops: r.medianCustomerStops, fieldDays: r.fieldDays,
    directedCheckMin: r.directedCheckMin, gpsMinusDirectedMin: r.gpsMinusDirectedMin,
  })),
  observedBaseline: {
    rows: perTechDow.map(r => ({ tech: r.tech, dow: r.dow, medianStops: r.medianJobberVisits, medianGpsStops: r.medianCustomerStops, medianSpanH: r.medianFirstToLastH, medianDoorToDoorH: r.medianDoorToDoorH, weeksObserved: r.days })),
    note: 'medianStops is Jobber completed VISITS that day (what the demand model counts); medianGpsStops is physical GPS stops, which is lower wherever several jobs sit on one property. medianSpanH is first-customer to last-customer, the like-for-like against the stamp-derived span.',
  },
};
// global on-site needs the flat list; recompute cleanly
cycleOut.globalOnSiteMinPerStop = r1(med(TECHS.flatMap(t => custDursFor(t, null))));

// ---------------------------------------------------------------- assemble
const out = {
  generatedAt: new Date().toISOString(),
  stage: 'S2c',
  window: { from: WIN_FROM, to: WIN_TO, tz: 'America/Los_Angeles (PDT, UTC-7 all window)' },
  sources: {
    trackers: 'private/gps/_trackers.json', trips: 'private/gps/trips_2026-08-17_2026-09-17.json',
    stops: 'private/gps/stops_2026-08-17_2026-09-17.json',
    jobber: 'data/jobber/jobs.json + data/jobber/visits.json',
    completedVisits: '../data/completed-visits_2026-08-17_2026-09-17.json',
    planVsActual: 'data/plan-vs-actual.json', paidHours: paidSource,
    stampCycle: '../data/route-day-drive_2026-08-17_2026-09-17.json',
  },
  method: {
    stopsAreTheVisitRecord: "Only the '2022 Ranger' (Tavis) turns the engine off at customers. The other four idle through their stops, so trips do NOT split at a visit and a trip duration swallows the stops inside it. Stops are the visit record; drive is derived as door-to-door minus all stop dwell.",
    duplicateStopRowsDropped: dupStops,
    idleDrop: 'Idling stops under ' + IDLE_DROP_MIN + ' min dropped as traffic: ' + droppedShortIdle + ' of ' + allStops.length + '.',
    merge: 'Adjacent stops within ' + MERGE_GAP_MIN + ' min and ' + MERGE_DIST_M + ' m merged into one dwell: ' + mergeCount + ' merges.',
    customerRadiusM: CUSTOMER_RADIUS_M, homeRadiusM: HOME_RADIUS_M,
    tripsUsedFor: 'day first-departure / last-arrival fallback, plus raw trip minutes and miles reported for reference only.',
  },
  truckTechMap, truckWeekMatchShare: truckWeek, truckDateMap: mapRows,
  stopClassification: {
    counts: (() => { const c = {}; for (const s of [...mergedByTruck.values()].flat()) c[s.klass] = (c[s.klass] || 0) + 1; return c; })(),
    depots: depotList,
    topOtherStops: otherTop,
    topOtherStopsByTruck: otherByTruck,
  },
  routeDays, perTech, perTechDow, perTechWeek, paidTest,
  coverAndAbsence: { truckIdleWeekdays: truckIdleDays, coverDaysFromGps: coverDaysGps },
  cycleTimes: cycleOut,
};

fs.writeFileSync(path.join(DATA, 'gps-ground-truth.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(DATA, 'cycle-times-gps.json'), JSON.stringify(cycleOut, null, 1));

// ---------------------------------------------------------------- report
const L = [];
const p = s => L.push(s);
p('S2c GPS GROUND TRUTH  ' + WIN_FROM + '..' + WIN_TO);
p('stops ' + allStops.length + ' raw (' + dupStops + ' duplicate rows dropped) -> ' + [...mergedByTruck.values()].flat().length + ' merged  (dropped ' + droppedShortIdle + ' short idles, merged ' + mergeCount + ')');
p('trips ' + tripsRaw.length + '   paid-hours source ' + paidSource);
p('');
p('TRUCK -> TECH');
p('  truck            tech              basis                                          days  fieldStops  match%');
for (const t of truckTechMap) p('  ' + t.truck.padEnd(17) + String(t.tech).padEnd(18) + String(t.basis).slice(0, 45).padEnd(46) + String(t.days).padStart(4) + String(t.fieldStops).padStart(12) + String(t.matchSharePct).padStart(8));
p('');
p('HOME (medoid of overnight stops)');
for (const t of truckTechMap) p('  ' + String(t.tech).padEnd(18) + (t.home.street || '?') + ', ' + t.home.city + ' ' + t.home.zip + '   nights at home ' + t.home.atHome + '/' + t.home.overnightStops + ' (' + t.home.shareAtHomePct + '%)');
p('');
p('ANOMALY DATES');
let anyAnom = false;
for (const t of truckTechMap) for (const a of t.anomalyDates) { anyAnom = true; p('  ' + t.truck.padEnd(16) + a.date + ' ' + a.dow + '  stops ' + String(a.stops).padStart(3) + '  match ' + String(a.matchSharePct).padStart(5) + '%  ' + a.anomaly); }
if (!anyAnom) p('  none');
p('');
p('TRUCK x WEEK MATCH SHARE');
for (const w of truckWeek) p('  ' + w.truck.padEnd(16) + w.week + '  days ' + w.days + '  fieldStops ' + String(w.fieldStops).padStart(4) + '  matched ' + String(w.matched).padStart(4) + '  ' + String(w.matchSharePct).padStart(5) + '%  ' + JSON.stringify(w.techs));
p('');
p('STOP CLASSIFICATION  ' + JSON.stringify(out.stopClassification.counts));
p('DEPOT / SHARED COMPANY LOCATIONS (>=3 trucks, >=4 days)');
for (const s of depotList) p('  ' + String(s.street || '?').slice(0, 34).padEnd(36) + String(s.city).padEnd(14) + 'trucks ' + s.trucks.length + '  calls ' + String(s.calls).padStart(3) + '  days ' + String(s.days).padStart(3) + '  totMin ' + String(s.totalMin).padStart(7) + '  medMin ' + String(s.medianMin).padStart(6) + (s.nearestJobberJob ? '   nearest Jobber job #' + s.nearestJobberJob.job + ' ' + s.nearestJobberJob.client + ' (' + s.nearestJobberJob.metres + ' m)' : ''));
if (!depotList.length) p('  none');
p('');
p('TOP RECURRING NON-CUSTOMER STOPS (fuel / food / break)');
for (const s of otherTop.slice(0, 12)) p('  ' + String(s.street || '?').slice(0, 34).padEnd(36) + String(s.city).padEnd(14) + 'visits ' + String(s.visits).padStart(3) + '  days ' + String(s.days).padStart(3) + '  med ' + String(s.medianMin).padStart(5) + 'm  tot ' + String(s.totalMin).padStart(7) + 'm  ' + s.trucks.join(','));
p('');
p('PER TECH (medians over field days)');
p('  tech              days  stops  onSite/stop p25-med-p75   drive/stop  cycle  d2d(h)  f2l(h)  onSite(h)  drive(h)  other(m)  commute(m)  paid(h)');
for (const t of perTech) p('  ' + t.tech.padEnd(18) + String(t.fieldDays).padStart(4) + String(t.medianCustomerStops).padStart(7)
  + ('   ' + t.onSiteMinPerStop.p25 + ' - ' + t.onSiteMinPerStop.median + ' - ' + t.onSiteMinPerStop.p75).padEnd(28)
  + String(t.medianDriveMinPerStop).padStart(10) + String(t.medianCycleMinPerStop).padStart(7)
  + String(t.medianDoorToDoorH).padStart(8) + String(t.medianFirstToLastH).padStart(8)
  + String(t.medianOnSiteH).padStart(11) + String(t.medianDriveWithinRouteH).padStart(10)
  + String(t.medianOtherMin).padStart(10) + String(t.medianCommuteMin).padStart(12) + String(t.medianPaidH).padStart(9));
p('  (drive/stop and drive(h) are INSIDE the route; commute is the home legs, reported apart)');
p('');
p('DAY SHAPE (median minutes per field day)');
p('  tech              commuteOut  commuteIn  otherBefore  otherDuring  otherAfter');
for (const t of perTech) {
  const rows = fieldDays.filter(r => r.tech === t.tech);
  p('  ' + t.tech.padEnd(18) + String(r1(med(rows.map(r => r.commuteOutMin)))).padStart(10)
    + String(r1(med(rows.map(r => r.commuteInMin)))).padStart(11)
    + String(r1(med(rows.map(r => r.otherBeforeMin)))).padStart(13)
    + String(r1(med(rows.map(r => r.otherDuringMin)))).padStart(13)
    + String(r1(med(rows.map(r => r.otherAfterMin)))).padStart(12));
}
p('');
p('ON-SITE PER STOP vs DIRECTED SERVICE TIME');
p('  tech              gps median  directed check  delta   n stops');
for (const t of perTech) p('  ' + t.tech.padEnd(18) + String(t.onSiteMinPerStop.median).padStart(10) + String(t.directedCheckMin).padStart(16) + String(t.gpsMinusDirectedMin).padStart(7) + String(t.onSiteMinPerStop.n).padStart(9));
p('');
p('GPS vs STAMPS (median per tech, minutes)');
p('  tech              stampSpan-gpsF2L   gpsOnSite-stampService   gpsDrive-stampDrive   gpsStops-jobberStops');
for (const t of perTech) p('  ' + t.tech.padEnd(18) + String(t.medianStampSpanMinusGpsFirstToLastMin).padStart(16) + String(t.medianGpsOnSiteMinusStampServiceMin).padStart(25) + String(t.medianGpsDriveMinusStampDriveMin).padStart(22) + String(t.medianGpsStopsMinusJobberStops).padStart(23));
p('');
p('PAID TIME DEFINITION  (n=' + paidTest.n + ' clocked field days)');
p('  paid - door-to-door   median ' + paidTest.paidMinusDoorToDoorMin.median + 'm  (p25 ' + paidTest.paidMinusDoorToDoorMin.p25 + ', p75 ' + paidTest.paidMinusDoorToDoorMin.p75 + ')  |median| ' + paidTest.paidMinusDoorToDoorMin.medianAbs);
p('  paid - first-to-last  median ' + paidTest.paidMinusFirstToLastMin.median + 'm  (p25 ' + paidTest.paidMinusFirstToLastMin.p25 + ', p75 ' + paidTest.paidMinusFirstToLastMin.p75 + ')  |median| ' + paidTest.paidMinusFirstToLastMin.medianAbs);
p('  clock-in - depart home    median ' + paidTest.clockInMinusDepartMin.median + 'm');
p('  clock-out - arrive home   median ' + paidTest.clockOutMinusArriveHomeMin.median + 'm');
p('  VERDICT: ' + paidTest.verdict);
p('');
p('PER TECH x WEEKDAY CYCLE (GPS vs stamp)');
p('  tech              dow  days  gpsStops  visits  onSite/stop  drive/stop  cyc/visit  cyc/stop  stampCycle  delta   f2l(h)  d2d(h)');
for (const r of perTechDow) p('  ' + r.tech.padEnd(18) + r.dow.padEnd(5) + String(r.days).padStart(4) + String(r.medianCustomerStops).padStart(10)
  + String(r.medianJobberVisits).padStart(8)
  + String(r.medianOnSiteMinPerStop).padStart(13) + String(r.medianDriveMinPerStop).padStart(12)
  + String(r.medianCycleMinPerVisit).padStart(11) + String(r.medianCycleMinPerStop).padStart(10)
  + String(r.stampCycleMinPerStop).padStart(12) + String(r.gpsMinusStampCycleMin).padStart(7)
  + String(r.medianFirstToLastH).padStart(9) + String(r.medianDoorToDoorH).padStart(8));
p('');
p('PER TECH x WEEK');
p('  tech              week        days  stops  d2d(h)  work(h)  f2l(h)  onSite(h)  drive(h)  commute(h)  other(h)  paid(h)');
for (const w of perTechWeek) p('  ' + w.tech.padEnd(18) + w.week.padEnd(12) + String(w.days).padStart(4) + String(w.customerStops).padStart(7)
  + String(w.doorToDoorH).padStart(8) + String(w.workingSpanH).padStart(9) + String(w.firstToLastH).padStart(8) + String(w.onSiteH).padStart(11)
  + String(w.driveWithinRouteH).padStart(10) + String(w.commuteH).padStart(12) + String(w.otherH).padStart(10) + String(w.paidH).padStart(9));
p('');
p('TRUCK IDLE WEEKDAYS (truck did no customer work while others did)');
for (const d of truckIdleDays) p('  ' + d.tech.padEnd(18) + d.date + ' ' + d.dow + '  truckStops ' + String(d.truckStopsThatDay).padStart(3) + '  techStampedVisits ' + String(d.techStampedVisits).padStart(3) + '  ' + d.reading);
if (!truckIdleDays.length) p('  none');
p('');
p('COVER DAYS FROM GPS (worked far outside their own ground)');
for (const c of coverDaysGps) p('  ' + c.tech.padEnd(18) + c.date + ' ' + c.dow + '  stops ' + String(c.stops).padStart(3) + '  median ' + String(c.medianKmFromOwnGround).padStart(6) + ' km from own ground (usual ' + c.techUsualMedianKm + ' km)');
if (!coverDaysGps.length) p('  none');
p('');
p('NON-FIELD TRUCK DAYS');
const nf = routeDays.filter(r => !r.fieldDay);
for (const r of nf) p('  ' + r.truck.padEnd(16) + r.date + ' ' + r.dow + '  stops ' + r.stops + '  tripMin ' + r.tripMin + '  miles ' + r.tripMiles);
if (!nf.length) p('  none');
p('');
p('wrote data/gps-ground-truth.json and data/cycle-times-gps.json');
console.log(L.join('\n'));
