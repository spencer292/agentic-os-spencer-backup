#!/usr/bin/env node
/**
 * Policy: dominant-routeday
 *
 * The crude static master route. For every job, look only at completed visits
 * from BEFORE the golden week and take the (tech, weekday) pair that job was
 * most often served on. Every due visit of that job goes to that tech on that
 * weekday's date inside the golden week.
 *
 * Strictly no lookahead: it never reads snap.actual, and its history is cut at
 * the week's Monday. That makes it an honest answer to "how far does a fixed
 * master route get on its own, before any cadence or capacity logic".
 *
 * Fallback ladder, for jobs with no prior history (counted in notes.tiers):
 *   1. job history        the job's own dominant (tech, weekday)
 *   2. zip history        the dominant (tech, weekday) across that ZIP's history
 *   3. nearest start      the tech whose inferred start area is closest, on that
 *                         tech's busiest weekday in the history
 *   4. floor              first tech in the roster, Wednesday
 */

import { dowOf, weekDays } from '../backtest-data.mjs';

export const name = 'dominant-routeday';
export const description =
  'Static master route — each job to the tech and weekday it was most often served on before the week.';
export const usesOracle = false;

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Most frequent value; ties broken by the most recent observation. */
function dominant(rows, keyFn) {
  const counts = new Map();
  const latest = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    counts.set(k, (counts.get(k) || 0) + 1);
    if (!latest.has(k) || r.date > latest.get(k)) latest.set(k, r.date);
  }
  let best = null;
  let bestCount = -1;
  let bestDate = '';
  for (const [k, c] of counts) {
    const d = latest.get(k);
    if (c > bestCount || (c === bestCount && d > bestDate)) {
      best = k;
      bestCount = c;
      bestDate = d;
    }
  }
  return best == null ? null : { value: best, count: bestCount, of: rows.length, lastSeen: bestDate };
}

export function propose(snap) {
  const days = weekDays(snap.week);
  const dateForDow = new Map(days.map((d) => [dowOf(d), d]));

  // history is already cut at the week Monday by the snapshot builder
  const byJob = new Map();
  const byZip = new Map();
  const byTech = new Map();
  for (const h of snap.history) {
    if (!WEEKDAYS.includes(h.dow)) continue; // ignore stray weekend stamps
    if (!byJob.has(h.jobNumber)) byJob.set(h.jobNumber, []);
    byJob.get(h.jobNumber).push(h);
    if (h.zip) {
      if (!byZip.has(h.zip)) byZip.set(h.zip, []);
      byZip.get(h.zip).push(h);
    }
    if (!byTech.has(h.tech)) byTech.set(h.tech, []);
    byTech.get(h.tech).push(h);
  }

  const techBusiestDow = new Map();
  for (const [t, rows] of byTech) {
    const d = dominant(rows, (r) => r.dow);
    techBusiestDow.set(t, d ? d.value : 'wed');
  }

  const roster = snap.techs.slice();
  const tiers = { job: 0, zip: 0, nearestStart: 0, floor: 0 };
  const assignments = [];
  const decisionsByJob = new Map();

  for (const v of snap.due) {
    let decision = decisionsByJob.get(v.jobNumber);
    if (!decision) {
      decision = decide(v);
      decisionsByJob.set(v.jobNumber, decision);
    }
    tiers[decision.tier] += 1;
    assignments.push({ key: v.key, tech: decision.tech, date: decision.date });
  }

  function decide(v) {
    const jobRows = byJob.get(v.jobNumber) || [];
    if (jobRows.length) {
      const d = dominant(jobRows, (r) => `${r.tech}|${r.dow}`);
      const [tech, dow] = d.value.split('|');
      if (roster.includes(tech) && dateForDow.has(dow)) {
        return { tier: 'job', tech, date: dateForDow.get(dow), support: d };
      }
      // the dominant tech has left the roster: keep the weekday, re-home the tech
      if (dateForDow.has(dow)) {
        const t = nearestTech(v);
        if (t) return { tier: 'job', tech: t, date: dateForDow.get(dow), support: d };
      }
    }
    const zipRows = v.zip ? byZip.get(v.zip) || [] : [];
    if (zipRows.length) {
      const d = dominant(zipRows, (r) => `${r.tech}|${r.dow}`);
      const [tech, dow] = d.value.split('|');
      if (roster.includes(tech) && dateForDow.has(dow)) {
        return { tier: 'zip', tech, date: dateForDow.get(dow), support: d };
      }
    }
    const t = nearestTech(v);
    if (t) {
      const dow = techBusiestDow.get(t) || 'wed';
      return { tier: 'nearestStart', tech: t, date: dateForDow.get(dow) || dateForDow.get('wed') };
    }
    return { tier: 'floor', tech: roster[0], date: dateForDow.get('wed') || days[2] };
  }

  function nearestTech(v) {
    if (v.lat == null) return roster[0] || null;
    let best = null;
    let bestKm = Infinity;
    for (const t of roster) {
      const sa = snap.startAreas[t];
      if (!sa) continue;
      const km = haversineKm(v.lat, v.lng, sa.lat, sa.lng);
      if (km < bestKm) {
        bestKm = km;
        best = t;
      }
    }
    return best;
  }

  return {
    assignments,
    notes: {
      tiers,
      jobsWithHistory: byJob.size,
      historyVisits: snap.history.length,
      historyDays: new Set(snap.history.map((h) => h.date)).size,
      comment:
        'History is every completed visit strictly before the golden week Monday. No lookahead, no oracle.',
    },
  };
}
