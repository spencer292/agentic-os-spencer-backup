#!/usr/bin/env node
// model-cost-per-visit.mjs — fully loaded cost per completed visit, by month.
//
// Revenue side (KNOWN, Jobber-derived): invoice-history.json, summed by issuedDate's Pacific
// calendar month. Visits: pulled live from Jobber (read-only GraphQL, pattern copied from
// timesheet-audit/scripts/audit-timesheets.mjs), cached per month under cfo-private/.
//
// Labor: when route-engine/redesign/private/gusto/paid-hours.json fully covers a month AND
// cfo-private/tech-rates.json has a rate for every tech who logged hours that month, computes
// per-tech direct labor (hourly reg + 1.5x OT, or salary/12, x (1+burden)) and sums it — KNOWN.
// Otherwise falls back to the company-wide Gusto employer-cost figure in assumptions.json
// (costs.monthly_payroll_employer_cost) for the whole month — also KNOWN, but not split by tech.
// A month with only a partial-month Gusto figure (e.g. the current month, still in progress) is
// flagged as such rather than silently treated as a complete month.
//
// Non-labor costs come from cfo-private/monthly-expenses.json, filled in from a bookkeeper
// export or via `--pnl <file>` (QuickBooks Online "Profit and Loss by month" CSV or XLSX, dropped
// in cfo-private/). A 0 in that file means UNFILLED, never a real zero cost — every cost line is
// tagged KNOWN / PARTIAL (some but not all of its sub-fields filled) / UNKNOWN, and only KNOWN and
// PARTIAL lines are added into the total. The count of UNKNOWN lines excluded is always reported.
//
// Per-person pay NEVER enters projects/briefs/cfo/data/ or the console table. The public JSON and
// the printed table carry aggregates only (revenue, visits, cost lines, no names). The full
// breakdown, including per-tech labor cost and visit counts, is written ONLY to cfo-private/.
//
// Usage (repo root):
//   node projects/briefs/cfo/scripts/model-cost-per-visit.mjs [--from YYYY-MM --to YYYY-MM] [--refresh]
//        [--pnl cfo-private/<export>.csv|.xlsx] [--overwrite]
//
// --from/--to default to the min/max months present in cfo-private/monthly-expenses.json.
// --refresh forces a fresh Jobber pull for every month in range (default: reuse cfo-private/visits-*.json).
// --pnl ingests a QuickBooks P&L export into cfo-private/monthly-expenses.json before reporting
//        (mapping via projects/briefs/cfo/data/pnl-account-map.json), prints payroll reconciliation
//        against Gusto and any UNMAPPED account totals, then continues into the normal report.
// --overwrite lets --pnl replace a month that already has a non-empty _source.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const hasFlag = k => process.argv.includes('--' + k);
const rp = p => path.join(ROOT, p);
const exists = p => fs.existsSync(rp(p));
const rd = p => JSON.parse(fs.readFileSync(rp(p), 'utf8'));

const ENV_PATH = rp('.env');
const EXPENSES_PATH = 'cfo-private/monthly-expenses.json';
const ASSUMPTIONS_PATH = 'projects/briefs/cfo/data/assumptions.json';
const INVOICES_PATH = 'projects/briefs/cfo/data/invoice-history.json';
const RATES_PATH = 'cfo-private/tech-rates.json';
const HOURS_PATH = 'projects/briefs/route-engine/redesign/private/gusto/paid-hours.json';
const ACCOUNT_MAP_PATH = 'projects/briefs/cfo/data/pnl-account-map.json';

// ---------------- date helpers (Pacific-anchored, convention copied from audit-timesheets.mjs) ----------------
const addDaysStr = (dateStr, n) => { const d = new Date(dateStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function pacificParts(isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const map = {}; for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === '24' ? '00' : map.hour; // Intl quirk: midnight can print as "24"
  return { date: `${map.year}-${map.month}-${map.day}`, minutesOfDay: (+hour) * 60 + (+map.minute) };
}
function pacificMidnightUTC(dateStr) {
  for (const offset of ['-07:00', '-08:00']) {
    const d = new Date(`${dateStr}T00:00:00${offset}`);
    if (pacificParts(d.toISOString()).date === dateStr) return d.toISOString();
  }
  return new Date(`${dateStr}T00:00:00-08:00`).toISOString();
}
const monthFirstDay = m => `${m}-01`;
const monthLastDay = m => { const [y, mo] = m.split('-').map(Number); const nm = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; return addDaysStr(`${nm}-01`, -1); };
const todayPacific = () => pacificParts(new Date().toISOString()).date;
function monthRange(from, to) {
  const out = []; let [y, m] = from.split('-').map(Number);
  const [ey, em] = to.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}

// ---------------- Jobber auth + visits pull (pattern copied from timesheet-audit/scripts/audit-timesheets.mjs) ----------------
function readEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
}
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'; fs.writeFileSync(ENV_PATH, t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function jobberToken(env) {
  if (!env.JOBBER_CLIENT_ID || !env.JOBBER_CLIENT_SECRET || !env.JOBBER_REFRESH_TOKEN) {
    throw new Error('JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET / JOBBER_REFRESH_TOKEN not set in .env — cannot pull live visits.');
  }
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.access_token) throw new Error(`Jobber token refresh failed: ${JSON.stringify(d).slice(0, 300)}`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return d.access_token;
}

async function jobberQuery(token, q, v, a = 0) {
  let r;
  try {
    r = await fetch('https://api.getjobber.com/api/graphql', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query: q, variables: v }),
    });
  } catch (e) {
    if (a < 6) { await sleep(3000 * 2 ** a); return jobberQuery(token, q, v, a + 1); }
    throw e;
  }
  const d = await r.json().catch(() => ({}));
  const throttled = r.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && a < 9) { const wait = Math.min(90000, 3000 * 2 ** a); console.log(`  … throttled — backing off ${wait / 1000}s`); await sleep(wait); return jobberQuery(token, q, v, a + 1); }
  if (d.errors) throw new Error(`Jobber GraphQL error: ${JSON.stringify(d.errors).slice(0, 500)}`);
  return d;
}

async function pullJobberVisits(fromDate, toDate) {
  const env = readEnv();
  const token = await jobberToken(env);
  const queryFrom = pacificMidnightUTC(addDaysStr(fromDate, -1));
  const queryTo = pacificMidnightUTC(addDaysStr(toDate, 2));
  const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime,$n:Int!){
    visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
      nodes{ id isComplete completedAt job{ jobNumber } assignedUsers(first:5){ nodes{ name{ full } } } }
      pageInfo{ hasNextPage endCursor }
      totalCount } }`;
  let rows = [], cursor = null, pages = 0;
  for (;;) {
    const d = await jobberQuery(token, Q, { a: cursor, after: queryFrom, before: queryTo, n: 50 });
    if (!d.data?.visits) throw new Error(`visits query returned no data: ${JSON.stringify(d).slice(0, 400)}`);
    for (const v of d.data.visits.nodes) {
      if (!v.isComplete || !v.completedAt) continue;
      rows.push({ id: v.id, completedAt: v.completedAt, jobNumber: v.job?.jobNumber ?? null, techs: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean) });
    }
    pages++;
    const p = d.data.visits.pageInfo;
    cursor = p.hasNextPage ? p.endCursor : null;
    if (pages === 1) console.log(`  pulling Jobber visits ${queryFrom} .. ${queryTo} (totalCount ${d.data.visits.totalCount})`);
    if (!cursor) break;
    await sleep(300);
  }
  console.log(`  pulled ${rows.length} completed visits over ${pages} page(s)`);
  return rows;
}

async function getVisitsForMonths(months, refresh) {
  const need = refresh ? [...months] : months.filter(m => !exists(`cfo-private/visits-${m}.json`));
  if (need.length) {
    const lo = monthFirstDay(need[0]), hi = monthLastDay(need[need.length - 1]);
    console.log(`Pulling Jobber visits for ${need.join(', ')} (window ${lo}..${hi})...`);
    const all = await pullJobberVisits(lo, hi);
    fs.mkdirSync(rp('cfo-private'), { recursive: true });
    for (const m of need) {
      const first = monthFirstDay(m), last = monthLastDay(m);
      const inMonth = all.filter(v => { const d = pacificParts(v.completedAt).date; return d >= first && d <= last; });
      fs.writeFileSync(rp(`cfo-private/visits-${m}.json`), JSON.stringify({ month: m, pulledAt: new Date().toISOString(), count: inMonth.length, visits: inMonth }, null, 1));
      console.log(`  ${m}: ${inMonth.length} completed visits (cached to cfo-private/visits-${m}.json)`);
    }
  }
  const out = {};
  for (const m of months) out[m] = rd(`cfo-private/visits-${m}.json`);
  return out;
}

// ---------------- revenue ----------------
function revenueByMonth(months) {
  const inv = rd(INVOICES_PATH);
  const sums = Object.fromEntries(months.map(m => [m, 0]));
  const counts = Object.fromEntries(months.map(m => [m, 0]));
  for (const n of inv.nodes) {
    const d = pacificParts(n.issuedDate).date.slice(0, 7);
    if (d in sums) { sums[d] += n.amounts?.total || 0; counts[d]++; }
  }
  return { sums, counts, generatedAt: inv.generatedAt, totalInvoices: inv.count };
}

// ---------------- labor ----------------
function loadTechRates() { return exists(RATES_PATH) ? rd(RATES_PATH) : null; }
function loadHours() { return exists(HOURS_PATH) ? rd(HOURS_PATH).rows : null; }

function laborForMonth(month, hoursRows, rates, payrollAssumptions, burden) {
  const first = monthFirstDay(month), last = monthLastDay(month);
  if (hoursRows && hoursRows.length && rates) {
    const dates = hoursRows.map(r => r.date);
    const covers = Math.min(...dates.map(d => Date.parse(d))) <= Date.parse(first) && Math.max(...dates.map(d => Date.parse(d))) >= Date.parse(last);
    if (covers) {
      const rows = hoursRows.filter(r => r.date >= first && r.date <= last);
      const byTech = {};
      for (const r of rows) { const t = byTech[r.tech] ||= { paidHours: 0, otHours: 0 }; t.paidHours += r.totalHours; t.otHours += r.overtime; }
      let total = 0; const perTech = {};
      for (const [tech, h] of Object.entries(byTech)) {
        const r = rates[tech];
        let cost = null;
        if (r?.salaryAnnual) cost = r.salaryAnnual / 12 * (1 + burden);
        else if (r?.hourly) { const reg = h.paidHours - h.otHours; cost = (reg * r.hourly + h.otHours * r.hourly * 1.5) * (1 + burden); }
        if (cost != null) { total += cost; perTech[tech] = { paidHours: +h.paidHours.toFixed(2), otHours: +h.otHours.toFixed(2), cost: +cost.toFixed(2) }; }
      }
      const missingRates = Object.keys(byTech).filter(t => !(rates[t]?.salaryAnnual || rates[t]?.hourly));
      return { value: total, tag: missingRates.length ? 'PARTIAL' : 'KNOWN', basis: 'per-tech paid hours x cfo-private/tech-rates.json x (1+burden)' + (missingRates.length ? `; no rate on file for: ${missingRates.join(', ')} (excluded)` : ''), perTech, missingRates, source: 'route-engine paid-hours.json + cfo-private/tech-rates.json' };
    }
  }
  // fallback: company-wide Gusto employer cost for the month
  const exact = payrollAssumptions.values[month];
  if (exact != null) return { value: exact, tag: 'KNOWN', basis: 'company-wide Gusto employer cost, full month (paid-hours.json does not fully cover this month)', perTech: null, source: payrollAssumptions.source };
  const partialKey = Object.keys(payrollAssumptions.values).find(k => k.startsWith(month + '-to-'));
  if (partialKey) return { value: payrollAssumptions.values[partialKey], tag: 'KNOWN', partial: true, basis: `company-wide Gusto employer cost, PARTIAL MONTH ONLY (${partialKey}) — month in progress, this total understates the full-month figure`, perTech: null, source: payrollAssumptions.source };
  return { value: null, tag: 'UNKNOWN', basis: 'no Gusto payroll figure available for this month', perTech: null };
}

// ---------------- non-labor cost lines from monthly-expenses.json ----------------
function costLine(parts) {
  const filled = Object.entries(parts).filter(([, v]) => v);
  const missing = Object.entries(parts).filter(([, v]) => !v).map(([k]) => k);
  const value = filled.reduce((s, [, v]) => s + v, 0);
  const tag = filled.length === 0 ? 'UNKNOWN' : (missing.length === 0 ? 'KNOWN' : 'PARTIAL');
  return { value, tag, missing };
}
function expenseLinesForMonth(month, expensesMonths) {
  const e = expensesMonths[month] || {};
  const g = k => e[k] || 0;
  const lines = {
    vehicles_fuel_maintenance: costLine({ vehicle_payments: g('vehicle_payments'), fuel: g('fuel'), vehicle_maintenance_repairs: g('vehicle_maintenance_repairs') }),
    materials: costLine({ materials_traps_supplies: g('materials_traps_supplies') }),
    insurance: costLine({ insurance_auto_gl: g('insurance_auto_gl') }),
    software_phone: costLine({ software_subscriptions: g('software_subscriptions'), phone_internet: g('phone_internet') }),
    office_bookkeeping: costLine({ office_admin_contractors: g('office_admin_contractors'), bookkeeping_accounting: g('bookkeeping_accounting') }),
    marketing: costLine({ marketing_ads: g('marketing_ads'), marketing_other: g('marketing_other') }),
    rent_other: costLine({ rent_facilities: g('rent_facilities'), other: g('other') }),
    owner_compensation: costLine({ owner_compensation: g('owner_compensation') }),
  };
  return { lines, hasSource: !!(e._source && e._source.trim()), present: Object.keys(e).length > 0 };
}

// ---------------- per-month report ----------------
function buildMonthReport(month, { visitCount, revenue, labor, expenseLines }) {
  const revTotal = revenue.sums[month] || 0;
  const revPerVisit = visitCount ? revTotal / visitCount : null;
  const laborPerVisit = (labor.value != null && visitCount) ? labor.value / visitCount : null;

  const lineOrder = ['vehicles_fuel_maintenance', 'materials', 'insurance', 'software_phone', 'office_bookkeeping', 'marketing', 'rent_other', 'owner_compensation'];
  const perVisitLines = {};
  let unknownCount = labor.tag === 'UNKNOWN' ? 1 : 0, partialCount = labor.tag === 'PARTIAL' ? 1 : 0;
  let totalExclOwner = laborPerVisit || 0, totalInclOwner = laborPerVisit || 0;
  let directPerVisit = laborPerVisit || 0, overheadPerVisit = 0;

  for (const key of lineOrder) {
    const ln = expenseLines.lines[key];
    const perVisit = (ln.tag !== 'UNKNOWN' && visitCount) ? ln.value / visitCount : null;
    perVisitLines[key] = { total: +ln.value.toFixed(2), perVisit: perVisit != null ? +perVisit.toFixed(2) : null, tag: ln.tag, missing: ln.missing };
    if (ln.tag === 'UNKNOWN') { unknownCount++; continue; }
    if (ln.tag === 'PARTIAL') partialCount++;
    if (perVisit == null) continue;
    if (key !== 'owner_compensation') totalExclOwner += perVisit;
    totalInclOwner += perVisit;
    if (key === 'vehicles_fuel_maintenance' || key === 'materials') directPerVisit += perVisit;
    else overheadPerVisit += perVisit;
  }

  const marginPerVisit = revPerVisit != null ? revPerVisit - totalInclOwner : null;
  const marginPct = (marginPerVisit != null && revPerVisit) ? marginPerVisit / revPerVisit : null;
  const marginTag = unknownCount > 0 ? `INCOMPLETE (excludes ${unknownCount} unknown line${unknownCount === 1 ? '' : 's'} — true cost is higher)` : (partialCount > 0 ? `ESTIMATE (${partialCount} partially-filled line${partialCount === 1 ? '' : 's'})` : 'KNOWN');
  const breakEvenVisits = (revPerVisit && totalInclOwner && visitCount) ? (totalInclOwner * visitCount) / revPerVisit : null;

  return {
    month, visits: visitCount,
    revenue: { total: +revTotal.toFixed(2), perVisit: revPerVisit != null ? +revPerVisit.toFixed(2) : null, tag: 'KNOWN', source: 'invoice-history.json, issuedDate' },
    labor: { total: labor.value != null ? +labor.value.toFixed(2) : null, perVisit: laborPerVisit != null ? +laborPerVisit.toFixed(2) : null, tag: labor.tag, basis: labor.basis, partial_month: !!labor.partial },
    lines: perVisitLines,
    totals: { per_visit_before_owner_comp: +totalExclOwner.toFixed(2), per_visit_incl_owner_comp: +totalInclOwner.toFixed(2), excludes_unknown_lines: unknownCount, includes_partial_lines: partialCount },
    direct_vs_overhead: { direct_per_visit: +directPerVisit.toFixed(2), allocated_overhead_per_visit: +overheadPerVisit.toFixed(2) },
    margin: { per_visit: marginPerVisit != null ? +marginPerVisit.toFixed(2) : null, pct: marginPct != null ? +(marginPct * 100).toFixed(1) : null, tag: marginTag },
    break_even_visits_per_month: breakEvenVisits != null ? +breakEvenVisits.toFixed(1) : null,
  };
}

function privateExtra(labor, visits, expensesFile) {
  const techVisitCounts = {};
  for (const v of visits.visits) { const t = v.techs?.[0] || 'Unassigned'; techVisitCounts[t] = (techVisitCounts[t] || 0) + 1; }
  const perVehicle = expensesFile.per_vehicle || {};
  const out = {};
  const allTechs = new Set([...(labor.perTech ? Object.keys(labor.perTech) : []), ...Object.keys(techVisitCounts)]);
  for (const tech of allTechs) {
    const vc = techVisitCounts[tech] || 0;
    const l = labor.perTech?.[tech];
    const veh = perVehicle[tech];
    const vehMonthly = veh ? (veh.vehicle_payment || 0) + (veh.fuel || 0) + (veh.maintenance || 0) : 0;
    out[tech] = {
      visits: vc,
      paidHours: l?.paidHours ?? null, otHours: l?.otHours ?? null,
      laborCost: l?.cost ?? null,
      directCostPerVisit: (l && vc) ? +(l.cost / vc).toFixed(2) : null,
      vehicleFuelPerVisit: (vehMonthly && vc) ? +(vehMonthly / vc).toFixed(2) : null,
    };
  }
  return out;
}

// ---------------- console table ----------------
function printTable(months) {
  const f = n => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const lineLabels = { vehicles_fuel_maintenance: 'vehicles+fuel+maint', materials: 'materials', insurance: 'insurance', software_phone: 'software+phone', office_bookkeeping: 'office/admin+bookkeeping', marketing: 'marketing', rent_other: 'rent/other', owner_compensation: 'owner comp' };
  for (const r of months) {
    console.log(`\n=== ${r.month}${r.in_progress ? ' (IN PROGRESS — month not complete)' : ''} ===`);
    console.log(`  visits completed: ${r.visits}${r.expenses_month_complete ? '' : '   [monthly-expenses.json: no _source set for this month — treat non-labor lines below as a draft]'}`);
    console.log(`  revenue billed: $${f(r.revenue.total)}  ($${f(r.revenue.perVisit)}/visit)  [KNOWN]`);
    console.log(`  direct labor:   $${f(r.labor.total)}  ($${f(r.labor.perVisit)}/visit)  [${r.labor.tag}]${r.labor.partial_month ? '  — PARTIAL MONTH' : ''}`);
    for (const [k, label] of Object.entries(lineLabels)) {
      const l = r.lines[k];
      console.log(`  ${label.padEnd(24)} $${String(f(l.total)).padStart(9)}  ($${f(l.perVisit)}/visit)  [${l.tag}]${l.missing.length ? '  missing: ' + l.missing.join(', ') : ''}`);
    }
    console.log(`  TOTAL cost/visit before owner comp: $${f(r.totals.per_visit_before_owner_comp)}`);
    console.log(`  TOTAL cost/visit incl. owner comp:  $${f(r.totals.per_visit_incl_owner_comp)}   [excludes ${r.totals.excludes_unknown_lines} UNKNOWN line(s), includes ${r.totals.includes_partial_lines} PARTIAL line(s)]`);
    console.log(`  direct: $${f(r.direct_vs_overhead.direct_per_visit)}/visit    allocated overhead: $${f(r.direct_vs_overhead.allocated_overhead_per_visit)}/visit`);
    console.log(`  margin/visit: $${f(r.margin.per_visit)} (${r.margin.pct == null ? '—' : r.margin.pct + '%'})  [${r.margin.tag}]`);
    console.log(`  break-even visits/month at current cost: ${f(r.break_even_visits_per_month)}`);
  }
}

// ---------------- PnL ingestion (CSV or XLSX, no npm packages) ----------------
const parseCsvLine = l => {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
};
function pnlCsvToRows(text) { return text.split(/\r?\n/).filter(l => l.trim().length).map(parseCsvLine); }

function decodeXmlEntities(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); }
function pnlXlsxToRows(filePath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pnl-xlsx-'));
  try {
    execFileSync('unzip', ['-o', filePath, 'xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml', '-d', tmp], { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Could not unzip ${filePath} (is 'unzip' on PATH?): ${e.message}`);
  }
  const sharedPath = path.join(tmp, 'xl', 'sharedStrings.xml');
  const sheetPath = path.join(tmp, 'xl', 'worksheets', 'sheet1.xml');
  if (!fs.existsSync(sheetPath)) throw new Error(`${filePath} did not contain xl/worksheets/sheet1.xml — is it a valid .xlsx?`);
  const sharedXml = fs.existsSync(sharedPath) ? fs.readFileSync(sharedPath, 'utf8') : '';
  const sheetXml = fs.readFileSync(sheetPath, 'utf8');

  const shared = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(sharedXml))) shared.push(decodeXmlEntities([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')));

  const colIdx = c => { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c[^>]*r="([A-Z]+)\d+"[^>]*?(?:\st="([a-z]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>|<is>([\s\S]*?)<\/is>)?<\/c>/g;
  const rows = [];
  let rm;
  while ((rm = rowRe.exec(sheetXml))) {
    const rowXml = rm[2];
    const cells = {};
    let cm; cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(rowXml))) {
      const [, col, type, v, isBlock] = cm;
      let val = '';
      if (type === 's' && v != null) val = shared[+v] ?? '';
      else if (type === 'inlineStr' && isBlock != null) val = decodeXmlEntities([...isBlock.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(''));
      else if (v != null) val = decodeXmlEntities(v);
      cells[col] = val;
    }
    const maxCol = Math.max(0, ...Object.keys(cells).map(colIdx));
    const arr = new Array(maxCol + 1).fill('');
    for (const [c, v] of Object.entries(cells)) arr[colIdx(c)] = v;
    rows.push(arr);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return rows;
}

function monthHeaderToKey(h) {
  const m = String(h || '').trim().match(/^([A-Za-z]{3,9})\.?\s+(\d{2,4})$/);
  if (!m) return null;
  const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const mi = names.findIndex(x => m[1].toLowerCase().startsWith(x));
  if (mi < 0) return null;
  let year = +m[2]; if (year < 100) year += 2000;
  return `${year}-${String(mi + 1).padStart(2, '0')}`;
}
function parseMoney(s) {
  if (s == null || s === '') return 0;
  let str = String(s).trim();
  const neg = /^\(.*\)$/.test(str);
  str = str.replace(/[(),$]/g, '');
  const n = parseFloat(str);
  return Number.isNaN(n) ? 0 : (neg ? -n : n);
}
function matchAccount(account, map) {
  const lower = account.toLowerCase();
  for (const [category, keywords] of Object.entries(map)) {
    if (category.startsWith('_')) continue;
    for (const kw of keywords || []) if (kw && lower.includes(kw)) return category;
  }
  return null;
}
function ingestPnlRows(rows, accountMap) {
  let headerRowIdx = -1, monthCols = {};
  for (let i = 0; i < rows.length; i++) {
    const cols = {};
    rows[i].forEach((cell, ci) => { const mk = monthHeaderToKey(cell); if (mk) cols[ci] = mk; });
    if (Object.keys(cols).length >= 2) { headerRowIdx = i; monthCols = cols; break; }
  }
  if (headerRowIdx < 0) throw new Error('Could not find a month header row (expected columns like "Jan 2026") in the P&L export.');
  const totals = {}, unmapped = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const account = String(row[0] || '').trim();
    if (!account || /^total\b/i.test(account) || /^net /i.test(account) || /^gross /i.test(account) || /^income$/i.test(account) || /^expenses?$/i.test(account)) continue;
    const category = matchAccount(account, accountMap);
    for (const [ci, month] of Object.entries(monthCols)) {
      const value = parseMoney(row[+ci]);
      if (!value) continue;
      if (!category) { unmapped.push({ account, month, value }); continue; }
      totals[category] ||= {}; totals[category][month] = (totals[category][month] || 0) + value;
    }
  }
  return { totals, unmapped };
}

async function ingestPnl(pnlPathArg, overwrite) {
  const full = path.isAbsolute(pnlPathArg) ? pnlPathArg : rp(pnlPathArg);
  if (!fs.existsSync(full)) throw new Error(`--pnl file not found: ${full}`);
  const accountMap = rd(ACCOUNT_MAP_PATH);
  const ext = path.extname(full).toLowerCase();
  const rows = ext === '.csv' ? pnlCsvToRows(fs.readFileSync(full, 'utf8')) : ext === '.xlsx' ? pnlXlsxToRows(full) : (() => { throw new Error(`--pnl must be .csv or .xlsx, got ${ext}`); })();

  const { totals, unmapped } = ingestPnlRows(rows, accountMap);

  const expensesFile = exists(EXPENSES_PATH) ? rd(EXPENSES_PATH) : { months: {} };
  expensesFile.months ||= {};

  const assumptions = rd(ASSUMPTIONS_PATH);
  const gustoValues = assumptions.costs.monthly_payroll_employer_cost.values;
  const payroll = totals.payroll_wages_and_taxes || {};
  console.log('\n--- Payroll reconciliation: P&L vs Gusto employer cost (not written to monthly-expenses.json — payroll comes from Gusto) ---');
  for (const [month, pnlVal] of Object.entries(payroll)) {
    const partialKey = Object.keys(gustoValues).find(k => k.startsWith(month + '-to-'));
    const gustoVal = gustoValues[month] ?? (partialKey ? gustoValues[partialKey] : null);
    const diff = gustoVal != null ? pnlVal - gustoVal : null;
    console.log(`  ${month}: P&L $${pnlVal.toLocaleString()}  vs  Gusto $${gustoVal != null ? gustoVal.toLocaleString() : '—'}${partialKey ? ' (partial: ' + partialKey + ')' : ''}  diff ${diff != null ? '$' + diff.toLocaleString() : '—'}`);
  }
  if (!Object.keys(payroll).length) console.log('  (no payroll-like account matched in the P&L export)');

  let written = 0, skippedMonths = new Set();
  for (const [category, byMonth] of Object.entries(totals)) {
    if (category === 'payroll_wages_and_taxes') continue;
    for (const [month, value] of Object.entries(byMonth)) {
      const rec = expensesFile.months[month];
      if (rec && rec._source && !overwrite) { skippedMonths.add(month); continue; }
      expensesFile.months[month] = expensesFile.months[month] || { _source: '' };
      expensesFile.months[month][category] = +value.toFixed(2);
      expensesFile.months[month]._source = `QBO P&L import (${path.basename(full)})`;
      written++;
    }
  }
  fs.mkdirSync(rp('cfo-private'), { recursive: true });
  fs.writeFileSync(rp(EXPENSES_PATH), JSON.stringify(expensesFile, null, 2));
  console.log(`\nWrote ${written} category/month value(s) into ${EXPENSES_PATH}.${skippedMonths.size ? ` Skipped already-sourced month(s): ${[...skippedMonths].join(', ')} — pass --overwrite to replace.` : ''}`);

  if (unmapped.length) {
    console.log('\n--- UNMAPPED accounts — add a keyword to projects/briefs/cfo/data/pnl-account-map.json ---');
    const byAccount = {};
    for (const u of unmapped) byAccount[u.account] = (byAccount[u.account] || 0) + u.value;
    for (const [account, total] of Object.entries(byAccount).sort((a, b) => b[1] - a[1])) console.log(`  UNMAPPED  ${account}  total $${total.toLocaleString()}`);
  }
}

// ---------------- main ----------------
async function main() {
  fs.mkdirSync(rp('cfo-private'), { recursive: true });
  fs.mkdirSync(rp('projects/briefs/cfo/data'), { recursive: true });

  const pnlPath = arg('pnl');
  if (pnlPath) await ingestPnl(pnlPath, hasFlag('overwrite'));

  if (!exists(EXPENSES_PATH)) throw new Error(`${EXPENSES_PATH} not found. Create it first (see cfo-private/README.md) or run with --pnl.`);
  const expensesFile = rd(EXPENSES_PATH);
  const expensesMonths = expensesFile.months || {};

  const monthKeys = Object.keys(expensesMonths).sort();
  const from = arg('from', monthKeys[0]);
  const to = arg('to', monthKeys[monthKeys.length - 1]);
  if (!from || !to) throw new Error('No --from/--to given and no months in cfo-private/monthly-expenses.json to default from.');
  const months = monthRange(from, to);

  const assumptions = rd(ASSUMPTIONS_PATH);
  const burden = assumptions.costs.labor_burden_rate.value;
  const payrollAssumptions = assumptions.costs.monthly_payroll_employer_cost;
  const rates = loadTechRates();
  const hoursRows = loadHours();
  const revenue = revenueByMonth(months);
  const visitsByMonth = await getVisitsForMonths(months, hasFlag('refresh'));

  const today = todayPacific();
  const publicMonths = [], privateMonths = [];
  for (const m of months) {
    const inProgress = monthLastDay(m) > today;
    const labor = laborForMonth(m, hoursRows, rates, payrollAssumptions, burden);
    const expenseLines = expenseLinesForMonth(m, expensesMonths);
    const visitCount = visitsByMonth[m].count;
    const report = buildMonthReport(m, { visitCount, revenue, labor, expenseLines });
    report.in_progress = inProgress;
    report.expenses_month_complete = expenseLines.hasSource;
    publicMonths.push(report);
    privateMonths.push({ ...report, labor_detail: labor, per_tech: privateExtra(labor, visitsByMonth[m], expensesFile) });
  }

  console.log(`Window ${from}..${to}. Burden rate: ${(burden * 100).toFixed(1)}% [KNOWN, ${assumptions.costs.labor_burden_rate.source}].`);
  if (!rates) console.log(`No ${RATES_PATH} found — per-tech labor split unavailable; all months fall back to company-wide Gusto employer cost.`);
  if (!hoursRows) console.log(`No ${HOURS_PATH} found — all months fall back to company-wide Gusto employer cost.`);
  printTable(publicMonths);

  const label = `${from}..${to}`;
  const publicOut = {
    generatedAt: new Date().toISOString(), window: { from, to },
    method: 'labor: per-tech Gusto hours x tech-rates.json where paid-hours.json fully covers the month, else company-wide Gusto employer cost for the month. Non-labor: cfo-private/monthly-expenses.json (0 = UNFILLED). Revenue: invoice-history.json issuedDate, Pacific calendar month. Visits: live Jobber completed-visit pull, Pacific completion date.',
    burden_rate: { value: burden, tag: 'KNOWN', source: assumptions.costs.labor_burden_rate.source },
    months: publicMonths,
  };
  fs.writeFileSync(rp(`projects/briefs/cfo/data/cost-per-visit-${label}.json`), JSON.stringify(publicOut, null, 1));
  fs.writeFileSync(rp(`cfo-private/cost-per-visit-${label}.json`), JSON.stringify({ ...publicOut, months: privateMonths }, null, 1));
  console.log(`\nwrote projects/briefs/cfo/data/cost-per-visit-${label}.json (aggregate, no per-person pay)`);
  console.log(`wrote cfo-private/cost-per-visit-${label}.json (full, incl. per-tech labor and vehicle cost)`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
