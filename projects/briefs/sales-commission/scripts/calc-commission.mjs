#!/usr/bin/env node
// Turn the audited month into a payable commission statement.
//
// Technician plan (GotMoles_TechCompensation.docx):
//   commission = 5% of TMCP invoiced in the month, credited to the resolved seller.
//                Quick Fix and everything else earn nothing.
//   TMCP bonus = new TMCP conversions valued at CONTRACTED ANNUAL VALUE (monthly x 12),
//                floor'd into $1,000 increments, priced by band, band applied RETROACTIVELY.
//   tips       = the even field split, handled separately.
//
// The plan document's forfeiture gates (ticket / complaint / accident / fleet grade) and its
// $50 Google review bonus are RETIRED - Spencer 2026-09-09. The bonus is unconditional, and
// review incentives are off the table under Google's rules. Nothing here needs an input that
// Jobber cannot supply, so a month closes without manual data entry.
//
// Muhammad Javed (flat 2% on everything) and Cory Ventura (equity/profit) are outside
// the technician plan.
//
// Usage: node calc-commission.mjs [YYYY-MM]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRIEF = path.resolve(HERE, '..');
const DATA = path.join(BRIEF, 'data');
const MONTH = process.argv[2] || fs.readdirSync(DATA).filter(f => f.endsWith('_raw.json')).sort().pop().slice(0, 7);

const raw = JSON.parse(fs.readFileSync(path.join(DATA, `${MONTH}_raw.json`), 'utf8'));
const rows = JSON.parse(fs.readFileSync(path.join(DATA, `${MONTH}_rows.json`), 'utf8')).rows;
const rates = JSON.parse(fs.readFileSync(path.join(BRIEF, 'rates.json'), 'utf8'));
const PLAN = rates.technicianPlan;

const resPath = path.join(DATA, `${MONTH}_client-resolution.json`);
const clientRes = fs.existsSync(resPath) ? JSON.parse(fs.readFileSync(resPath, 'utf8')).resolution : {};

const money = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (n * 100).toFixed(n * 100 % 1 ? 2 : 0) + '%';
const ruleFor = (name) => ({ ...rates.defaults, ...(rates.people[name] || {}) });

// ---- final attribution: chain first, then client history ----
for (const r of rows) {
  if (r.resolved) { r.creditedTo = r.resolved; r.creditBasis = r.quoteSellers.length ? 'QUOTE' : (r.jobSellers.length ? 'JOB' : 'INVOICE'); continue; }
  const cr = clientRes[r.invoiceNumber];
  r.creditedTo = cr?.seller || null;
  r.creditBasis = cr?.seller ? cr.basis : (cr?.basis || 'UNRESOLVED');
  r.creditEvidence = cr?.evidence || null;
}

// tips live on the invoice; rows.json predates the field, so read them from raw
const tipsByInvoice = new Map(raw.invoices.nodes.map(i => [i.invoiceNumber, i.amounts?.tipsTotal ?? 0]));
for (const r of rows) r.tips = tipsByInvoice.get(r.invoiceNumber) ?? 0;

// ---- commission base by person, split by product ----
const book = {};
for (const r of rows) {
  const k = r.creditedTo || '(UNATTRIBUTABLE)';
  const b = (book[k] ??= { invoices: 0, invoiced: 0, tmcpInvoiced: 0, collected: 0, viaChain: 0, viaChainAmt: 0, viaHistory: 0, viaHistoryAmt: 0, byProduct: {} });
  b.invoices++; b.invoiced += r.total; b.collected += r.collected;
  if (r.product === 'TMCP') b.tmcpInvoiced += r.total;
  if (['QUOTE', 'JOB', 'INVOICE'].includes(r.creditBasis)) { b.viaChain++; b.viaChainAmt += r.total; }
  else if (r.creditedTo) { b.viaHistory++; b.viaHistoryAmt += r.total; }
  const p = (b.byProduct[r.product] ??= { n: 0, invoiced: 0 });
  p.n++; p.invoiced += r.total;
}
const commissionBase = (name) => {
  const rule = ruleFor(name);
  const b = book[name];
  if (!b) return 0;
  return rule.commissionAppliesTo === 'TMCP' ? b.tmcpInvoiced : b.invoiced;
};

// ---- new TMCP conversions in the month, at contracted annual value ----
const productOf = (li) => {
  const s = (li || []).map(x => x.name).join('|').toLowerCase();
  if (/total mole control/.test(s)) return 'TMCP';
  if (/quick fix/.test(s)) return 'Quick Fix';
  if (/barter|friends and family/.test(s)) return 'Barter/F&F';
  return 'Other';
};
const sellerOf = (j) => (j.quote?.salesperson?.name?.full || j.salesperson?.name?.full || '').trim() || null;

// A TMCP job total is normally the MONTHLY plan price, so annual value is x12. But a customer
// who prepays a year is entered as the full annual figure, and multiplying that by 12 would
// inflate their seller's bonus by an order of magnitude. Anything above a year's worth of the
// cheapest plan is treated as already-annual and counted at face value. Confirmed against
// #8331 Belur Shivashankara, who genuinely prepaid a year (Spencer, 2026-09-09).
const ANNUAL_PREPAY_FLOOR = 600; // no monthly TMCP plan comes near this
const newTmcp = {};
const suspectValues = [];
for (const j of (raw.jobsSold?.nodes || [])) {
  if (productOf(j.lineItems?.nodes) !== 'TMCP') continue;
  const seller = sellerOf(j);
  if (!seller) continue;
  const monthly = j.total ?? 0;
  const suspect = monthly > ANNUAL_PREPAY_FLOOR;
  const annual = suspect ? monthly : monthly * 12;
  if (suspect) suspectValues.push({ jobNumber: j.jobNumber, client: j.client?.name, total: monthly, seller });
  const s = (newTmcp[seller] ??= { jobs: 0, monthly: 0, annual: 0, list: [] });
  s.jobs++; s.monthly += monthly; s.annual += annual;
  s.list.push({ jobNumber: j.jobNumber, client: j.client?.name, monthly, annual });
}

function bonusFor(annualValue) {
  const size = PLAN.tmcpBonus.incrementSize;
  const increments = Math.floor(annualValue / size);
  const band = PLAN.tmcpBonus.bands.find(b => annualValue >= b.min && (b.max === null || annualValue <= b.max));
  const rate = band ? band.perIncrement : 0;
  return { increments, rate, band, amount: increments * rate };
}

// ---- tip pool: whoever was in the field THIS month ----
const monthStart = `${MONTH}-01`;
const monthEnd = (() => { const [y, m] = MONTH.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); })();
function tipStatus(name) {
  const r = ruleFor(name);
  if (!r.tipsEligible) return { eligible: false };
  const from = r.tipsEligibleFrom || null, until = r.tipsEligibleUntil || null;
  if (from && from > monthEnd) return { eligible: false };
  if (until && until < monthStart) return { eligible: false };
  return { eligible: true, partial: (from && from > monthStart) || (until && until < monthEnd), from, until };
}
const tipPool = rows.reduce((a, r) => a + (r.tips || 0), 0);
const tipStatuses = Object.fromEntries(Object.keys(rates.people).map(n => [n, tipStatus(n)]));
const tipRoster = Object.keys(rates.people).filter(n => tipStatuses[n].eligible).sort();
const tipShare = tipRoster.length ? tipPool / tipRoster.length : 0;
const partialTippers = tipRoster.filter(n => tipStatuses[n].partial);

// ---------------------------------------------------------------- report
const L = [];
L.push(`# Commission statement — ${MONTH}`);
L.push('');
L.push(`Basis: **invoiced in the month**. ${rows.length} invoices, ${money(rows.reduce((a, r) => a + r.total, 0))} invoiced, ${money(rows.reduce((a, r) => a + r.collected, 0))} collected. Base hourly and overtime are payroll and are not in this statement.`);
L.push('');

const payableNames = [...new Set([...Object.keys(book), ...tipRoster, ...Object.keys(newTmcp)])]
  .filter(n => n !== '(UNATTRIBUTABLE)')
  .sort((a, b) => (book[b]?.invoiced || 0) - (book[a]?.invoiced || 0));

const lines = [];
for (const name of payableNames) {
  const rule = ruleFor(name);
  const b = book[name];
  const base = commissionBase(name);
  const commission = rule.eligible ? base * rule.lifetimeRate : 0;
  const nt = newTmcp[name] || { jobs: 0, monthly: 0, annual: 0 };
  const bo = rule.technicianPlan ? bonusFor(nt.annual) : { increments: 0, rate: 0, amount: 0 };
  const bonus = bo.amount;
  const tips = tipStatuses[name]?.eligible ? tipShare : 0;
  lines.push({ name, rule, b, base, commission, nt, bo, bonus, tips, total: commission + bonus + tips });
}

const grand = lines.reduce((a, l) => a + l.total, 0);

L.push('## Payable');
L.push('');
L.push('| Person | Plan | Commission basis | Commission | New TMCP (annual value) | TMCP bonus | Tip share | Total |');
L.push('|---|---|---:|---:|---:|---:|---:|---:|');
for (const l of lines) {
  const basisCell = !l.rule.eligible ? '—'
    : `${money(l.base)}${l.rule.commissionAppliesTo === 'TMCP' ? ' (TMCP only)' : ''}`;
  L.push(`| ${l.name} | ${l.rule.role} | ${basisCell} | ${l.rule.eligible ? money(l.commission) : '—'} | ${l.rule.technicianPlan ? `${l.nt.jobs} × ${money(l.nt.annual)}`.replace(` × ${money(0)}`, ' × —') : '—'} | ${l.rule.technicianPlan ? money(l.bonus) : '—'} | ${tipStatuses[l.name]?.eligible ? money(l.tips) : '—'} | ${money(l.total)} |`);
}
const un = book['(UNATTRIBUTABLE)'];
if (un) L.push(`| _(unattributable)_ | — | ${money(un.invoiced)} | — | — | — | — | ${money(0)} |`);
L.push(`| **TOTAL** | | | **${money(lines.reduce((a, l) => a + l.commission, 0))}** | | **${money(lines.reduce((a, l) => a + l.bonus, 0))}** | **${money(tipPool)}** | **${money(grand)}** |`);
L.push('');

if (suspectValues.length) {
  L.push(`**Annual prepay${suspectValues.length > 1 ? 's' : ''} counted at face value** (not ×12): ${suspectValues.map(v => `#${v.jobNumber} ${v.client} ${money(v.total)} — credited to ${v.seller}`).join('; ')}.`);
  L.push('');
}

L.push('## TMCP bonus detail');
L.push('');
L.push('New TMCP conversions are valued at **contracted annual value** (monthly plan × 12). Increments are whole $1,000s; the band the month\'s total lands in sets the rate, and that rate applies retroactively to every increment.');
L.push('');
L.push('| Person | New TMCP sales | Monthly added | Annual value | Increments | Band rate | Bonus | To next band |');
L.push('|---|---:|---:|---:|---:|---:|---:|---:|');
for (const l of lines.filter(x => x.rule.technicianPlan)) {
  const next = PLAN.tmcpBonus.bands.find(b => b.min > l.nt.annual);
  const gap = next ? `${money(next.min - l.nt.annual)} → ${money(Math.floor(next.min / PLAN.tmcpBonus.incrementSize) * next.perIncrement)}` : 'top band';
  L.push(`| ${l.name} | ${l.nt.jobs} | ${money(l.nt.monthly)}/mo | ${money(l.nt.annual)} | ${l.bo.increments} | ${l.bo.rate ? money(l.bo.rate) + '/increment' : 'below threshold'} | ${money(l.bonus)} | ${gap} |`);
}
L.push('');
L.push('Bands: ' + PLAN.tmcpBonus.bands.map(b => `${money(b.min)}${b.max === null ? '+' : `–${money(b.max)}`} → ${b.perIncrement ? money(b.perIncrement) + '/inc' : 'no bonus'}`).join(' | '));
L.push('');
L.push('The bonus is unconditional — the forfeiture gates in the plan document (ticket, complaint, accident, fleet grade) are retired, as is the $50 Google review bonus. Every figure in this statement comes from Jobber, so a month closes with no manual data entry.');
L.push('');

L.push('## Tip pool');
L.push('');
L.push(`${money(tipPool)} in tips on invoices issued in ${MONTH}, split evenly ${tipRoster.length} ways = **${money(tipShare)} each**.`);
L.push('');
L.push(`Sharing: ${tipRoster.map(n => tipStatuses[n].partial ? `${n} (part-month)` : n).join(', ')}.`);
L.push('');
L.push('Eligibility is being **in the field**, not job title, and it is resolved against this month rather than today — so re-running a past month still pays whoever was actually on a route then.');
L.push('');
if (partialTippers.length) {
  L.push(`> **Part-month field time:** ${partialTippers.map(n => `${n} (${[tipStatuses[n].from ? `from ${tipStatuses[n].from}` : '', tipStatuses[n].until ? `until ${tipStatuses[n].until}` : ''].filter(Boolean).join(', ')})`).join('; ')} was in the field for only part of ${MONTH} but takes a full even share, because the split is even by rule. Pro-rate by hand if that is not what you want.`);
  L.push('');
}
L.push(`Tips came in on ${rows.filter(r => r.tips > 0).length} of ${rows.length} invoices. A tip paid late lands on the invoice's month, which can move a closed month's pool after payout — treat a published statement as the record of what was paid.`);
L.push('');

L.push('## What Jobber\'s own report would have paid');
L.push('');
L.push('Jobber\'s Salesperson report reads the salesperson field **on the invoice**. Where that field is blank — which is most of the month — the sale disappears from it, even though the quote and the job both name who sold it.');
L.push('');
L.push('| Person | Credited off the invoice field alone | Credited with the chain resolved | Commission understated by |');
L.push('|---|---:|---:|---:|');
const naiveAll = {}, naiveTmcp = {};
for (const r of rows) {
  if (!r.invSeller) continue;
  naiveAll[r.invSeller] = (naiveAll[r.invSeller] || 0) + r.total;
  if (r.product === 'TMCP') naiveTmcp[r.invSeller] = (naiveTmcp[r.invSeller] || 0) + r.total;
}
let naiveTotal = 0, fixedTotal = 0;
for (const name of [...new Set([...Object.keys(naiveAll), ...Object.keys(book)])].filter(n => n !== '(UNATTRIBUTABLE)')
  .sort((a, b) => (book[b]?.invoiced || 0) - (book[a]?.invoiced || 0))) {
  const rule = ruleFor(name);
  const a = (rule.commissionAppliesTo === 'TMCP' ? naiveTmcp[name] : naiveAll[name]) || 0;
  const b = commissionBase(name);
  const ca = rule.eligible ? a * rule.lifetimeRate : 0;
  const cb = rule.eligible ? b * rule.lifetimeRate : 0;
  naiveTotal += ca; fixedTotal += cb;
  const delta = cb - ca;
  L.push(`| ${name} | ${money(a)} | ${money(b)} | ${!rule.eligible ? 'n/a' : (delta >= 0 ? money(delta) : `**${money(delta)} (over)**`)} |`);
}
L.push(`| **Commission total** | **${money(naiveTotal)}** | **${money(fixedTotal)}** | **${money(fixedTotal - naiveTotal)}** |`);
L.push('');

L.push('## How each person\'s credit was established');
L.push('');
L.push('| Person | Invoices | Via the quote/job/invoice chain | Recovered from client history | Collected |');
L.push('|---|---:|---:|---:|---:|');
for (const [name, b] of Object.entries(book).sort((a, b2) => b2[1].invoiced - a[1].invoiced)) {
  L.push(`| ${name} | ${b.invoices} | ${b.viaChain} (${money(b.viaChainAmt)}) | ${b.viaHistory} (${money(b.viaHistoryAmt)}) | ${money(b.collected)} |`);
}
L.push('');
L.push('"Recovered from client history" means the invoice itself named nobody and the credit came from the earliest seller on that customer\'s record. That is the right answer for a recurring TMCP bill, but it is an inference — spot-check these before a first payout.');
L.push('');

const unsold = (raw.jobsSold?.nodes || []).filter(j => !sellerOf(j));
if (unsold.length) {
  L.push(`## ${unsold.length} jobs sold this month carry no salesperson`);
  L.push('');
  L.push(`Worth ${money(unsold.reduce((a, j) => a + (j.total ?? 0), 0))}/mo in job value, of which ${unsold.filter(j => productOf(j.lineItems?.nodes) === 'TMCP').length} are TMCP. That is bonus credit nobody is getting. Setting the salesperson on the quote at point of sale is the only thing that stops this recurring.`);
  L.push('');
}

L.push('## Rules applied');
L.push('');
for (const [name, r] of Object.entries(rates.people)) {
  L.push(`- **${name}** — ${r.role}, ${r.eligible ? `${pct(r.lifetimeRate)} on ${r.commissionAppliesTo || 'ALL'}` : 'no commission'}${r.technicianPlan ? ', on the technician plan' : ''}${r.rateNote ? `. ${r.rateNote}` : ''}`);
}

const outMd = path.join(BRIEF, `${MONTH}_commission-statement.md`);
fs.writeFileSync(outMd, L.join('\n'));

const csv = ['person,invoice,date,client,product,invoiced,collected,tip,counts_for_commission,credit_basis,evidence,url'];
for (const r of rows) {
  const rule = ruleFor(r.creditedTo || '');
  const counts = rule.eligible && (rule.commissionAppliesTo !== 'TMCP' || r.product === 'TMCP') ? 'yes' : 'no';
  csv.push([`"${r.creditedTo || '(UNATTRIBUTABLE)'}"`, r.invoiceNumber, r.issuedDate, `"${r.client.replace(/"/g, '""')}"`,
    r.product, r.total, r.collected, r.tips || 0, counts, r.creditBasis,
    `"${(r.creditEvidence || '').replace(/"/g, '""')}"`, r.invoiceUrl].join(','));
}
fs.writeFileSync(path.join(BRIEF, `${MONTH}_commission-detail.csv`), csv.join('\n'));

console.log(`Statement: ${outMd}\n`);
console.log(L.join('\n'));
