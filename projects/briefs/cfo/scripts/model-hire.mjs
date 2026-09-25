#!/usr/bin/env node
/**
 * model-hire.mjs — "Can we afford another tech?"
 *
 * Reports through the three lenses required by acc-cfo: CASH, PROFIT, VALUE.
 * Every assumption it leans on is printed with its confidence tag. Anything
 * UNKNOWN is flagged loudly and the answer is marked provisional.
 *
 * Usage:
 *   node model-hire.mjs --mode growth  --month 09 --wage 26 --burden 0.28
 *   node model-hire.mjs --mode relief  --month 01 --wage 26
 *   node model-hire.mjs --mode growth  --month 09            # uses ESTIMATE placeholders, flags them
 *
 * Modes:
 *   growth  — the tech serves INCREMENTAL customers. Adds revenue. Gated by lead supply.
 *   relief  — the tech takes over EXISTING visits (frees Spencer/Cory). Adds ZERO revenue.
 *             Pure cost until the freed time is deployed into something that earns.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(join(HERE, '..', 'data', 'assumptions.json'), 'utf8'));

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const num = (k, d) => { const v = arg(k, null); return v === null ? d : Number(v); };

const MODE = arg('mode', 'growth');
if (!['growth', 'relief'].includes(MODE)) {
  console.error('--mode must be "growth" or "relief"');
  process.exit(1);
}
const HIRE_MONTH = String(arg('month', String(new Date().getMonth() + 1).padStart(2, '0'))).padStart(2, '0');

// ---------- assumptions, with tag tracking ----------
const used = [];
function take(label, value, tag, note) {
  used.push({ label, value, tag, note });
  return value;
}

// Costs — every one of these is UNKNOWN in assumptions.json today.
const wageOverride   = num('wage', null);
const burdenOverride = num('burden', null);

const WAGE = wageOverride !== null
  ? take('Base hourly wage', wageOverride, 'PROVIDED', 'passed on the command line')
  : take('Base hourly wage', 26, 'ESTIMATE',
      `PLACEHOLDER. WA minimum is $${A.labor_law_wa.minimum_wage_2026.value}/hr; a trained field tech sits well above it. Real number is UNKNOWN.`);

const BURDEN = burdenOverride !== null
  ? take('Labor burden rate', burdenOverride, 'PROVIDED', 'passed on the command line')
  : take('Labor burden rate', A.costs.labor_burden_rate.benchmark_if_needed.value, 'ESTIMATE',
      'Sector placeholder 25%. WA L&I trapping-class comp rates can push this higher. Real number is UNKNOWN.');

const VEHICLE = num('vehicle', null) !== null
  ? take('Vehicle cost / month', num('vehicle'), 'PROVIDED', 'passed on the command line')
  : take('Vehicle cost / month', 850, 'ESTIMATE', 'PLACEHOLDER: truck payment or depreciation + commercial auto + maintenance. UNKNOWN.');

const FUEL = num('fuel', null) !== null
  ? take('Fuel / month', num('fuel'), 'PROVIDED', 'passed on the command line')
  : take('Fuel / month', 600, 'ESTIMATE', 'PLACEHOLDER for a full route week in the Puget Sound metro. UNKNOWN.');

const MATERIALS_PER_VISIT = num('materials', null) !== null
  ? take('Materials / visit', num('materials'), 'PROVIDED', 'passed on the command line')
  : take('Materials / visit', 2.5, 'ESTIMATE', 'PLACEHOLDER: traps, flags, consumables, trap loss. UNKNOWN.');

// Capacity + revenue — these are real.
const VISITS_WK = num('visits', 100);
const REV_VISIT = take('Revenue per visit', A.capacity.revenue_per_visit.value, 'KNOWN', A.capacity.revenue_per_visit.source);
const MIN_STOP  = take('Measured min/stop (all techs)', A.capacity.measured_median_minutes_per_stop.all_techs, 'KNOWN', A.capacity.measured_median_minutes_per_stop.source);
const SEASON    = A.seasonality.index_by_month;
const CURVE     = A.collections.curve_by_month_lag;

const WORK_WEEK_H = num('hours', 40);
const WEEKS_MO = 52 / 12;
const RAMP = [0.40, 0.65, 0.85, 1.00]; // month 1..4+, ESTIMATE
take('Ramp curve (months 1-4)', RAMP.join(' / '), 'ESTIMATE', 'A new tech is not at full route in month one. No measured onboarding curve exists yet.');

// ---------- derived cost ----------
const annualHours = WORK_WEEK_H * 52;
const wageCost    = WAGE * annualHours;
const burdenCost  = wageCost * BURDEN;
const laborAnnual = wageCost + burdenCost;
const truckAnnual = (VEHICLE + FUEL) * 12;
const fixedAnnual = laborAnnual + truckAnnual;

// ---------- monthly walk ----------
const startIdx = Number(HIRE_MONTH) - 1;
const monthName = i => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12];
const monthKey  = i => String((i % 12) + 1).padStart(2, '0');

const rows = [];
for (let m = 0; m < 12; m++) {
  const idx = (startIdx + m) % 12;
  const ramp = RAMP[Math.min(m, RAMP.length - 1)];
  const seasonIdx = SEASON[monthKey(idx)];

  const visits = MODE === 'growth' ? VISITS_WK * WEEKS_MO * ramp * seasonIdx : 0;
  const billed = visits * REV_VISIT;
  const materials = (MODE === 'growth' ? visits : VISITS_WK * WEEKS_MO * ramp) * MATERIALS_PER_VISIT;
  const cost = (laborAnnual / 12) * (m === 0 ? ramp : 1) + (VEHICLE + FUEL) + materials;

  rows.push({ m, idx, ramp, seasonIdx, visits, billed, cost });
}

// cash: billings collect through the curve
const cashIn = new Array(12).fill(0);
rows.forEach((r, i) => {
  for (const [lagStr, pct] of Object.entries(CURVE)) {
    const t = i + Number(lagStr);
    if (t < 12) cashIn[t] += r.billed * pct;
  }
});

let running = 0;
const cash = rows.map((r, i) => {
  const net = cashIn[i] - r.cost;
  running += net;
  return { ...r, cashIn: cashIn[i], net, running };
});

const y1CashImpact = running;
const breakevenMonth = cash.find(c => c.running >= 0);
const monthlyBreakeven = cash.find(c => c.net >= 0);
const troughRow = cash.reduce((a, b) => (b.running < a.running ? b : a), cash[0]);

// steady-state profit (full ramp, full year, average seasonality = 1.0)
const ssVisits = MODE === 'growth' ? VISITS_WK * 52 : 0;
const ssRevenue = ssVisits * REV_VISIT;
const ssMaterials = (MODE === 'growth' ? ssVisits : VISITS_WK * 52) * MATERIALS_PER_VISIT;
const ssCost = fixedAnnual + ssMaterials;

// CONTRIBUTION MARGIN — direct costs only. This is NOT EBITDA.
const ssContribution = ssRevenue - ssCost;

// Overhead allocation. Without it, contribution masquerades as profit and every
// hire looks like a winner. Overhead is UNKNOWN in the real books today.
const overheadOverride = num('overhead', null);
const OVERHEAD = overheadOverride !== null
  ? take('Overhead allocated / tech / yr', overheadOverride, 'PROVIDED', 'passed on the command line')
  : take('Overhead allocated / tech / yr', null, 'UNKNOWN',
      'Insurance, software, office/admin, ads, rent, owner comp — ALL UNKNOWN. Without this, EBITDA cannot be computed and contribution margin must NOT be read as profit.');

const ssEbitdaDelta = OVERHEAD === null ? null : ssContribution - OVERHEAD;

// value lens — must run off EBITDA, never off contribution
const VAL = A.valuation.multiple_bands_by_recurring_share;
const multLow = VAL.under_40_pct_recurring[1];   // 4.5x — conservative, current mix unmeasured
const multHigh = VAL['60_pct_platform_threshold'][1]; // 7.0x
const valueLow = ssEbitdaDelta === null ? null : ssEbitdaDelta * multLow;
const valueHigh = ssEbitdaDelta === null ? null : ssEbitdaDelta * multHigh;

// flip point: wage at which steady-state contribution = 0
const nonLaborSS = truckAnnual + ssMaterials;
const flipWage = MODE === 'growth'
  ? (ssRevenue - nonLaborSS) / (annualHours * (1 + BURDEN))
  : null;
const flipVisits = MODE === 'growth'
  ? (fixedAnnual) / ((REV_VISIT - MATERIALS_PER_VISIT) * 52)
  : null;

// pace sanity
const paceCeiling = (WORK_WEEK_H * 60) / MIN_STOP;
const utilization = VISITS_WK / paceCeiling;

// ---------- output ----------
const $ = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
const pct = n => (n * 100).toFixed(1) + '%';
const line = c => console.log(c);

line('');
line('='.repeat(74));
line(`  HIRE MODEL — one field tech, ${MODE.toUpperCase()} mode, starting ${monthName(startIdx)}`);
line('='.repeat(74));

if (MODE === 'relief') {
  line('');
  line('  RELIEF MODE: this tech takes over visits that are ALREADY being served.');
  line('  Incremental revenue is ZERO by construction. This hire is pure cost until');
  line('  the freed-up person is redeployed into something that earns more than it.');
}

line('');
line('  ANNUAL COST — fully loaded');
line('  ' + '-'.repeat(70));
line(`  Wages           ${$(wageCost).padStart(12)}   ${WAGE}/hr x ${annualHours} h`);
line(`  Burden          ${$(burdenCost).padStart(12)}   ${pct(BURDEN)} (L&I, PFML, WA Cares, FUTA/SUTA, FICA)`);
line(`  Vehicle + fuel  ${$(truckAnnual).padStart(12)}   ${$(VEHICLE)}+${$(FUEL)} per month`);
line(`  Materials       ${$(ssMaterials).padStart(12)}   ${$(MATERIALS_PER_VISIT)}/visit`);
line('  ' + '-'.repeat(70));
line(`  TOTAL           ${$(ssCost).padStart(12)}   = ${$(ssCost / 12)}/mo`);

line('');
line('  THE THREE LENSES');
line('  ' + '='.repeat(70));

line('');
line(`  1. CASH   — effect on the bank over 12 months from a ${monthName(startIdx)} start`);
line(`     Year-1 cash impact:        ${$(y1CashImpact)}`);
line(`     Deepest cash hole:         ${$(troughRow.running)} in ${monthName(troughRow.idx)} (month ${troughRow.m + 1})`);
line(`     Cash-positive month:       ${monthlyBreakeven ? `${monthName(monthlyBreakeven.idx)} (month ${monthlyBreakeven.m + 1})` : 'never within 12 months'}`);
line(`     Cumulative payback:        ${breakevenMonth ? `${monthName(breakevenMonth.idx)} (month ${breakevenMonth.m + 1})` : 'NOT within 12 months'}`);

line('');
line(`  2. PROFIT — steady-state, fully ramped`);
line(`     Revenue produced:          ${$(ssRevenue)}`);
line(`     Direct cost:               ${$(ssCost)}`);
if (MODE === 'growth') {
  line(`     CONTRIBUTION MARGIN:       ${$(ssContribution)}  (${pct(ssContribution / ssRevenue)})`);
  line(`     This is NOT profit. It is revenue minus this tech's OWN direct costs.`);
  line(`     Sector gross margin benchmark is ${pct(A.industry_benchmarks.gross_margin_average.value)} — compare against that, not against zero.`);
} else {
  line(`     CONTRIBUTION MARGIN:       ${$(ssContribution)}  <-- a pure cost line, by design`);
  line(`     Relief hires produce no revenue. The question is never "does this pay for`);
  line(`     itself" (it cannot) but "is the freed person worth more than ${$(ssCost)}/yr".`);
}
line('');
if (ssEbitdaDelta === null) {
  line(`     Overhead allocation:       UNKNOWN`);
  line(`     EBITDA delta:              CANNOT BE COMPUTED`);
  line(`     >>> Insurance, software, office/admin, ads, rent and owner comp are all`);
  line(`     >>> UNKNOWN. Reading the contribution figure above as profit is exactly`);
  line(`     >>> the mistake this model exists to prevent. Pass --overhead <annual $>`);
  line(`     >>> to see the real answer, or get the number from the bookkeeper.`);
} else {
  line(`     Overhead allocated:        ${$(OVERHEAD)}`);
  line(`     EBITDA delta:              ${$(ssEbitdaDelta)}   ${ssEbitdaDelta >= 0 ? '' : '<-- NEGATIVE'}`);
}

line('');
line(`  3. VALUE  — effect on enterprise value`);
if (ssEbitdaDelta === null) {
  line(`     CANNOT BE COMPUTED — value runs off EBITDA, and EBITDA needs overhead.`);
  line(`     Deliberately not estimated. A value number built on contribution margin`);
  line(`     would overstate this hire by the full amount of the overhead it ignores.`);
} else if (ssEbitdaDelta === 0) {
  line(`     No EBITDA delta, so no direct value delta.`);
  line(`     A relief hire changes value only through what the freed person does next,`);
  line(`     and through "management depth" — a named driver of the multiple.`);
} else {
  line(`     At ${multLow}x (sub-40% recurring):    ${$(valueLow)}`);
  line(`     At ${multHigh}x (60%+ recurring):      ${$(valueHigh)}`);
  line(`     Spread of ${$(valueHigh - valueLow)} on the SAME hire — that gap is the recurring mix,`);
  line(`     not the tech. See assumptions.valuation.`);
}

line('');
line('  MONTH BY MONTH (cash)');
line('  ' + '-'.repeat(70));
line('  Month   Ramp  Season   Visits    Billed     Cash in      Cost      Net   Running');
cash.forEach(c => {
  line(`  ${monthName(c.idx).padEnd(6)} ${(c.ramp * 100).toFixed(0).padStart(4)}% ${c.seasonIdx.toFixed(2).padStart(6)} ` +
       `${Math.round(c.visits).toString().padStart(8)} ${$(c.billed).padStart(9)} ${$(c.cashIn).padStart(11)} ` +
       `${$(c.cost).padStart(9)} ${$(c.net).padStart(8)} ${$(c.running).padStart(9)}`);
});

line('');
line('  FLIP POINTS — what would have to be true to change the answer');
line('  ' + '-'.repeat(70));
if (MODE === 'growth') {
  line(`  Break-even wage:           $${flipWage.toFixed(2)}/hr  <-- ON DIRECT COSTS ONLY`);
  line(`  Break-even visits/week:    ${flipVisits.toFixed(0)}     <-- ON DIRECT COSTS ONLY`);
  line(`  Headroom on wage:          ${$( (flipWage - WAGE) * annualHours )} /yr before CONTRIBUTION hits zero`);
  line('');
  line(`  These look generous because overhead is excluded. A break-even wage of`);
  line(`  $${flipWage.toFixed(0)}/hr is not a real hiring ceiling — it is the point where the tech`);
  line(`  stops covering his own truck and traps. Real ceiling is lower by whatever`);
  line(`  share of overhead he should carry. That number is UNKNOWN.`);
  line('');
  line(`  LEAD SUPPLY GATE — the assumption that actually decides this:`);
  line(`  Growth mode assumes ${VISITS_WK} visits/wk of NEW demand exists for this tech.`);
  line(`  The baseline names lead flow as the #1 binding constraint, and ${pct(A.acquisition.peak_window_share_of_acquisition.value)} of`);
  line(`  new customers arrive Aug-Nov (January produced SIX). If the leads are not`);
  line(`  there, this is a RELIEF hire wearing growth clothes — rerun with --mode relief.`);
} else {
  line(`  This hire never pays for itself on its own — that is what relief mode means.`);
  line(`  It pays for itself when the freed person generates more than ${$(ssCost)}/yr.`);
  line(`  Spencer runs ~43 visits/wk; Cory ~103. Freeing them is a REVENUE bet on what`);
  line(`  they do instead, not a cost saving. Model that bet before approving the hire.`);
}

line('');
line('  TIMING — the season is not neutral');
line('  ' + '-'.repeat(70));
{
  const best = Object.entries(SEASON).sort((a, b) => b[1] - a[1])[0];
  const worst = Object.entries(SEASON).sort((a, b) => a[1] - b[1])[0];
  line(`  Peak billing month:  ${monthName(Number(best[0]) - 1)} (index ${best[1]})`);
  line(`  Trough month:        ${monthName(Number(worst[0]) - 1)} (index ${worst[1]})`);
  line(`  Real trough window:  Dec-Feb, mean index ${A.seasonality.trough_window.mean_index}`);
  line(`  NOTE: got-moles-scale/brief.md says "trough Nov-May". The billing data does not`);
  line(`  support that — Nov indexes 1.145 and Apr-Jun run 0.99-1.13. Hire timing built on`);
  line(`  the "Nov-May trough" story is built on a wrong premise. See open_conflicts C2.`);
}

line('');
line('  ASSUMPTIONS USED — confidence tags');
line('  ' + '-'.repeat(70));
used.forEach(u => {
  const flag = u.tag === 'ESTIMATE' ? ' <-- ESTIMATE' : u.tag === 'UNKNOWN' ? ' <-- UNKNOWN' : '';
  line(`  [${u.tag}] ${u.label}: ${u.value}${flag}`);
  if (u.note && u.tag !== 'KNOWN') line(`         ${u.note}`);
});

const estimates = used.filter(u => u.tag === 'ESTIMATE');
if (estimates.length) {
  line('');
  line('  ' + '!'.repeat(70));
  line(`  PROVISIONAL: ${estimates.length} of ${used.length} inputs are ESTIMATES, not facts.`);
  line('  Every cost line in this model is UNKNOWN in the real books. This output is a');
  line('  SHAPE, not an answer. It becomes an answer when the bookkeeper statement lands.');
  line('  See projects/briefs/cfo/2026-08-26_bookkeeper-request.md');
  line('  ' + '!'.repeat(70));
}

line('');
line(`  Capacity sanity: ${VISITS_WK} visits/wk against a pace ceiling of ${paceCeiling.toFixed(0)}/wk`);
line(`  (${WORK_WEEK_H}h at ${MIN_STOP} measured min/stop) = ${pct(utilization)} utilization.`);
line('');
