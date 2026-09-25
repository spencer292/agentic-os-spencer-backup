#!/usr/bin/env node
// model-tech-contribution.mjs — per-technician contribution: revenue serviced vs fully loaded labor.
//
// Revenue side (KNOWN, Jobber): each job's contract value is spread over the window and split
// between the techs who completed its visits, by visit share. A TMCP job pays the same per month
// whether it took one visit or five, so revenue per VISIT is a mix artefact; revenue per PAID HOUR
// and cost per VISIT are the numbers that compare techs.
// Cost side: paid hours from the Gusto export (KNOWN, hours only). Hourly rates are read at run time
// from cfo-private/tech-rates.json (gitignored) if present; otherwise the model uses the company-
// average loaded cost per paid hour from the Gusto payroll-trends export and tags it ESTIMATE.
//
// Per-person dollar figures are written ONLY to cfo-private/. The committed output under
// projects/briefs/cfo/data/ carries revenue, hours and visits per tech (no pay) plus the aggregate.
//
// Usage (repo root):
//   node projects/briefs/cfo/scripts/model-tech-contribution.mjs [--from YYYY-MM-DD --to YYYY-MM-DD]
//        [--visits <path>] [--jobs <path>] [--hours <path>] [--rates <path>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2026-08-17'), TO = arg('to', '2026-09-17');
const VISITS = arg('visits', 'projects/briefs/route-engine/redesign/data/jobber/visits.json');
const JOBS = arg('jobs', 'projects/briefs/route-engine/redesign/data/jobber/jobs.json');
const BOOK = 'projects/briefs/cfo/data/active-book.json';
const HOURS = arg('hours', 'projects/briefs/route-engine/redesign/private/gusto/paid-hours.json');
const RATES = arg('rates', 'cfo-private/tech-rates.json');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const days = (Date.parse(TO) - Date.parse(FROM)) / 86400000 + 1; const weeks = days / 7;
const pacDate = iso => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

// ---- jobs: contract value per week
const jobsRaw = rd(JOBS); const jobs = Array.isArray(jobsRaw) ? jobsRaw : (jobsRaw.nodes || jobsRaw.jobs);
const book = rd(BOOK).nodes; const bookBy = new Map(book.map(j => [j.jobNumber, j]));
const product = j => { const names = (j.lineItems?.nodes || j.lineItems || []).map(l => (l.name || '').toLowerCase()); if (names.some(n => /total mole control/.test(n))) return 'TMCP'; if (names.some(n => /quick fix/.test(n))) return 'QF'; return 'OTHER'; };
const jobInfo = new Map();
for (const j of jobs) {
  const b = bookBy.get(j.jobNumber); const sched = b?.invoiceSchedule?.scheduleSummary || ''; const freq = b?.invoiceSchedule?.billingFrequency || 'UNKNOWN';
  const p = product(b || j); const total = +(b?.total ?? j.total ?? 0);
  let perWeek = null, perVisit = null, basis;
  if (p === 'QF') { perVisit = total / 5; basis = 'quick fix: total / 5 visits'; }
  else if (/monthly/i.test(sched) || (freq === 'PERIODIC' && !sched)) { perWeek = total * 12 / 52; basis = 'monthly x12/52'; }
  else if (/yearly/i.test(sched)) { perWeek = total / 52; basis = 'yearly /52'; }
  else if (/90 days|3 months/i.test(sched)) { perWeek = total / 13; basis = 'quarterly /13'; }
  else if (freq === 'ON_COMPLETION') { perVisit = total / 5; basis = 'on-completion: total / 5 visits (assumed series)'; }
  else { perWeek = total * 12 / 52; basis = 'assumed monthly (' + freq + ')'; }
  jobInfo.set(j.jobNumber, { product: p, total, perWeek, perVisit, basis, client: (b || j).client?.name });
}

// ---- visits in window, per job per tech
const visits = rd(VISITS).filter(v => v.isComplete && v.completedAt);
const inWin = visits.filter(v => { const d = pacDate(v.completedAt); return d >= FROM && d <= TO; });
const byJob = new Map();
for (const v of inWin) { const t = v.techs?.[0] || 'Unassigned'; const m = byJob.get(v.jobNumber) || new Map(); m.set(t, (m.get(t) || 0) + 1); byJob.set(v.jobNumber, m); }

const techs = {}; let unknownJobs = 0, unknownVisits = 0;
const T = n => techs[n] ||= { tech: n, visits: 0, jobs: 0, revenue: 0, rev_tmcp: 0, rev_qf: 0, rev_other: 0, jobs_tmcp: 0, jobs_qf: 0 };
for (const [jn, m] of byJob) {
  const info = jobInfo.get(jn); const jv = [...m.values()].reduce((a, b) => a + b, 0);
  if (!info) { unknownJobs++; unknownVisits += jv; for (const [t, n] of m) { const x = T(t); x.visits += n; x.jobs++; } continue; }
  const winRev = info.perVisit != null ? Math.min(info.perVisit * jv, info.total) : info.perWeek * weeks;
  for (const [t, n] of m) { const x = T(t); const share = n / jv; x.visits += n; x.jobs++; const r = winRev * share; x.revenue += r; if (info.product === 'TMCP') { x.rev_tmcp += r; x.jobs_tmcp++; } else if (info.product === 'QF') { x.rev_qf += r; x.jobs_qf++; } else x.rev_other += r; }
}

// ---- paid hours (Gusto), window-limited
const hours = rd(HOURS).rows.filter(r => r.date >= FROM && r.date <= TO);
for (const r of hours) { const x = T(r.tech); x.paidHours = (x.paidHours || 0) + r.totalHours; x.otHours = (x.otHours || 0) + r.overtime; x.fieldDays = (x.fieldDays || 0) + (r.totalHours > 0 ? 1 : 0); }

// ---- rates
let rates = null, rateTag = 'ESTIMATE', rateNote;
if (fs.existsSync(path.join(ROOT, RATES))) { rates = rd(RATES); rateTag = 'KNOWN'; rateNote = 'per-tech rates from ' + RATES; }
else { rateNote = 'no ' + RATES + ' — using company-average loaded cost per paid hour (Gusto payroll trends, Aug 2026: employer cost / (regular+OT hours))'; }
const AVG_LOADED = 33.2; // Gusto payroll trends Aug 2026: 32,832.61 / 988.9 h. Includes salaried + office in the numerator and hourly-only hours in the denominator, so it overstates a field tech's rate.
const BURDEN = 0.115; // Gusto payroll trends: employer cost / gross earnings, Jul-Sep 2026 = 1.113-1.117
const laborCost = x => {
  if (rates && rates[x.tech]?.salaryAnnual) { const r = rates[x.tech]; return { cost: r.salaryAnnual / 52 * weeks * (1 + BURDEN), basis: 'salary/52 x weeks x (1+burden)' }; }
  if (!x.paidHours) return null;
  if (rates && rates[x.tech]) { const r = rates[x.tech]; const reg = x.paidHours - x.otHours; return { cost: (reg * r.hourly + x.otHours * r.hourly * 1.5) * (1 + BURDEN), basis: 'hourly x reg + 1.5x OT, x (1+burden ' + BURDEN + ')' }; }
  return { cost: x.paidHours * AVG_LOADED, basis: 'paid hours x company-average loaded ' + AVG_LOADED + '/h (ESTIMATE)' };
};

// ---- report
const rows = Object.values(techs).filter(x => x.visits >= 20).sort((a, b) => b.revenue - a.revenue);
const f = n => n == null ? '—' : Math.round(n).toLocaleString('en-US');
const f1 = n => n == null ? '—' : n.toFixed(1);
console.log(`Window ${FROM}..${TO} (${days} days, ${weeks.toFixed(2)} weeks). Visits in window: ${inWin.length}. Jobs with no contract record: ${unknownJobs} (${unknownVisits} visits, revenue not attributed).`);
console.log(`Rates: ${rateTag} — ${rateNote}\n`);
console.log('tech'.padEnd(17) + 'visits jobs  rev$/win  rev$/wk rev$/visit  TMCP%  paid_h  OT_h rev$/paid_h  labor$  cost$/visit  contrib$  margin');
const pub = [], priv = [];
for (const x of rows) {
  const lc = laborCost(x); const contrib = lc ? x.revenue - lc.cost : null;
  console.log(x.tech.padEnd(17) + String(x.visits).padStart(6) + String(x.jobs).padStart(5) + f(x.revenue).padStart(10) + f(x.revenue / weeks).padStart(9) + f(x.revenue / x.visits).padStart(11) + (x.revenue ? (100 * x.rev_tmcp / x.revenue).toFixed(0) + '%' : '—').padStart(7) + f1(x.paidHours).padStart(8) + f1(x.otHours).padStart(6) + (x.paidHours ? f(x.revenue / x.paidHours) : '—').padStart(12) + (lc ? f(lc.cost) : '—').padStart(8) + (lc ? f(lc.cost / x.visits) : '—').padStart(13) + (contrib != null ? f(contrib) : '—').padStart(10) + (contrib != null ? (100 * contrib / x.revenue).toFixed(0) + '%' : '—').padStart(8));
  pub.push({ tech: x.tech, visits: x.visits, jobs: x.jobs, jobs_tmcp: x.jobs_tmcp, jobs_qf: x.jobs_qf, revenue_window: +x.revenue.toFixed(0), revenue_per_week: +(x.revenue / weeks).toFixed(0), revenue_per_visit: +(x.revenue / x.visits).toFixed(2), revenue_tmcp: +x.rev_tmcp.toFixed(0), revenue_qf: +x.rev_qf.toFixed(0), paid_hours: x.paidHours ?? null, ot_hours: x.otHours ?? null, revenue_per_paid_hour: x.paidHours ? +(x.revenue / x.paidHours).toFixed(2) : null });
  priv.push({ ...pub.at(-1), labor_cost: lc ? +lc.cost.toFixed(0) : null, labor_basis: lc?.basis, rate_tag: lc ? (rates && rates[x.tech] ? 'KNOWN' : 'ESTIMATE') : 'UNKNOWN', cost_per_visit: lc ? +(lc.cost / x.visits).toFixed(2) : null, contribution: contrib != null ? +contrib.toFixed(0) : null, margin: contrib != null ? +(contrib / x.revenue).toFixed(3) : null });
}
const totRev = rows.reduce((s, x) => s + x.revenue, 0), totVis = rows.reduce((s, x) => s + x.visits, 0), totH = rows.reduce((s, x) => s + (x.paidHours || 0), 0);
console.log(`\nAll techs: ${totVis} visits, revenue serviced $${f(totRev)} in window = $${f(totRev / weeks)}/wk, $${f(totRev / totVis)}/visit, ${f1(totH)} paid h (hourly techs only).`);
const out = { generatedAt: new Date().toISOString(), window: { from: FROM, to: TO, days, weeks: +weeks.toFixed(2) }, method: 'contract value per job spread over the window, split by visit share; TMCP monthly x12/52 per week; Quick Fix total/5 per visit; hours from Gusto export', unattributed: { jobs: unknownJobs, visits: unknownVisits }, burden_rate: { value: BURDEN, tag: 'KNOWN', source: 'Gusto payroll trends Jul-Sep 2026, employer cost / gross' }, avg_loaded_cost_per_paid_hour: { value: AVG_LOADED, tag: 'ESTIMATE', source: 'Gusto payroll trends Aug 2026, company-wide' }, techs: pub, totals: { visits: totVis, revenue: +totRev.toFixed(0), revenue_per_week: +(totRev / weeks).toFixed(0), paid_hours_hourly_techs: +totH.toFixed(1) } };
fs.mkdirSync(path.join(ROOT, 'projects/briefs/cfo/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `projects/briefs/cfo/data/tech-contribution-${TO}.json`), JSON.stringify(out, null, 1));
fs.mkdirSync(path.join(ROOT, 'cfo-private'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `cfo-private/tech-contribution-${TO}.json`), JSON.stringify({ ...out, rate_tag: rateTag, techs: priv }, null, 1));
console.log(`\nwrote projects/briefs/cfo/data/tech-contribution-${TO}.json (no pay) and cfo-private/tech-contribution-${TO}.json (with labor cost)`);
