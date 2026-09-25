#!/usr/bin/env node
// Audit the salesperson chain (quote -> job -> invoice) for one month and total
// commissionable revenue per salesperson.
//
// Usage: node analyze-commission.mjs [YYYY-MM]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../data');
const MONTH = process.argv[2] || fs.readdirSync(DATA).filter(f => f.endsWith('_raw.json')).sort().pop().slice(0, 7);
const raw = JSON.parse(fs.readFileSync(path.join(DATA, `${MONTH}_raw.json`), 'utf8'));

const money = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nameOf = (o) => (o?.name?.full || '').trim() || null;
const numId = (gid) => { try { return Buffer.from(gid, 'base64').toString('utf8').split('/').pop(); } catch { return null; } };

// Product comes from LINE ITEMS, never jobType (Spencer, 2026-08-05).
function product(lineItemNames = []) {
  const s = lineItemNames.join(' | ').toLowerCase();
  if (/total mole control/.test(s)) return 'TMCP';
  if (/quick fix/.test(s)) return 'Quick Fix';
  if (/barter|friends and family/.test(s)) return 'Barter/F&F';
  return 'Other';
}

const rows = [];
for (const inv of raw.invoices.nodes) {
  const jobs = inv.jobs?.nodes || [];
  const invSeller = nameOf(inv.salesperson);
  const jobSellers = [...new Set(jobs.map(j => nameOf(j.salesperson)).filter(Boolean))];
  const quoteSellers = [...new Set(jobs.map(j => nameOf(j.quote?.salesperson)).filter(Boolean))];
  const hasQuote = jobs.some(j => j.quote);

  // Quote is the source of truth; fall back down the chain.
  const resolved = quoteSellers[0] || jobSellers[0] || invSeller || null;

  const li = [
    ...(inv.lineItems?.nodes || []).map(x => x.name),
    ...jobs.flatMap(j => (j.lineItems?.nodes || []).map(x => x.name)),
  ];

  const problems = [];
  if (quoteSellers.length > 1 || jobSellers.length > 1) problems.push('MULTI_SELLER_ON_INVOICE');
  if (resolved && !invSeller) problems.push('INVOICE_MISSING_SELLER');
  if (resolved && jobs.length && !jobSellers.length) problems.push('JOB_MISSING_SELLER');
  if (hasQuote && !quoteSellers.length) problems.push('QUOTE_MISSING_SELLER');
  if (invSeller && quoteSellers.length && !quoteSellers.includes(invSeller)) problems.push('INVOICE_DISAGREES_WITH_QUOTE');
  if (invSeller && jobSellers.length && !jobSellers.includes(invSeller)) problems.push('INVOICE_DISAGREES_WITH_JOB');
  if (jobSellers.length && quoteSellers.length && !jobSellers.some(j => quoteSellers.includes(j))) problems.push('JOB_DISAGREES_WITH_QUOTE');
  if (!resolved) problems.push('NO_SELLER_ANYWHERE');

  rows.push({
    invoiceNumber: inv.invoiceNumber,
    invoiceUrl: `https://secure.getjobber.com/invoices/${numId(inv.id)}`,
    issuedDate: (inv.issuedDate || '').slice(0, 10),
    status: inv.invoiceStatus,
    client: inv.client?.name || '',
    total: inv.amounts?.total ?? 0,
    collected: inv.amounts?.paymentsTotal ?? 0,
    balance: inv.amounts?.invoiceBalance ?? 0,
    invSeller, jobSellers, quoteSellers, resolved,
    hasQuote,
    jobNumbers: jobs.map(j => j.jobNumber),
    quoteNumbers: jobs.map(j => j.quote?.quoteNumber).filter(Boolean),
    product: product(li),
    problems,
  });
}

// ---------- Attribution audit ----------
const clean = rows.filter(r => r.problems.length === 0);
const broken = rows.filter(r => r.problems.length > 0);
const byProblem = {};
for (const r of broken) for (const p of r.problems) (byProblem[p] ??= []).push(r);

// ---------- Commission totals ----------
const bySeller = {};
for (const r of rows) {
  const k = r.resolved || '(UNATTRIBUTED)';
  const s = (bySeller[k] ??= { invoices: 0, invoiced: 0, collected: 0, byProduct: {}, atRisk: 0, atRiskAmt: 0 });
  s.invoices++; s.invoiced += r.total; s.collected += r.collected;
  const p = (s.byProduct[r.product] ??= { n: 0, invoiced: 0, collected: 0 });
  p.n++; p.invoiced += r.total; p.collected += r.collected;
  if (r.problems.length) { s.atRisk++; s.atRiskAmt += r.total; }
}

const L = [];
L.push(`# Commission and salesperson-attribution audit — ${MONTH}`);
L.push('');
L.push(`Source: ${raw.invoices.nodes.length} invoices issued in ${MONTH}, plus ${raw.quotes.nodes.length} quotes created in ${MONTH}. Pulled ${raw.pulledAt.slice(0, 16).replace('T', ' ')}Z.`);
L.push('');
L.push('## 1. Attribution health');
L.push('');
L.push('| | Invoices | Invoiced |');
L.push('|---|---:|---:|');
L.push(`| Chain clean (quote = job = invoice) | ${clean.length} | ${money(clean.reduce((a, r) => a + r.total, 0))} |`);
L.push(`| Has a problem | ${broken.length} | ${money(broken.reduce((a, r) => a + r.total, 0))} |`);
L.push(`| **Total** | **${rows.length}** | **${money(rows.reduce((a, r) => a + r.total, 0))}** |`);
L.push('');
L.push('### Problems by type');
L.push('');
L.push('| Problem | Invoices | Invoiced | What it means |');
L.push('|---|---:|---:|---|');
const EXPLAIN = {
  INVOICE_MISSING_SELLER: 'Seller known upstream but the invoice has none — Jobber\'s own commission report misses it',
  JOB_MISSING_SELLER: 'Quote had a seller, the job lost it',
  QUOTE_MISSING_SELLER: 'A quote exists but nobody was set on it at the source',
  INVOICE_DISAGREES_WITH_QUOTE: 'Invoice credits a different person than the quote',
  INVOICE_DISAGREES_WITH_JOB: 'Invoice credits a different person than the job',
  JOB_DISAGREES_WITH_QUOTE: 'Job credits a different person than the quote',
  MULTI_SELLER_ON_INVOICE: 'One invoice spans jobs sold by different people — must be split by hand',
  NO_SELLER_ANYWHERE: 'No quote and no seller anywhere — unattributable without a human call',
};
for (const [p, list] of Object.entries(byProblem).sort((a, b) => b[1].length - a[1].length)) {
  L.push(`| \`${p}\` | ${list.length} | ${money(list.reduce((a, r) => a + r.total, 0))} | ${EXPLAIN[p] || ''} |`);
}
L.push('');
L.push('## 2. Commissionable totals by salesperson');
L.push('');
L.push('Seller is resolved from the QUOTE first, then the job, then the invoice — so a broken chain still lands on the right person here, even where Jobber\'s own report would miss it.');
L.push('');
L.push('| Salesperson | Invoices | Invoiced | Collected | Of which flagged |');
L.push('|---|---:|---:|---:|---:|');
for (const [k, s] of Object.entries(bySeller).sort((a, b) => b[1].invoiced - a[1].invoiced)) {
  L.push(`| ${k} | ${s.invoices} | ${money(s.invoiced)} | ${money(s.collected)} | ${s.atRisk} (${money(s.atRiskAmt)}) |`);
}
L.push('');
L.push('### Split by product');
L.push('');
L.push('| Salesperson | Product | Invoices | Invoiced | Collected |');
L.push('|---|---|---:|---:|---:|');
for (const [k, s] of Object.entries(bySeller).sort((a, b) => b[1].invoiced - a[1].invoiced)) {
  for (const [p, v] of Object.entries(s.byProduct).sort((a, b) => b[1].invoiced - a[1].invoiced)) {
    L.push(`| ${k} | ${p} | ${v.n} | ${money(v.invoiced)} | ${money(v.collected)} |`);
  }
}
L.push('');
L.push('## 3. Fix list — every invoice with a broken chain');
L.push('');
L.push('| Invoice | Date | Client | Total | Quote seller | Job seller | Invoice seller | Problem | Link |');
L.push('|---|---|---|---:|---|---|---|---|---|');
for (const r of [...broken].sort((a, b) => b.total - a.total)) {
  L.push(`| ${r.invoiceNumber} | ${r.issuedDate} | ${r.client} | ${money(r.total)} | ${r.quoteSellers.join(', ') || '—'} | ${r.jobSellers.join(', ') || '—'} | ${r.invSeller || '—'} | ${r.problems.join(', ')} | [open](${r.invoiceUrl}) |`);
}

const outMd = path.resolve(HERE, `../${MONTH}_commission-audit.md`);
fs.writeFileSync(outMd, L.join('\n'));

// CSV of the fix list, for working through in a sheet
const csv = ['invoice,date,client,total,collected,quote_seller,job_seller,invoice_seller,resolved_seller,product,problems,url'];
for (const r of [...broken].sort((a, b) => b.total - a.total)) {
  csv.push([r.invoiceNumber, r.issuedDate, `"${r.client.replace(/"/g, '""')}"`, r.total, r.collected,
    `"${r.quoteSellers.join('; ')}"`, `"${r.jobSellers.join('; ')}"`, `"${r.invSeller || ''}"`,
    `"${r.resolved || ''}"`, r.product, `"${r.problems.join('; ')}"`, r.invoiceUrl].join(','));
}
const outCsv = path.resolve(HERE, `../${MONTH}_fix-list.csv`);
fs.writeFileSync(outCsv, csv.join('\n'));

fs.writeFileSync(path.join(DATA, `${MONTH}_rows.json`), JSON.stringify({ month: MONTH, rows, bySeller }, null, 2));
console.log(`Report: ${outMd}\nFix list: ${outCsv}\n`);
console.log(L.slice(0, 60).join('\n'));
