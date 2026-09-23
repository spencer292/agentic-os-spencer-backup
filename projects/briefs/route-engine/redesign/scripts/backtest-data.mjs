#!/usr/bin/env node
/**
 * backtest-data.mjs
 *
 * Loads every offline input the backtest needs and reconstructs a golden week
 * "as it was known on the Friday before at 14:00 PT".
 *
 * Nothing here touches the network. Every file read is under redesign/data/ or
 * ../data/ (the route-engine project data folder).
 *
 * Exports
 *   ptDate(iso)                 -> 'YYYY-MM-DD' in America/Los_Angeles
 *   ptMinutes(iso)              -> minutes past PT midnight
 *   weekDays(mondayISO)         -> the five Mon..Fri ISO dates
 *   loadRaw()                   -> cached raw files
 *   buildSnapshot({ week })     -> the plan-time snapshot + the actual board
 *
 * Snapshot contract (what a policy is handed):
 *   week, days[5], asOf            the Friday 14:00 PT cutoff, as an ISO instant
 *   techs[]                        roster active in the golden week
 *   startAreas{tech}               inferred home/start point from travel-model.json
 *   due[]                          visits due that week and KNOWN at the cutoff
 *   lateBookings[]                 visits due that week but created after the cutoff
 *   history[]                      completed visits strictly before the week Monday
 *   jobsByNumber{}                 job record incl. product + property coordinates
 *   actual: Map(key -> {tech,date,source})     what actually ran (stamp-first)
 *   optimoHeld: Map(key -> {tech,date,seq})    the OptimoRoute route as held
 *   serviceMin: Map(key -> minutes)            service time, taken from OR where known
 *   ghosts[]                       OR orders with no matching Jobber visit
 *
 * A visit key is `<jobNumber>-<visitNumericId>` — the same string OptimoRoute
 * carries as orderNo. Verified at 99.7% on the golden weeks (see S5-harness.md).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REDESIGN = path.resolve(__dirname, '..');
export const PROJECT = path.resolve(REDESIGN, '..');

const F = {
  visits: path.join(REDESIGN, 'data', 'jobber', 'visits.json'),
  jobs: path.join(REDESIGN, 'data', 'jobber', 'jobs.json'),
  travelModel: path.join(REDESIGN, 'data', 'travel-model.json'),
  optimoDir: path.join(REDESIGN, 'data', 'optimo-routes'),
  optimoDrivers: path.join(REDESIGN, 'data', 'optimo-drivers.json'),
  completed: path.join(PROJECT, 'data', 'completed-visits_2026-08-17_2026-09-17.json'),
  planVsActual: path.join(REDESIGN, 'data', 'plan-vs-actual.json'),
};

// ---------------------------------------------------------------- PT clock

const PT_TZ = 'America/Los_Angeles';
const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: PT_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: PT_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** 'YYYY-MM-DD' for an instant, in Pacific time. */
export function ptDate(iso) {
  if (!iso) return null;
  return dateFmt.format(new Date(iso));
}

/** Minutes past Pacific midnight for an instant. */
export function ptMinutes(iso) {
  if (!iso) return null;
  const [h, m, s] = timeFmt.format(new Date(iso)).split(':').map(Number);
  return h * 60 + m + s / 60;
}

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** Day-of-week name for a 'YYYY-MM-DD' calendar date (no timezone shift). */
export function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
export function isWeekend(dateStr) {
  const d = dowOf(dateStr);
  return d === 'sat' || d === 'sun';
}

/** Mon..Fri ISO dates for a week given its Monday. */
export function weekDays(mondayISO) {
  const [y, m, d] = mondayISO.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  return [0, 1, 2, 3, 4].map((i) => new Date(base + i * 86400e3).toISOString().slice(0, 10));
}

/** Add days to a 'YYYY-MM-DD'. */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400e3).toISOString().slice(0, 10);
}

/**
 * The plan-time cutoff: 14:00 PT on the Friday before the golden week.
 * Returned as an ISO instant so it can be compared against raw createdAt values.
 */
export function fridayCutoff(mondayISO) {
  const friday = addDays(mondayISO, -3);
  // Find the UTC instant whose PT wall-clock is friday 14:00. Aug/Sep is PDT
  // (UTC-7) but resolve it rather than assume, so the harness survives DST.
  for (const offset of [7, 8]) {
    const guess = new Date(`${friday}T${String(14 + offset).padStart(2, '0')}:00:00Z`);
    if (ptDate(guess) === friday && Math.abs(ptMinutes(guess) - 840) < 0.01) {
      return guess.toISOString();
    }
  }
  throw new Error(`fridayCutoff: could not resolve 14:00 PT for ${friday}`);
}

// ---------------------------------------------------------------- loading

/** Numeric tail of a base64 Jobber gid: 'gid://Jobber/Visit/2037613851' -> '2037613851'. */
export function gidTail(gid) {
  return Buffer.from(gid, 'base64').toString('utf8').split('/').pop();
}

export function visitKey(visit) {
  return `${visit.jobNumber}-${gidTail(visit.id)}`;
}

let RAW = null;

export function loadRaw() {
  if (RAW) return RAW;
  const visits = JSON.parse(fs.readFileSync(F.visits, 'utf8'));
  const jobs = JSON.parse(fs.readFileSync(F.jobs, 'utf8'));
  const travelModel = JSON.parse(fs.readFileSync(F.travelModel, 'utf8'));

  let completed = [];
  if (fs.existsSync(F.completed)) completed = JSON.parse(fs.readFileSync(F.completed, 'utf8'));

  const optimoByDate = new Map();
  if (fs.existsSync(F.optimoDir)) {
    for (const f of fs.readdirSync(F.optimoDir).filter((x) => /^\d{4}-\d{2}-\d{2}\.json$/.test(x))) {
      const day = JSON.parse(fs.readFileSync(path.join(F.optimoDir, f), 'utf8'));
      optimoByDate.set(f.slice(0, 10), day);
    }
  }

  const jobsByNumber = new Map();
  for (const j of jobs) jobsByNumber.set(j.jobNumber, j);

  RAW = { visits, jobs, jobsByNumber, travelModel, completed, optimoByDate };
  return RAW;
}

/** Product from the job's line items — per the standing rule, NOT from jobType. */
export function productOf(job) {
  if (!job || !Array.isArray(job.lineItems)) return 'OTHER';
  for (const li of job.lineItems) {
    const n = String(li?.name || '').toLowerCase();
    if (n.includes('total mole control')) return 'TMCP';
    if (n.includes('quick fix')) return 'QUICK_FIX';
  }
  for (const li of job.lineItems) {
    const n = String(li?.name || '').toLowerCase();
    if (n.includes('barter')) return 'BARTER';
  }
  return job.lineItems.length ? 'OTHER' : 'BID';
}

function visitRecord(v, jobsByNumber) {
  const job = jobsByNumber.get(v.jobNumber) || null;
  const lat = v.lat ?? job?.property?.lat ?? null;
  const lng = v.lng ?? job?.property?.lng ?? null;
  return {
    key: visitKey(v),
    visitId: v.id,
    jobNumber: v.jobNumber,
    title: v.title,
    clientName: v.clientName,
    lat,
    lng,
    zip: v.postalCode ?? job?.property?.postalCode ?? null,
    city: v.city ?? job?.property?.city ?? null,
    startAt: v.startAt,
    startDate: ptDate(v.startAt),
    createdAt: v.createdAt,
    completedAt: v.completedAt,
    isComplete: !!v.isComplete,
    visitStatus: v.visitStatus,
    jobStatus: v.jobStatus,
    scheduledTechs: v.techs || [],
    durationMin: v.duration ?? null,
    product: productOf(job),
  };
}

// ---------------------------------------------------------------- snapshot

/**
 * Reconstruct a golden week.
 * @param {{week:string, asOf?:string}} opts week = the Monday, 'YYYY-MM-DD'
 */
export function buildSnapshot({ week, asOf } = {}) {
  const raw = loadRaw();
  const days = weekDays(week);
  const daySet = new Set(days);
  const cutoff = asOf || fridayCutoff(week);
  const cutoffMs = new Date(cutoff).getTime();

  // --- the OptimoRoute route as held, for the five days of the week
  const optimoHeld = new Map();
  const orService = new Map();
  const orCoord = new Map();
  const heldRouteDays = new Map(); // `${tech}|${date}` -> [{key,seq,lat,lng,serviceMin}]
  for (const date of days) {
    const day = raw.optimoByDate.get(date);
    if (!day || !day.routes) continue;
    for (const route of day.routes) {
      const tech = route.driverSerial || route.driverName || 'UNKNOWN';
      const list = [];
      for (const s of route.stops || []) {
        optimoHeld.set(s.orderNo, { tech, date, seq: s.stopNumber });
        if (s.serviceDurationMin != null) orService.set(s.orderNo, s.serviceDurationMin);
        if (s.latitude != null) orCoord.set(s.orderNo, { lat: s.latitude, lng: s.longitude });
        list.push({
          key: s.orderNo,
          seq: s.stopNumber,
          lat: s.latitude,
          lng: s.longitude,
          serviceMin: s.serviceDurationMin ?? 0,
        });
      }
      list.sort((a, b) => a.seq - b.seq);
      heldRouteDays.set(`${tech}|${date}`, list);
    }
  }

  // --- Jobber visits: the due universe
  const byKey = new Map();
  for (const v of raw.visits) byKey.set(visitKey(v), v);

  const candidates = [];
  for (const v of raw.visits) {
    const sd = ptDate(v.startAt);
    const cd = v.completedAt ? ptDate(v.completedAt) : null;
    if (daySet.has(sd) || (cd && daySet.has(cd))) candidates.push(v);
  }

  const due = [];
  const lateBookings = [];
  for (const v of candidates) {
    const rec = visitRecord(v, raw.jobsByNumber);
    // prefer the OptimoRoute coordinate when the stop was actually routed: it is
    // the coordinate the real route was built on.
    const c = orCoord.get(rec.key);
    if (c) {
      rec.orLat = c.lat;
      rec.orLng = c.lng;
      rec.lat = c.lat;
      rec.lng = c.lng;
    }
    const created = new Date(rec.createdAt).getTime();
    if (Number.isFinite(created) && created > cutoffMs) {
      rec.lateBooking = true;
      lateBookings.push(rec);
    } else {
      due.push(rec);
    }
  }

  // --- completion stamps: what actually ran
  const stamps = new Map(); // key -> {tech, date, completedAt}
  for (const c of raw.completed) {
    const k = `${c.job}-${gidTail(c.id)}`;
    if (!c.completedAt) continue;
    stamps.set(k, { tech: c.tech, date: ptDate(c.completedAt), completedAt: c.completedAt });
  }
  // visits.json carries its own completion stamps and covers a wider window
  for (const v of raw.visits) {
    if (!v.isComplete || !v.completedAt) continue;
    const k = visitKey(v);
    if (stamps.has(k)) continue;
    stamps.set(k, {
      tech: (v.techs || [])[0] || null,
      date: ptDate(v.completedAt),
      completedAt: v.completedAt,
    });
  }

  // --- the actual board, stamp-first, then the held OR route, then the schedule
  const allDue = [...due, ...lateBookings];
  const actual = new Map();
  for (const rec of allDue) {
    const st = stamps.get(rec.key);
    if (st && st.tech && daySet.has(st.date)) {
      actual.set(rec.key, { tech: st.tech, date: st.date, source: 'stamp', completedAt: st.completedAt });
      continue;
    }
    const held = optimoHeld.get(rec.key);
    if (held) {
      actual.set(rec.key, { tech: held.tech, date: held.date, source: 'optimo-held', seq: held.seq });
      continue;
    }
    if (st && st.tech) {
      // ran, but on a day outside the golden week
      actual.set(rec.key, {
        tech: st.tech,
        date: st.date,
        source: 'stamp-offweek',
        completedAt: st.completedAt,
      });
      continue;
    }
    if (rec.scheduledTechs.length) {
      actual.set(rec.key, { tech: rec.scheduledTechs[0], date: rec.startDate, source: 'schedule' });
    }
  }

  // --- OR orders with no matching Jobber visit
  const ghosts = [];
  for (const [k, held] of optimoHeld) {
    if (!byKey.has(k)) ghosts.push({ key: k, ...held });
  }

  // --- service minutes per visit. Use the OptimoRoute figure where the stop was
  // routed so proposal and actual are timed with identical service, which keeps
  // the sequence comparison about travel. Otherwise fall back to the tech median.
  const techServiceSamples = new Map();
  for (const [k, mins] of orService) {
    const held = optimoHeld.get(k);
    if (!held) continue;
    if (!techServiceSamples.has(held.tech)) techServiceSamples.set(held.tech, []);
    techServiceSamples.get(held.tech).push(mins);
  }
  const techServiceMedian = new Map();
  for (const [t, xs] of techServiceSamples) {
    const s = xs.slice().sort((a, b) => a - b);
    techServiceMedian.set(t, s[s.length >> 1]);
  }
  const allServiceMedian = (() => {
    const xs = [...orService.values()].sort((a, b) => a - b);
    return xs.length ? xs[xs.length >> 1] : 15;
  })();
  const serviceMin = new Map();
  for (const rec of allDue) {
    if (orService.has(rec.key)) {
      serviceMin.set(rec.key, orService.get(rec.key));
      continue;
    }
    const a = actual.get(rec.key);
    const t = a?.tech;
    serviceMin.set(rec.key, (t && techServiceMedian.get(t)) ?? allServiceMedian);
  }

  // --- history: completed strictly before the week Monday, for no-lookahead policies
  const history = [];
  for (const v of raw.visits) {
    if (!v.isComplete || !v.completedAt) continue;
    const d = ptDate(v.completedAt);
    if (d >= week) continue;
    const tech = (v.techs || [])[0];
    if (!tech) continue;
    history.push({
      key: visitKey(v),
      jobNumber: v.jobNumber,
      tech,
      date: d,
      dow: dowOf(d),
      zip: v.postalCode || null,
      lat: v.lat ?? null,
      lng: v.lng ?? null,
    });
  }
  history.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // --- roster: techs who actually held a route in the week
  const techs = [...new Set([...heldRouteDays.keys()].map((k) => k.split('|')[0]))].sort();
  const startAreas = {};
  for (const t of techs) {
    const sa = raw.travelModel.inferredStartArea?.[t];
    if (sa) startAreas[t] = { lat: sa.lat, lng: sa.lng, address: sa.address, routeStartMinutes: sa.medianRouteStartMinutes };
  }
  // a tech with no inferred start falls back to the centroid of their week's stops
  for (const t of techs) {
    if (startAreas[t]) continue;
    const pts = [];
    for (const [k, list] of heldRouteDays) if (k.startsWith(`${t}|`)) pts.push(...list);
    if (!pts.length) continue;
    startAreas[t] = {
      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
      address: '(centroid fallback — no inferred start area)',
      routeStartMinutes: 420,
      fallback: true,
    };
  }

  return {
    week,
    days,
    daySet,
    asOf: cutoff,
    techs,
    startAreas,
    due,
    lateBookings,
    history,
    jobsByNumber: raw.jobsByNumber,
    actual,
    optimoHeld,
    heldRouteDays,
    serviceMin,
    ghosts,
    stamps,
  };
}
