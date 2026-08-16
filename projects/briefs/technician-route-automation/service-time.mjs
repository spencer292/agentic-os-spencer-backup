// PER-TECH SERVICE TIME — the single place every order writer gets its `duration` from.
//
// Before 2026-08-11 each writer hard-coded `duration: isSet ? 20 : 10`, so OptimoRoute planned
// every technician at one pace. Numbers and reasoning live in tech-service-times.json.
//
// Usage:
//   import { serviceDuration, serviceTimeSummary } from './service-time.mjs';
//   duration: serviceDuration(tech, isSet, jobNumber)   // tech = full name as Jobber spells it
//
// An unknown or missing tech falls back to `default` and is LOGGED once per name — a silent
// fallback is how a new hire ends up planned at somebody else's pace for a month.
//
// CLUSTERS (2026-08-15): a job listed in a `clusters` entry is priced by the PLACE, not the tech —
// totalMinutes split evenly across the cluster's jobs. Barbee Mill was 11 separate Jobber jobs
// inside a 0.18-mile radius, booked at 11 x 15 min = 2h45m against a real 90-120 min. Passing
// jobNumber is optional; a caller that omits it simply gets the per-tech number as before.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'tech-service-times.json');

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const BY_NAME = {};
for (const [name, v] of Object.entries(CONFIG.techs || {})) BY_NAME[name.trim().toLowerCase()] = v;

const warned = new Set();

// jobNumber -> { name, minutes } for every job that belongs to a cluster.
const CLUSTER_BY_JOB = {};
for (const [name, c] of Object.entries(CONFIG.clusters || {})) {
  const jobs = c.jobs || [];
  if (!jobs.length || !c.totalMinutes) continue;
  const each = Math.max(1, Math.round(c.totalMinutes / jobs.length));
  for (const j of jobs) CLUSTER_BY_JOB[String(j)] = { name, minutes: each };
}

/** The cluster this job belongs to, or null. Exported so callers can report what they priced. */
export function clusterFor(jobNumber) {
  return jobNumber == null ? null : (CLUSTER_BY_JOB[String(jobNumber)] || null);
}

/**
 * Minutes of on-site time to plan for this tech at this stop.
 * A job inside a cluster is priced by the place and ignores both `tech` and `isSet`.
 */
export function serviceDuration(tech, isSet, jobNumber) {
  const cluster = clusterFor(jobNumber);
  if (cluster) return cluster.minutes;
  const key = (tech || '').trim().toLowerCase();
  const rec = key ? BY_NAME[key] : null;
  if (!rec) {
    const label = tech ? `"${tech}"` : '(no tech assigned)';
    if (!warned.has(key)) {
      warned.add(key);
      console.log(`  [service-time] ${label} is not in tech-service-times.json — using default ${CONFIG.default.check}/${CONFIG.default.set} min`);
    }
    return isSet ? CONFIG.default.set : CONFIG.default.check;
  }
  return isSet ? rec.set : rec.check;
}

/** One line per tech, for the run header so every log says which pace it planned at. */
export function serviceTimeSummary() {
  const parts = Object.entries(CONFIG.techs || {}).map(([n, v]) => `${n.split(' ')[0]} ${v.check}/${v.set}`);
  let out = `service time (check/set min, updated ${CONFIG.updated}): ${parts.join('  ')}  |  default ${CONFIG.default.check}/${CONFIG.default.set}`;
  for (const [name, c] of Object.entries(CONFIG.clusters || {})) {
    const n = (c.jobs || []).length;
    out += `\ncluster: ${name} — ${c.totalMinutes} min across ${n} job(s) = ${Math.max(1, Math.round(c.totalMinutes / n))} min each`;
  }
  return out;
}

export const SERVICE_TIME_CONFIG = CONFIG;
