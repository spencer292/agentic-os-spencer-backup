#!/usr/bin/env node
// PULL OPTIMO HISTORY — archive the routes OptimoRoute actually held, per weekday, per driver.
//
// Built 2026-09-18 for the route-engine redesign. The redesign needs ground truth on what the
// optimiser produced (sequence, drive legs, day span, service durations) before anyone reasons
// about what a better engine would produce. Nothing else in this repo stores a full day snapshot.
//
// STRICTLY READ-ONLY. Calls exactly four endpoints, all reads:
//   get_routes                (GET)  planned route + ordered stops for a date
//   search_orders             (POST) order records for that date — service duration, time windows
//   get_completion_details    (POST) actual completion status/times per order
//   get_depots                (GET)  depot list (once)
// It never calls create/update/delete/start_planning/driver-parameter endpoints. There is no code
// path in this file that can write to OptimoRoute.
//
// Usage:
//   node projects/briefs/route-engine/redesign/scripts/pull-optimo-history.mjs --from=2026-08-17 --to=2026-09-17
//   optional: --weekends (include Sat/Sun; default is weekdays only)
//             --sleep=250 (ms between calls)
//             --out=<dir> (default projects/briefs/route-engine/redesign/data)
//
// Run from the repo root so .env resolves. Redirect output to a log file — never pipe a live
// script through head/sed (SIGPIPE truncation; see CLAUDE.local.md 2026-08-09).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../..');

// ---------------------------------------------------------------- env + args
function loadEnv() {
  const env = {};
  const p = path.join(REPO, '.env');
  if (!fs.existsSync(p)) { console.error(`No .env at ${p} — run from the repo root.`); process.exit(1); }
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const KEY = loadEnv().OPTIMOROUTE_API_KEY;
if (!KEY) { console.error('OPTIMOROUTE_API_KEY missing from .env'); process.exit(1); }

const flag = (n, d) => {
  const a = process.argv.find(x => x === `--${n}` || x.startsWith(`--${n}=`));
  if (!a) return d;
  return a.includes('=') ? a.split('=').slice(1).join('=') : true;
};
const FROM = String(flag('from', '2026-08-17'));
const TO = String(flag('to', '2026-09-17'));
const SLEEP = Number(flag('sleep', 250));
const WEEKENDS = Boolean(flag('weekends', false));
const OUT = path.resolve(REPO, String(flag('out', 'projects/briefs/route-engine/redesign/data')));
const ROUTE_DIR = path.join(OUT, 'optimo-routes');
fs.mkdirSync(ROUTE_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'https://api.optimoroute.com/v1';

// Read-only endpoint allow-list. A typo that reached a mutating endpoint would change real routes,
// so the transport refuses anything not named here rather than trusting the call sites.
const READ_ONLY = new Set(['get_routes', 'search_orders', 'get_completion_details', 'get_depots']);

async function call(endpoint, { body = null, query = '' } = {}) {
  if (!READ_ONLY.has(endpoint)) throw new Error(`BLOCKED: ${endpoint} is not a read-only endpoint`);
  const url = `${BASE}/${endpoint}?key=${encodeURIComponent(KEY)}${query}`;
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await sleep(SLEEP * Math.pow(2, attempt) + Math.random() * 300);
    try {
      const res = await fetch(url, body
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : undefined);
      if (res.status === 429 || res.status >= 500) { lastErr = `HTTP ${res.status}`; continue; }
      const data = await res.json().catch(() => null);
      if (!data) { lastErr = 'unparseable body'; continue; }
      if (data.success === false) return { ok: false, error: `${data.code || 'ERR'}: ${data.message || ''}`.trim(), data };
      return { ok: true, data };
    } catch (e) {
      lastErr = e.message;
    }
  }
  return { ok: false, error: `retries exhausted (${lastErr})` };
}

// ------------------------------------------------------------------- helpers
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function dateRange(from, to) {
  const out = [];
  const cur = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (WEEKENDS || (dow !== 0 && dow !== 6)) out.push(iso(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// "2026-08-18 07:30:17" -> minutes since midnight. OptimoRoute returns local wall time with no
// offset, so this is deliberately parsed as a plain string and never through Date().
function minsOf(dt) {
  if (!dt) return null;
  const m = String(dt).match(/(\d{2}):(\d{2}):?(\d{2})?/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0);
}
const round = (n, p = 2) => (n == null || Number.isNaN(n) ? null : Number(n.toFixed(p)));

// --------------------------------------------------------- per-date fetchers
async function fetchOrders(date) {
  // search_orders paginates with after_tag. Page size is the API's own; we just follow the tag.
  const orders = [];
  let after = null;
  for (let page = 0; page < 40; page++) {
    const body = {
      dateRange: { from: date, to: date },
      includeOrderData: true,
      includeScheduleInformation: true,
    };
    if (after) body.after_tag = after;
    const r = await call('search_orders', { body });
    await sleep(SLEEP);
    if (!r.ok) return { orders, error: r.error };
    orders.push(...(r.data.orders || []));
    after = r.data.after_tag || null;
    if (!after) break;
  }
  return { orders, error: null };
}

async function fetchCompletions(orderNos) {
  const byOrder = new Map();
  const errors = [];
  for (let i = 0; i < orderNos.length; i += 500) {
    const batch = orderNos.slice(i, i + 500).map(o => ({ orderNo: o }));
    const r = await call('get_completion_details', { body: { orders: batch } });
    await sleep(SLEEP);
    if (!r.ok) { errors.push(r.error); continue; }
    for (const o of (r.data.orders || [])) byOrder.set(o.orderNo, o.data || null);
  }
  return { byOrder, errors };
}

// ------------------------------------------------------------------ the pull
const dates = dateRange(FROM, TO);
console.log(`pull-optimo-history — READ ONLY`);
console.log(`range ${FROM}..${TO} (${dates.length} ${WEEKENDS ? 'days' : 'weekdays'})  sleep=${SLEEP}ms`);
console.log(`out   ${OUT}\n`);

// depots (once) — the only account-level geography the API exposes on this key.
const depotRes = await call('get_depots');
await sleep(SLEEP);
const depots = depotRes.ok ? (depotRes.data.depots || []) : [];
if (!depotRes.ok) console.log(`get_depots failed: ${depotRes.error}`);
else console.log(`depots: ${depots.length}`);

const index = { generatedAt: new Date().toISOString(), range: { from: FROM, to: TO }, weekendsIncluded: WEEKENDS, dates: [], gaps: [] };
const driverSeen = new Map();   // name -> { dates:Set, stops, vehicles:Set }

for (const date of dates) {
  const routeRes = await call('get_routes', { query: `&date=${encodeURIComponent(date)}` });
  await sleep(SLEEP);

  if (!routeRes.ok) {
    console.log(`${date}  ROUTES FAILED: ${routeRes.error}`);
    index.gaps.push({ date, reason: `get_routes failed: ${routeRes.error}` });
    index.dates.push({ date, routes: 0, stops: 0, drivers: [], status: 'error' });
    continue;
  }
  const routes = routeRes.data.routes || [];
  if (!routes.length) {
    // A real gap: OptimoRoute held no plan for that date. Recorded, never filled in.
    console.log(`${date}  NO ROUTES (gap recorded)`);
    index.gaps.push({ date, reason: 'get_routes returned zero routes' });
    index.dates.push({ date, routes: 0, stops: 0, drivers: [], status: 'empty' });
    fs.writeFileSync(path.join(ROUTE_DIR, `${date}.json`), JSON.stringify({ date, routes: [], orders: 0, note: 'no routes held for this date' }, null, 1));
    continue;
  }

  const { orders, error: orderErr } = await fetchOrders(date);
  const orderByNo = new Map();
  for (const o of orders) if (o?.data?.orderNo) orderByNo.set(o.data.orderNo, o);

  const allOrderNos = routes.flatMap(r => (r.stops || []).map(s => s.orderNo)).filter(Boolean);
  const { byOrder: completions, errors: compErrs } = await fetchCompletions(allOrderNos);

  const outRoutes = [];
  let dayStops = 0;
  let completedCount = 0;

  for (const rt of routes) {
    const stops = (rt.stops || []).map(s => {
      const od = orderByNo.get(s.orderNo)?.data || null;
      const comp = completions.get(s.orderNo) || null;
      const arrMin = minsOf(s.arrivalTimeDt || s.scheduledAtDt);
      const serviceMin = od?.duration ?? null;
      if (comp && comp.status && comp.status !== 'scheduled') completedCount++;
      return {
        stopNumber: s.stopNumber,
        orderNo: s.orderNo,
        orderId: s.id,
        locationName: s.locationName || null,
        locationNo: s.locationNo || null,
        address: s.address || null,
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        scheduledAt: s.scheduledAt || null,
        scheduledAtDt: s.scheduledAtDt || null,
        arrivalTimeDt: s.arrivalTimeDt || null,
        arrivalMinutes: round(arrMin, 2),
        departureMinutes: arrMin != null && serviceMin != null ? round(arrMin + serviceMin, 2) : null,
        travelTimeSec: s.travelTime ?? null,       // seconds, leg from previous stop (or day start)
        travelDistanceM: s.distance ?? null,       // METRES — see learnings 2026-08-15
        serviceDurationMin: serviceMin,            // from the order record, not the route
        priority: od?.priority ?? null,
        orderType: od?.type ?? null,
        assignedTo: od?.assignedTo?.serial ?? null,
        timeWindows: od?.timeWindows ?? [],
        allowedDates: od?.allowedDates ?? null,
        orderNotes: od?.notes ?? null,
        completionStatus: comp?.status ?? null,
        completionStartTime: comp?.startTime?.utcTime ?? comp?.startTime ?? null,
        completionEndTime: comp?.endTime?.utcTime ?? comp?.endTime ?? null,
        completionTrackingUrl: comp?.tracking_url ?? null,
      };
    });

    const arrivals = stops.map(s => s.arrivalMinutes).filter(v => v != null);
    const first = stops[0] || null;
    const last = stops[stops.length - 1] || null;
    const legTravelSec = stops.reduce((a, s) => a + (s.travelTimeSec || 0), 0);
    const legDistanceM = stops.reduce((a, s) => a + (s.travelDistanceM || 0), 0);
    const serviceSum = stops.reduce((a, s) => a + (s.serviceDurationMin || 0), 0);

    const startMin = arrivals.length ? Math.min(...arrivals) - ((first?.travelTimeSec || 0) / 60) : null;
    const endMin = last && last.arrivalMinutes != null
      ? last.arrivalMinutes + (last.serviceDurationMin || 0)
      : null;

    dayStops += stops.length;
    const dname = rt.driverSerial || rt.driverName || '(unnamed)';
    if (!driverSeen.has(dname)) driverSeen.set(dname, { dates: new Set(), stops: 0, vehicles: new Set(), externalId: rt.driverExternalId || '' });
    const ds = driverSeen.get(dname);
    ds.dates.add(date);
    ds.stops += stops.length;
    if (rt.vehicleLabel) ds.vehicles.add(rt.vehicleLabel);

    outRoutes.push({
      driverSerial: rt.driverSerial ?? null,
      driverName: rt.driverName ?? null,
      driverExternalId: rt.driverExternalId ?? '',
      vehicleRegistration: rt.vehicleRegistration ?? null,
      vehicleLabel: rt.vehicleLabel ?? null,
      locked: rt.locked ?? null,
      // API route-level totals. distance is KILOMETRES, duration is MINUTES (learnings 2026-08-15).
      routeDistanceKm: rt.distance ?? null,
      routeDurationMin: rt.duration ?? null,
      load: { load1: rt.load1 ?? null, load2: rt.load2 ?? null, load3: rt.load3 ?? null, load4: rt.load4 ?? null },
      // Derived — get_routes exposes no route start/end location or time on this account.
      derived: {
        stopCount: stops.length,
        firstStopScheduledAt: first?.scheduledAt ?? null,
        lastStopScheduledAt: last?.scheduledAt ?? null,
        routeStartMinutes: round(startMin, 2),          // first arrival minus its inbound leg
        routeEndMinutes: round(endMin, 2),              // last arrival plus its service time
        onSiteSpanMinutes: startMin != null && endMin != null ? round(endMin - startMin, 2) : null,
        legTravelMinutes: round(legTravelSec / 60, 2),  // stop legs only, excludes the drive home
        legDistanceKm: round(legDistanceM / 1000, 3),
        legDistanceMiles: round(legDistanceM / 1609.344, 3),
        serviceMinutes: round(serviceSum, 2),
        // route total minus the legs = the unpaid/unmodelled tail (typically the drive home)
        unaccountedDistanceKm: rt.distance != null ? round(rt.distance - legDistanceM / 1000, 3) : null,
        unaccountedDurationMin: rt.duration != null ? round(rt.duration - legTravelSec / 60 - serviceSum, 2) : null,
        startLocation: null,   // not exposed by get_routes on this API key
        endLocation: null,
      },
      stops,
    });
  }

  const payload = {
    date,
    fetchedAt: new Date().toISOString(),
    source: 'optimoroute get_routes + search_orders + get_completion_details',
    units: { 'stops[].travelDistanceM': 'metres', 'stops[].travelTimeSec': 'seconds', routeDistanceKm: 'kilometres', routeDurationMin: 'minutes', serviceDurationMin: 'minutes' },
    orderCount: orders.length,
    ordersMatched: routes.flatMap(r => r.stops || []).filter(s => orderByNo.has(s.orderNo)).length,
    completionsWithActuals: completedCount,
    warnings: [orderErr && `search_orders: ${orderErr}`, ...compErrs.map(e => `get_completion_details: ${e}`)].filter(Boolean),
    routes: outRoutes,
  };
  fs.writeFileSync(path.join(ROUTE_DIR, `${date}.json`), JSON.stringify(payload, null, 1));

  const perDriver = outRoutes.map(r => `${(r.driverSerial || '?').split(' ')[0]}:${r.stops.length}`).join(' ');
  console.log(`${date}  routes=${routes.length} stops=${dayStops} orders=${orders.length} matched=${payload.ordersMatched} actuals=${completedCount}  ${perDriver}${payload.warnings.length ? '  WARN: ' + payload.warnings.join('; ') : ''}`);

  index.dates.push({
    date,
    routes: routes.length,
    stops: dayStops,
    orders: orders.length,
    completionsWithActuals: completedCount,
    drivers: outRoutes.map(r => ({ driver: r.driverSerial, stops: r.stops.length, routeDistanceKm: r.routeDistanceKm, routeDurationMin: r.routeDurationMin })),
    status: 'ok',
    warnings: payload.warnings,
  });
}

// ---------------------------------------------------------------- write index
index.totals = {
  datesRequested: dates.length,
  datesWithRoutes: index.dates.filter(d => d.status === 'ok').length,
  datesWithGaps: index.gaps.length,
  stops: index.dates.reduce((a, d) => a + (d.stops || 0), 0),
  completionsWithActuals: index.dates.reduce((a, d) => a + (d.completionsWithActuals || 0), 0),
};
fs.writeFileSync(path.join(OUT, 'optimo-routes', '_index.json'), JSON.stringify(index, null, 1));

fs.writeFileSync(path.join(OUT, 'optimo-drivers.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: 'get_drivers returns AUTH_KEY_UNKNOWN on this API key, so the roster is inferred from routes. Driver start/end locations are not exposed by any endpoint available here.',
  depots,
  drivers: [...driverSeen.entries()].sort().map(([name, d]) => ({
    driverSerial: name,
    driverExternalId: d.externalId,
    daysWithRoutes: d.dates.size,
    totalStops: d.stops,
    vehicles: [...d.vehicles],
    firstDate: [...d.dates].sort()[0],
    lastDate: [...d.dates].sort().slice(-1)[0],
  })),
}, null, 1));

console.log(`\nDONE  dates=${index.totals.datesRequested} withRoutes=${index.totals.datesWithRoutes} gaps=${index.totals.datesWithGaps} stops=${index.totals.stops} actuals=${index.totals.completionsWithActuals}`);
if (index.gaps.length) for (const g of index.gaps) console.log(`  GAP ${g.date} — ${g.reason}`);
