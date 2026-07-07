#!/usr/bin/env node
// Cash-flow projection — modelling step.
// Reads data/invoices-raw.json (from pull-invoices.mjs) and produces:
//   1. A collection curve  — of invoices billed in month M, what % of the cash
//      lands in month M, M+1, M+2, … (measured from ISSUED date to RECEIVED date).
//   2. A forward projection — applies that curve to the current open A/R to
//      estimate cash landing over the next few months.
//
// Pure compute, no network. Re-runnable without re-pulling.
//   node projects/briefs/cash-flow-projection/scripts/build-projection.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const RAW = path.join(DATA_DIR, 'invoices-raw.json');

if (!fs.existsSync(RAW)) { console.error(`No data file at ${RAW} — run pull-invoices.mjs first.`); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));

const money = n => '$' + (Math.round(n)).toLocaleString('en-US');
const pct = n => (n * 100).toFixed(1) + '%';
const monthKey = iso => iso ? iso.slice(0, 7) : null;                 // YYYY-MM
const monthsBetween = (a, b) => {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
};

const now = new Date(raw.generatedAt);
const nowMonth = monthKey(raw.generatedAt);

// ---------------------------------------------------------------------------
// 1. COLLECTION CURVE  (from the history cohort)
// For each invoice we know issuedDate + amounts.total. If it's been paid we know
// receivedDate. We measure the lag in calendar months and weight by dollars.
// ---------------------------------------------------------------------------
const hist = raw.history.nodes;

// Bucket collected dollars by lag-in-months (issue-month → received-month).
// A new-customer job is ONE $450 invoice carrying depositAmount $150 (collected
// at booking, at/before issue) plus paymentsTotal for the $300 balance. Deposits
// are NOT in paymentsTotal, so we add them explicitly as lag-0 (up-front) cash —
// otherwise the curve only reaches the balance-paid portion and under-counts.
const lagDollars = new Map();   // lag -> $ collected at that lag
let paidDollars = 0;            // total $ collected (deposits + balance payments)
let billedResolved = 0;         // total $ billed on history invoices we can classify
let badDebtDollars = 0;
let stillOpenDollars = 0;
let depositCashTotal = 0;       // up-front deposit cash (new customers)
let anomalies = 0;              // balance received before issued, etc.

for (const inv of hist) {
  const total = inv.amounts?.total ?? 0;
  if (total <= 0) continue;
  const iMonth = monthKey(inv.issuedDate);
  if (!iMonth) continue;

  if (inv.invoiceStatus === 'bad_debt') { badDebtDollars += total; billedResolved += total; continue; }

  const deposit = inv.amounts?.depositAmount ?? 0;
  const collected = inv.amounts?.paymentsTotal ?? 0;
  billedResolved += total;

  // Deposit — collected up front at booking → treat as lag 0 (early cash).
  if (deposit > 0) {
    lagDollars.set(0, (lagDollars.get(0) || 0) + deposit);
    paidDollars += deposit;
    depositCashTotal += deposit;
  }
  // Balance payment — at the issue→received lag.
  if (inv.receivedDate && collected > 0) {
    const rMonth = monthKey(inv.receivedDate);
    let lag = monthsBetween(iMonth, rMonth);
    if (lag < 0) { anomalies++; lag = 0; }
    lagDollars.set(lag, (lagDollars.get(lag) || 0) + collected);
    paidDollars += collected;
  }
  const outstanding = total - deposit - collected;
  if (outstanding > 0) stillOpenDollars += outstanding;
}

// Collection curve = share of collected dollars by lag month, cumulative.
const maxLag = Math.max(0, ...lagDollars.keys());
const curve = [];
let cum = 0;
for (let lag = 0; lag <= maxLag; lag++) {
  const d = lagDollars.get(lag) || 0;
  const share = paidDollars ? d / paidDollars : 0;
  cum += share;
  curve.push({ lag, dollars: d, share, cumShare: cum });
}

// Effective collection & bad-debt rates on resolved history.
const badDebtRate = billedResolved ? badDebtDollars / billedResolved : 0;

// ---------------------------------------------------------------------------
// 2. MONTHLY BILLING (history) — what you invoice per month, and same-month cash.
// ---------------------------------------------------------------------------
const byBillMonth = new Map();
// Segmentation: new-customer jobs carry a deposit; existing-customer jobs don't.
let newCustJobs = 0, newCustRevenue = 0, existingJobs = 0, existingRevenue = 0;
for (const inv of hist) {
  const total = inv.amounts?.total ?? 0;
  const m = monthKey(inv.issuedDate);
  if (!m || total <= 0) continue;
  const deposit = inv.amounts?.depositAmount ?? 0;
  if (!byBillMonth.has(m)) byBillMonth.set(m, { billed: 0, count: 0, collected: 0, deposit: 0, newJobs: 0 });
  const row = byBillMonth.get(m);
  row.billed += total;
  row.count += 1;
  row.collected += (inv.amounts?.paymentsTotal ?? 0) + deposit;  // deposits ARE collected cash
  row.deposit += deposit;
  if (deposit > 0) { row.newJobs += 1; newCustJobs += 1; newCustRevenue += total; }
  else { existingJobs += 1; existingRevenue += total; }
}
const billMonths = [...byBillMonth.keys()].sort();

// ---------------------------------------------------------------------------
// 3. OPEN A/R  — current outstanding balances.
// ---------------------------------------------------------------------------
const openNodes = [...raw.open.awaiting_payment.nodes, ...raw.open.past_due.nodes];
let openTotal = 0;
const openByAgeMonth = new Map();   // months since issued -> outstanding $
const openByStatus = { awaiting_payment: 0, past_due: 0 };
const pastDueByClient = new Map();  // client name -> {balance, count, oldestAge}
for (const inv of openNodes) {
  const bal = inv.amounts?.invoiceBalance ?? 0;
  if (bal <= 0) continue;
  openTotal += bal;
  openByStatus[inv.invoiceStatus] = (openByStatus[inv.invoiceStatus] || 0) + bal;
  const m = monthKey(inv.issuedDate);
  const age = m ? Math.max(0, monthsBetween(m, nowMonth)) : 0;
  openByAgeMonth.set(age, (openByAgeMonth.get(age) || 0) + bal);
  if (inv.invoiceStatus === 'past_due') {
    const name = inv.client?.name || '(unknown)';
    const c = pastDueByClient.get(name) || { balance: 0, count: 0, oldestAge: 0 };
    c.balance += bal; c.count += 1; c.oldestAge = Math.max(c.oldestAge, age);
    pastDueByClient.set(name, c);
  }
}
const topPastDue = [...pastDueByClient.entries()]
  .map(([name, c]) => ({ name, ...c }))
  .sort((a, b) => b.balance - a.balance)
  .slice(0, 10);

// Collections trend — append this snapshot to a small history file and read back.
const histPath = path.join(DATA_DIR, 'collections-history.json');
let collHistory = [];
try { collHistory = JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch { collHistory = []; }
const snapDate = raw.generatedAt.slice(0, 10);
collHistory = collHistory.filter(s => s.date !== snapDate); // dedupe same-day re-runs
collHistory.push({ date: snapDate, openTotal, awaiting: openByStatus.awaiting_payment || 0, pastDue: openByStatus.past_due || 0, invoices: openNodes.length });
collHistory.sort((a, b) => a.date.localeCompare(b.date));
collHistory = collHistory.slice(-12); // keep last 12 snapshots
fs.writeFileSync(histPath, JSON.stringify(collHistory, null, 2));

// ---------------------------------------------------------------------------
// 4. PROJECTION — apply the collection curve to open A/R by age.
// An invoice aged `age` months has already had `age` months to be collected;
// remaining cash is distributed over the curve's remaining (uncollected) tail,
// re-normalised, and scaled by the overall collection (1 - badDebt) rate.
// ---------------------------------------------------------------------------
const collectRate = 1 - badDebtRate;
const cumAt = lag => {
  if (lag < 0) return 0;
  if (lag >= curve.length) return curve.length ? curve[curve.length - 1].cumShare : 1;
  return curve[lag].cumShare;
};

const HORIZON = 4; // months ahead to project
const projection = Array.from({ length: HORIZON + 1 }, (_, i) => ({ monthsAhead: i, cash: 0 }));

for (const [age, bal] of openByAgeMonth) {
  const already = cumAt(age);                       // share that *should* have arrived by now
  const remainingShare = Math.max(0, 1 - already);  // share still expected
  if (remainingShare <= 0) {
    // fully past the curve — assume it lands within the next month (aged debt)
    projection[1].cash += bal * collectRate;
    continue;
  }
  for (let ahead = 0; ahead <= HORIZON; ahead++) {
    const from = cumAt(age + ahead);
    const to = cumAt(age + ahead + 1);
    const slice = (to - from) / remainingShare;     // portion of remaining landing this future month
    projection[ahead].cash += bal * collectRate * Math.max(0, slice);
  }
}

// ---------------------------------------------------------------------------
// 5. NEW-BILLINGS FORECAST (seasonally adjusted) + combined forward cash view.
// The boundary months of the history window are partial (the window starts
// mid-month and "now" is mid-month), so they're excluded from the baseline and
// seasonal index. Seasonality comes from a single year here — directional, not
// gospel — so it's flagged as such in the report.
// ---------------------------------------------------------------------------
const startMonth = monthKey(raw.historyStart);
const completeMonths = billMonths.filter(m => m !== startMonth && m !== nowMonth);
const baseline = completeMonths.length
  ? completeMonths.reduce((s, m) => s + byBillMonth.get(m).billed, 0) / completeMonths.length : 0;

// Seasonal index per calendar month (1-12) from complete months.
const calAgg = new Map(); // cal -> {sum, count}
for (const m of completeMonths) {
  const cal = Number(m.slice(5, 7));
  const a = calAgg.get(cal) || { sum: 0, count: 0 };
  a.sum += byBillMonth.get(m).billed; a.count += 1;
  calAgg.set(cal, a);
}
const seasonalIndex = cal => {
  const a = calAgg.get(cal);
  return (a && baseline) ? (a.sum / a.count) / baseline : 1; // fallback to baseline for unseen months
};
const shareAt = lag => (lag >= 0 && lag < curve.length) ? curve[lag].share : 0;

const FC_HORIZON = 6; // months of forward view
const alreadyThisMonth = byBillMonth.get(nowMonth)?.billed || 0;

// Expected NEW billings per future month (not yet issued).
const newBill = [];
for (let k = 0; k < FC_HORIZON; k++) {
  const d = new Date(now); d.setUTCMonth(d.getUTCMonth() + k);
  const m = d.toISOString().slice(0, 7);
  const cal = Number(m.slice(5, 7));
  let amount = baseline * seasonalIndex(cal);
  // current month: only the portion not yet billed remains to come
  if (k === 0) amount = Math.max(0, amount - alreadyThisMonth);
  newBill.push({ monthsAhead: k, month: m, cal, amount, seasonal: seasonalIndex(cal) });
}

// Combined cash arriving per calendar month = open-A/R cash + new-billings cash.
const combined = [];
for (let t = 0; t < FC_HORIZON; t++) {
  const openCash = t <= HORIZON ? projection[t].cash : 0;
  let newCash = 0;
  for (const nb of newBill) {
    if (nb.monthsAhead <= t) newCash += nb.amount * shareAt(t - nb.monthsAhead) * collectRate;
  }
  combined.push({ monthsAhead: t, openCash, newCash, total: openCash + newCash });
}

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------
const avgMonthlyBilled = billMonths.length
  ? billMonths.reduce((s, m) => s + byBillMonth.get(m).billed, 0) / billMonths.length : 0;

const futureMonthLabel = ahead => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() + ahead);
  return d.toISOString().slice(0, 7);
};

let md = `# Got Moles — Cash-Flow Projection\n\n`;
md += `_Generated ${raw.generatedAt.slice(0, 10)} · history window ${raw.historyWindowMonths} months · source: Jobber (live)_\n\n`;

md += `## Headline\n\n`;
md += `- **Open receivables right now:** ${money(openTotal)} across ${openNodes.length} invoices\n`;
md += `  - Awaiting payment (not yet overdue): ${money(openByStatus.awaiting_payment || 0)}\n`;
md += `  - Past due: ${money(openByStatus.past_due || 0)}\n`;
md += `- **Average billed per month (last ${billMonths.length} mo):** ${money(avgMonthlyBilled)}\n`;
md += `- **Effective bad-debt rate (history):** ${pct(badDebtRate)}\n`;
md += `- **New-customer jobs (deposit taken):** ${newCustJobs} of ${newCustJobs + existingJobs} jobs (${pct((newCustJobs) / (newCustJobs + existingJobs || 1))}), ${money(depositCashTotal)} collected up front as deposits\n`;
md += `- **Projected cash from current open A/R, next ${HORIZON} months:**\n\n`;

md += `| When | Expected cash in |\n|---|---|\n`;
for (const p of projection) {
  const label = p.monthsAhead === 0 ? `This month (${futureMonthLabel(0)})` : `+${p.monthsAhead} mo (${futureMonthLabel(p.monthsAhead)})`;
  md += `| ${label} | ${money(p.cash)} |\n`;
}
const projTotal = projection.reduce((s, p) => s + p.cash, 0);
md += `| **Total expected to collect** | **${money(projTotal)}** |\n`;
md += `\n_(Of ${money(openTotal)} open; the gap vs. total reflects the modelled bad-debt slippage and any tail beyond ${HORIZON} months.)_\n\n`;

md += `## Collections snapshot\n\n`;
md += `- **Total outstanding:** ${money(openTotal)} across ${openNodes.length} invoices\n`;
md += `- **Not yet due:** ${money(openByStatus.awaiting_payment || 0)}  ·  **Past due:** ${money(openByStatus.past_due || 0)}\n\n`;
if (collHistory.length > 1) {
  md += `**Trend (last ${collHistory.length} runs):**\n\n`;
  md += `| Snapshot | Total open | Not yet due | Past due |\n|---|---|---|---|\n`;
  for (const s of collHistory) md += `| ${s.date} | ${money(s.openTotal)} | ${money(s.awaiting)} | ${money(s.pastDue)} |\n`;
  const prev = collHistory[collHistory.length - 2], cur = collHistory[collHistory.length - 1];
  const dPast = cur.pastDue - prev.pastDue;
  md += `\nPast-due ${dPast >= 0 ? 'up' : 'down'} ${money(Math.abs(dPast))} vs. previous run.\n\n`;
}
if (topPastDue.length) {
  md += `**Top past-due accounts (chase list):**\n\n`;
  md += `| Client | Past-due balance | Invoices | Oldest |\n|---|---|---|---|\n`;
  for (const c of topPastDue) md += `| ${c.name} | ${money(c.balance)} | ${c.count} | ${c.oldestAge === 0 ? 'this mo' : c.oldestAge + ' mo'} |\n`;
  md += `\n`;
}

md += `## Full forward cash view (open A/R + expected new billings)\n\n`;
md += `Baseline new billings ≈ **${money(baseline)}/mo**, seasonally adjusted from the last ${completeMonths.length} complete months and flowed through the same collection curve. Combined with cash still to arrive from current open invoices:\n\n`;
md += `| Month | From open A/R | From new billings | **Total cash in** |\n|---|---|---|---|\n`;
for (const c of combined) {
  const label = c.monthsAhead === 0 ? `${futureMonthLabel(0)} (rest of month)` : futureMonthLabel(c.monthsAhead);
  md += `| ${label} | ${money(c.openCash)} | ${money(c.newCash)} | **${money(c.total)}** |\n`;
}
md += `\n**Expected new billings by month** (seasonally adjusted):\n\n`;
md += `| Month | Expected billed |\n|---|---|\n`;
for (const nb of newBill) {
  const label = nb.monthsAhead === 0 ? `${nb.month} (remaining)` : nb.month;
  md += `| ${label} | ${money(nb.amount)} (index ${nb.seasonal.toFixed(2)}) |\n`;
}
md += `\n_Seasonality is derived from a single year of history — treat it as directional. Re-running monthly sharpens it as more data accrues._\n\n`;

md += `## Collection curve — how fast billings turn into cash\n\n`;
md += `Dollar-weighted across ${money(paidDollars)} of collected history. Balance payments are timed issue→received; new-customer **deposits (${money(depositCashTotal)}) are credited up front** (same month), since they're taken at booking and aren't in the payment records.\n\n`;
md += `| Months after billing | Cash collected in that month | Cumulative collected |\n|---|---|---|\n`;
for (const c of curve.slice(0, 7)) {
  const label = c.lag === 0 ? 'Same month' : `+${c.lag}`;
  md += `| ${label} | ${pct(c.share)} | ${pct(c.cumShare)} |\n`;
}
md += `\n**Read this as:** of every dollar you eventually collect, ${pct(curve[0]?.cumShare || 0)} arrives in the same calendar month you bill it`;
if (curve[1]) md += `, ${pct(curve[1].cumShare)} within one month`;
if (curve[2]) md += `, ${pct(curve[2].cumShare)} within two`;
md += `.\n\n`;

md += `## New vs existing customers\n\n`;
md += `Deposits are only taken on **new customers** — so a deposit on the invoice is a reliable new-customer marker. Existing customers are booked and billed at end of service (full rate if moles are caught, ${money(150)} no-catch bill otherwise).\n\n`;
md += `| Segment | Jobs | Revenue billed | Share of revenue |\n|---|---|---|---|\n`;
const totalRev = newCustRevenue + existingRevenue;
md += `| New customers (deposit) | ${newCustJobs} | ${money(newCustRevenue)} | ${pct(totalRev ? newCustRevenue / totalRev : 0)} |\n`;
md += `| Existing customers | ${existingJobs} | ${money(existingRevenue)} | ${pct(totalRev ? existingRevenue / totalRev : 0)} |\n`;
const avgNewPerMo = completeMonths.length ? newCustJobs / billMonths.length : 0;
md += `\n≈ **${avgNewPerMo.toFixed(0)} new customers/month**, bringing ≈ ${money(depositCashTotal / (billMonths.length || 1))}/mo in up-front deposit cash.\n\n`;

md += `## Monthly billing history\n\n`;
md += `| Month billed | Invoices | New cust | Total billed | Deposit cash | Collected so far |\n|---|---|---|---|---|---|\n`;
for (const m of billMonths) {
  const r = byBillMonth.get(m);
  md += `| ${m} | ${r.count} | ${r.newJobs} | ${money(r.billed)} | ${money(r.deposit)} | ${money(r.collected)} (${pct(r.billed ? r.collected / r.billed : 0)}) |\n`;
}
md += `\n_Recent months show lower collected-% simply because their invoices haven't aged through the collection curve yet. "Collected" now includes deposit cash._\n\n`;

md += `## Open receivables by age\n\n`;
md += `| Age (months since billed) | Outstanding |\n|---|---|\n`;
for (const age of [...openByAgeMonth.keys()].sort((a, b) => a - b)) {
  md += `| ${age === 0 ? 'This month' : `${age} mo`} | ${money(openByAgeMonth.get(age))} |\n`;
}
md += `\n`;

if (anomalies > 0) {
  md += `## Data notes\n\n`;
  md += `- **${anomalies}** history invoices had a payment recorded *before* the issued date (deposits / prepaid / scheduled billing). These were counted as same-month collection. Worth confirming how Got Moles handles deposits so the model treats them exactly right.\n\n`;
}

md += `## Method & caveats\n\n`;
md += `- Collection curve is **dollar-weighted** and measured issue→received in calendar months.\n`;
md += `- Projection applies the curve to each open invoice based on how many months it has *already* aged, then re-normalises the remaining tail and scales by the collection rate (1 − bad-debt).\n`;
md += `- New-customer **deposits are credited as up-front cash** in the collection curve (they're taken at booking and aren't in Jobber's payment records). This is why "collected so far" on aged months now reconciles to ~100%.\n`;
md += `- New-customer acquisition is **highly seasonal** (peaks in fall mole season); the deposit-cash line moves with it. A single year can't fully separate season from trend — re-running monthly builds that.\n`;
md += `- Assumes historical payment behaviour holds. Re-run monthly after billing to refresh.\n`;

const outMd = path.join(PROJECT_DIR, `cash-flow-projection_${raw.generatedAt.slice(0, 10)}.md`);
fs.writeFileSync(outMd, md);

// Machine-readable companion for charting / Notion / re-use.
const outJson = path.join(DATA_DIR, 'projection.json');
fs.writeFileSync(outJson, JSON.stringify({
  generatedAt: raw.generatedAt,
  openTotal, openByStatus,
  avgMonthlyBilled, badDebtRate, baseline,
  depositCashTotal,
  segments: {
    newCustomers: { jobs: newCustJobs, revenue: newCustRevenue },
    existingCustomers: { jobs: existingJobs, revenue: existingRevenue },
  },
  curve, projection: projection.map(p => ({ ...p, month: futureMonthLabel(p.monthsAhead) })),
  newBill, combined: combined.map(c => ({ ...c, month: futureMonthLabel(c.monthsAhead) })),
  billMonths: billMonths.map(m => ({ month: m, ...byBillMonth.get(m) })),
  openByAgeMonth: [...openByAgeMonth.entries()].map(([age, bal]) => ({ age, outstanding: bal })),
  anomalies,
}, null, 2));

console.log(`Report → ${outMd}`);
console.log(`Data   → ${outJson}`);
console.log(`\nOpen A/R: ${money(openTotal)} | Avg billed/mo: ${money(avgMonthlyBilled)} | Bad-debt: ${pct(badDebtRate)}`);
console.log(`Projected next ${HORIZON} mo from open A/R: ${money(projTotal)}`);
