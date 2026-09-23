#!/usr/bin/env node
// summarize-jobber.mjs — local-only report over the pulled Jobber data. No network calls.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/jobber');
const jobs = JSON.parse(fs.readFileSync(path.join(D, 'jobs.json'), 'utf8'));
const visits = JSON.parse(fs.readFileSync(path.join(D, 'visits.json'), 'utf8'));

const productOf = j => {
  const all = (j.lineItems || []).map(l => String(l.name || '').toLowerCase()).join(' | ');
  if (/total mole control/.test(all)) return 'TMCP';
  if (/quick fix/.test(all)) return 'Quick Fix';
  if (/tmcp deposit/.test(all)) return 'TMCP deposit';
  if (/friends and family/.test(all)) return 'Friends and family';
  if (/barter/.test(all)) return 'Barter';
  if (!(j.lineItems || []).length) return 'none (bid)';
  return 'other';
};

const byNum = new Map(jobs.map(j => [j.jobNumber, j]));
const defaultOf = j => (j.visitSchedule.assignedTo[0]?.name) || null;

// --- visits vs job-level default assignee ---
let matched = 0, differ = 0, noDefault = 0, unassigned = 0, notInJobs = 0;
const differBy = {};
for (const v of visits) {
  const j = byNum.get(v.jobNumber);
  if (!j) { notInJobs++; continue; }
  const d = defaultOf(j);
  if (!d) { noDefault++; continue; }
  if (!v.techs.length) { unassigned++; continue; }
  if (v.techs.includes(d)) matched++;
  else { differ++; const k = d + ' -> ' + v.techs.join('/'); differBy[k] = (differBy[k] || 0) + 1; }
}
console.log(`visits ${visits.length}  | job default matches visit tech ${matched}  differs ${differ}  job has no default ${noDefault}  visit unassigned ${unassigned}  job not in jobs.json ${notInJobs}`);
console.log('top default->actual mismatches:');
for (const [k, n] of Object.entries(differBy).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log('   ' + String(n).padStart(4), k);

// --- visit completion / future split ---
const today = '2026-09-18';
const done = visits.filter(v => v.isComplete).length;
const future = visits.filter(v => String(v.startAt).slice(0, 10) > today).length;
const pastIncomplete = visits.filter(v => !v.isComplete && String(v.startAt).slice(0, 10) <= today).length;
console.log(`\nvisits complete ${done}  future (> ${today}) ${future}  past-but-incomplete ${pastIncomplete}`);
const stat = {}; for (const v of visits) stat[v.visitStatus] = (stat[v.visitStatus] || 0) + 1;
console.log('visitStatus:', JSON.stringify(stat));
let coords = 0, nogeo = 0; for (const v of visits) { if (v.lat != null) coords++; else nogeo++; }
console.log(`visit property coordinates present ${coords}, missing ${nogeo}`);

// --- product breakdown on visits ---
const pv = {}; for (const v of visits) { const j = byNum.get(v.jobNumber); const p = j ? productOf(j) : 'unknown job'; pv[p] = (pv[p] || 0) + 1; }
console.log('visits by product:', JSON.stringify(pv));

// --- weekend defect check ---
const wk = visits.filter(v => { const d = new Date(v.startAt); const dow = d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' }); return dow === 'Sat' || dow === 'Sun'; });
console.log(`weekend visits in window: ${wk.length}`);
