#!/usr/bin/env node
// CFO — month-end revenue forecast for Got Moles, built from live Jobber data.
//
// Structure the model exploits (measured, not assumed): Got Moles bills in TWO streams.
//   1. A DAILY stream of job-size invoices (new Quick Fix sales + setup fees), issued on weekdays.
//   2. A MONTH-END BATCH issued on the LAST CALENDAR DAY, carrying the recurring book. It is
//      ~2/3 of the month and measures 94-98% recurring contract revenue; job finals are the rest.
// Forecasting the month therefore means forecasting the batch, not extrapolating a daily run rate.
//
// Inputs (pull these first):
//   node projects/briefs/cfo/scripts/pull-invoice-history.mjs 26
//   node projects/briefs/cfo/scripts/pull-active-book.mjs
//   node projects/briefs/cfo/scripts/pull-batch-day.mjs YYYY-MM-DD   (prior month-ends)
//   node projects/briefs/cfo/scripts/pull-payments.mjs 15
//
// Usage: node projects/briefs/cfo/scripts/forecast-month.mjs [YYYY-MM]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '..', 'data');
const read = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const PT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
const ptDate = iso => PT.format(new Date(iso));
const usd = n => '$' + Math.round(n).toLocaleString('en-US');

const target = process.argv[2] || ptDate(new Date()).slice(0, 7);
const [Y, M] = target.split('-').map(Number);
const lastDay = new Date(Date.UTC(Y, M, 0)).getUTCDate();
const today = ptDate(new Date());
const asOfDay = today.startsWith(target) ? +today.slice(8, 10) : lastDay;

// ---------- 1. what is already on the books ----------
const inv = read('invoice-history.json');
const rows = inv.nodes.map(n => {
  const d = ptDate(n.issuedDate);
  return { ymd: d, ym: d.slice(0, 7), day: +d.slice(8, 10), total: n.amounts.total };
});
const lastDayOf = ym => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
// Field days only — Got Moles runs Mon-Fri and does not work the major US holidays.
// A holiday counted as a working day drags the measured per-weekday billing rate down.
const HOLIDAYS = new Set([
  '2025-01-01', '2025-05-26', '2025-07-04', '2025-09-01', '2025-11-27', '2025-11-28', '2025-12-25',
  '2026-01-01', '2026-05-25', '2026-07-03', '2026-09-07', '2026-11-26', '2026-11-27', '2026-12-25',
]);
const weekdaysBetween = (ym, from, to) => {
  const [y, m] = ym.split('-').map(Number); let c = 0;
  for (let d = from; d <= to; d++) {
    const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const ymd = `${ym}-${String(d).padStart(2, '0')}`;
    if (w >= 1 && w <= 5 && !HOLIDAYS.has(ymd)) c++;
  }
  return c;
};

const monthRows = rows.filter(r => r.ym === target);
const bookedDaily = monthRows.filter(r => r.day < lastDay).reduce((s, r) => s + r.total, 0);
const bookedBatch = monthRows.filter(r => r.day === lastDay).reduce((s, r) => s + r.total, 0);
const booked = bookedDaily + bookedBatch;

// ---------- 2. daily stream for the rest of the month ----------
// Rate is per WORKING weekday; the last day is excluded because it is the batch.
const workedWeekdays = weekdaysBetween(target, 1, Math.min(asOfDay, lastDay - 1));
const dailyRate = workedWeekdays ? bookedDaily / workedWeekdays : 0;
const remainingWeekdays = weekdaysBetween(target, asOfDay + 1, lastDay - 1);
// Measured Sept fade of the daily rate, H1 -> H2: 2024 -0.96x, 2025 1.01x -> treat as flat, hold a
// small haircut in the low case only.
const dailyRest = { low: dailyRate * remainingWeekdays * 0.55, base: dailyRate * remainingWeekdays * 0.97, high: dailyRate * remainingWeekdays * 1.10 };

// ---------- 3. the month-end batch ----------
// Model: batch(n) = batch(n-1) * dollarRetention + newBillers * avgNewBiller.
// Both parameters are measured from consecutive batch-day pulls.
function loadBatch(day) { try { return read(`batch-${day}.json`); } catch { return null; } }
const key = n => { const j = n.jobs?.nodes?.[0]; return j ? 'j' + j.jobNumber : 'c' + n.client?.id; };
function transition(aDay, bDay) {
  const A = loadBatch(aDay), B = loadBatch(bDay);
  if (!A || !B) return null;
  const ma = new Map(A.nodes.map(n => [key(n), n.amounts.total]));
  const mb = new Map(B.nodes.map(n => [key(n), n.amounts.total]));
  let retSum = 0, newN = 0, newSum = 0;
  for (const k of ma.keys()) if (mb.has(k)) retSum += mb.get(k);
  for (const [k, v] of mb) if (!ma.has(k)) { newN++; newSum += v; }
  const prevSum = [...ma.values()].reduce((s, x) => s + x, 0);
  return { from: aDay, to: bDay, prevSum, retention: retSum / prevSum, newN, newSum, newAvg: newSum / newN, toSum: [...mb.values()].reduce((s, x) => s + x, 0) };
}
const TRANSITIONS = [['2025-08-31', '2025-09-30'], ['2026-05-31', '2026-06-30'], ['2026-06-30', '2026-07-31'], ['2026-07-31', '2026-08-31']]
  .map(([a, b]) => transition(a, b)).filter(Boolean);

const prevYm = `${M === 1 ? Y - 1 : Y}-${String(M === 1 ? 12 : M - 1).padStart(2, '0')}`;
const prevBatchDay = `${prevYm}-${String(lastDayOf(prevYm)).padStart(2, '0')}`;
const prevBatch = loadBatch(prevBatchDay);
const prevBatchSum = prevBatch ? prevBatch.nodes.reduce((s, n) => s + n.amounts.total, 0) : null;

// New-biller count for the target month, taken from the live book where possible.
const book = read('active-book.json');
const productOf = names => {
  const s = names.join(' | ').toLowerCase();
  if (s.includes('total mole control')) return 'TMCP';
  if (s.includes('quick fix')) return 'QUICKFIX';
  if (s.includes('barter')) return 'BARTER';
  return names.length ? 'OTHER' : 'EMPTY';
};
const tmcp = book.nodes.filter(j => productOf((j.lineItems?.nodes || []).map(n => n.name)) === 'TMCP');
const prevBillers = new Set(prevBatch ? prevBatch.nodes.map(n => n.jobs?.nodes?.[0]?.jobNumber).filter(Boolean) : []);
const recentStart = j => ptDate(j.startAt) >= `${prevYm}-15`;
const newSinceBatch = tmcp.filter(j => !prevBillers.has(j.jobNumber) && recentStart(j));
// project the remaining new adds at the month-to-date add rate
const addRate = asOfDay > 0 ? newSinceBatch.length / asOfDay : 0;
const projectedNew = Math.round(newSinceBatch.length + addRate * (lastDay - asOfDay) * 0.9);

// ---------- contracted MRR ----------
// NEVER classify recurring revenue by invoice size. 19 commercial accounts bill monthly at
// $250-$1,550 and an "invoices under $200" filter silently drops $11K/month of MRR.
// The only reliable read is invoiceSchedule.scheduleSummary. A job's `total` is ONE billing
// cycle, so quarterly and yearly contracts must be divided down to a monthly equivalent.
const sched = j => j.invoiceSchedule?.scheduleSummary || '';
const cycleMonths = j => {
  const s = sched(j);
  if (/Monthly|every month/i.test(s)) return 1;
  if (/Yearly|Annually/i.test(s)) return 12;
  if (/90 days|3 months/i.test(s)) return 3;
  if (/6 months|180 days/i.test(s)) return 6;
  return null; // ON_COMPLETION / NEVER / one-off — not recurring
};
const mrrRows = book.nodes.map(j => ({ j, m: cycleMonths(j) })).filter(r => r.m && (r.j.total || 0) > 0);
const mrr = mrrRows.reduce((s, r) => s + r.j.total / r.m, 0);
const mrrByCadence = {};
for (const r of mrrRows) {
  const k = `${productOf((r.j.lineItems?.nodes || []).map(n => n.name))} / ${sched(r.j)}`;
  mrrByCadence[k] = mrrByCadence[k] || { n: 0, cycle: 0, monthly: 0 };
  mrrByCadence[k].n++; mrrByCadence[k].cycle += r.j.total; mrrByCadence[k].monthly += r.j.total / r.m;
}
const monthlyBillers = mrrRows.filter(r => r.m === 1);

const retentions = TRANSITIONS.map(t => t.retention);
const newAvgs = TRANSITIONS.map(t => t.newAvg);
const avgNew = newAvgs.slice(-3).reduce((a, b) => a + b, 0) / 3;
const batch = prevBatchSum === null ? null : {
  low: prevBatchSum * Math.min(...retentions) + projectedNew * 0.85 * Math.min(...newAvgs),
  base: prevBatchSum * 0.975 + projectedNew * avgNew,
  high: prevBatchSum * Math.max(...retentions) + projectedNew * 1.15 * Math.max(...newAvgs.slice(-3)),
};

// ---------- 4. cash lens ----------
const pay = read('payments.json');
const cashRows = pay.nodes.filter(n => n.adjustmentType === 'PAYMENT' || n.adjustmentType === 'DEPOSIT')
  .map(n => { const d = ptDate(n.entryDate); return { ymd: d, ym: d.slice(0, 7), day: +d.slice(8, 10), amount: n.amount }; });
const cashMonth = ym => cashRows.filter(r => r.ym === ym).reduce((s, r) => s + r.amount, 0);
const cashBookedMTD = cashRows.filter(r => r.ym === target && r.day <= asOfDay).reduce((s, r) => s + r.amount, 0);
// same-day collection rate on the previous batch day
const prevBatchDayCash = cashRows.filter(r => r.ymd === prevBatchDay).reduce((s, r) => s + r.amount, 0);
const sameDayRate = prevBatchSum ? prevBatchDayCash / prevBatchSum : 0;
// mid-month cash in the prior month over the equivalent window (day asOf+1 .. lastDay-1)
const prevMid = cashRows.filter(r => r.ym === prevYm && r.day > asOfDay && r.day < lastDayOf(prevYm)).reduce((s, r) => s + r.amount, 0);

// ---------- output ----------
const out = [];
const say = s => { out.push(s); console.log(s); };

say(`\n=== ${target} revenue forecast — Got Moles (Jobber, as of ${today}) ===`);
say(`invoice data generated ${inv.generatedAt}   |   active book ${book.generatedAt}\n`);

say('CONTRACTED MRR (live book, every cadence converted to a monthly equivalent)');
for (const k of Object.keys(mrrByCadence).sort((a, b) => mrrByCadence[b].monthly - mrrByCadence[a].monthly)) {
  const v = mrrByCadence[k];
  say(`  ${String(v.n).padStart(4)} jobs  per cycle ${usd(v.cycle).padStart(9)}  -> monthly ${usd(v.monthly).padStart(9)}   ${k}`);
}
say(`  MRR ${usd(mrr)}   ARR ${usd(mrr * 12)}   (${monthlyBillers.length} jobs bill monthly)`);

say('\nMEASURED BATCH TRANSITIONS (month-end batch -> next month-end batch)');
say('  from -> to                 prev$      $retention   new billers   new $   new avg');
for (const t of TRANSITIONS) {
  say(`  ${t.from} -> ${t.to}  ${usd(t.prevSum).padStart(9)}   ${(100 * t.retention).toFixed(1).padStart(8)}%   ${String(t.newN).padStart(11)}   ${usd(t.newSum).padStart(7)}   ${usd(t.newAvg).padStart(7)}`);
}

say(`\nBOOKED SO FAR (${target}-01 .. ${today})`);
say(`  daily-stream invoices        ${usd(bookedDaily).padStart(10)}   over ${workedWeekdays} working weekdays = ${usd(dailyRate)}/weekday`);
if (bookedBatch) say(`  month-end batch              ${usd(bookedBatch).padStart(10)}`);
say(`  booked total                 ${usd(booked).padStart(10)}`);

say(`\nREST OF MONTH`);
say(`  daily stream, ${remainingWeekdays} weekdays left   low ${usd(dailyRest.low)}  base ${usd(dailyRest.base)}  high ${usd(dailyRest.high)}`);
if (batch) {
  say(`  ${target}-${lastDay} batch                 low ${usd(batch.low)}  base ${usd(batch.base)}  high ${usd(batch.high)}`);
  say(`    prior batch ${prevBatchDay} = ${usd(prevBatchSum)}; new billers already on the book = ${newSinceBatch.length}, projected ${projectedNew} @ ${usd(avgNew)}`);
}

const tot = k => booked + dailyRest[k] + (batch ? batch[k] : 0);
say(`\nFORECAST — BILLINGS (invoices issued in ${target})`);
say(`  LOW    ${usd(tot('low'))}`);
say(`  BASE   ${usd(tot('base'))}`);
say(`  HIGH   ${usd(tot('high'))}`);

const prevMonthBilled = rows.filter(r => r.ym === prevYm).reduce((s, r) => s + r.total, 0);
const yoyYm = `${Y - 1}-${String(M).padStart(2, '0')}`;
const yoyBilled = rows.filter(r => r.ym === yoyYm).reduce((s, r) => s + r.total, 0);
say(`  vs ${prevYm} (${usd(prevMonthBilled)}): ${(100 * (tot('base') / prevMonthBilled - 1)).toFixed(1)}%   |   vs ${yoyYm} (${usd(yoyBilled)}): ${(100 * (tot('base') / yoyBilled - 1)).toFixed(1)}% YoY`);

say(`\nFORECAST — CASH COLLECTED in ${target}`);
say(`  collected ${target}-01..${today}   ${usd(cashBookedMTD).padStart(10)}   (actual)`);
say(`  days ${asOfDay + 1}..${lastDay - 1}, from ${prevYm} same window   ${usd(prevMid).padStart(10)}`);
if (batch) say(`  ${target}-${lastDay} same-day autopay    ${usd(batch.base * sameDayRate).padStart(10)}   (${(100 * sameDayRate).toFixed(0)}% of the batch collected same day in ${prevYm})`);
const cashBase = cashBookedMTD + prevMid * 1.05 + (batch ? batch.base * sameDayRate : 0);
say(`  CASH BASE CASE               ${usd(cashBase).padStart(10)}   vs ${prevYm} ${usd(cashMonth(prevYm))} (${(100 * (cashBase / cashMonth(prevYm) - 1)).toFixed(1)}%)`);

// trailing twelve months, with the forecast standing in for the target month
const months = [];
for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(Y, M - 1 - i, 1)); months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`); }
const ttm = months.reduce((s, ym) => s + (ym === target ? tot('base') : rows.filter(r => r.ym === ym).reduce((a, r) => a + r.total, 0)), 0);
say(`\nTTM BILLINGS ${months[0]}..${months[11]} (forecast month included): ${usd(ttm)}`);

fs.writeFileSync(path.join(DATA, `forecast-${target}.json`), JSON.stringify({
  target, asOf: today, generatedAt: new Date().toISOString(),
  booked: { daily: bookedDaily, batch: bookedBatch, total: booked },
  dailyRate, workedWeekdays, remainingWeekdays, dailyRest,
  prevBatchDay, prevBatchSum, newBillersOnBook: newSinceBatch.length, projectedNew, avgNew, batch,
  billings: { low: tot('low'), base: tot('base'), high: tot('high') },
  cash: { mtd: cashBookedMTD, base: cashBase, sameDayRate },
  mrr: { total: mrr, arr: mrr * 12, monthlyBillers: monthlyBillers.length, byCadence: mrrByCadence },
  transitions: TRANSITIONS, ttm,
}, null, 2));
console.log(`\nSaved -> ${path.join(DATA, `forecast-${target}.json`)}`);
