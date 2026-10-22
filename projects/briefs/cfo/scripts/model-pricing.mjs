#!/usr/bin/env node
// model-pricing.mjs — TMCP price-reset scenarios (read-only).
// Usage: node projects/briefs/cfo/scripts/model-pricing.mjs [--effective=3] [--pct=0.10]
// Reads data/active-book.json (pull-active-book.mjs). Prints existing-book and new-sale scenarios,
// each with cash (2027 in-year), profit (run-rate contribution) and the churn flip point.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? +a.split('=')[1] : d; };
const EFFECTIVE_MONTH = arg('effective', 3);   // 1 = Jan 2027
const PCT = arg('pct', 0.10);
const MONTHS = 13 - EFFECTIVE_MONTH;           // months billed at the new price in 2027
const VAR_COST_MO = 41;                        // ESTIMATE: $20.7 variable/visit × ~2 visits/mo (tmcp-annual-unit-economics)
const COMMERCIAL_FLOOR = 200;                  // $200+/mo = commercial contract, priced at renewal instead

const book = JSON.parse(fs.readFileSync(path.join(here, '../data/active-book.json'), 'utf8'));
const jobs = (Array.isArray(book) ? book : Object.values(book).find(Array.isArray)).filter(j =>
  /monthly/i.test(j.invoiceSchedule?.scheduleSummary || '') &&
  j.lineItems.nodes.some(l => /total mole control/i.test(l.name)));
const listPrice = j => j.lineItems.nodes.filter(l => /total mole control/i.test(l.name)).reduce((s, l) => s + l.totalPrice, 0);
const hasDiscount = j => j.lineItems.nodes.some(l => l.totalPrice < 0);
// Military/veteran and senior discounts are honored: those jobs keep today's price (Spencer, 2026-10-20)
// Plus named exemptions with no line item: #5109 Joe Crecca (veteran), #4749 Thomas Varrelman (friends and family),
// #7961 + #8687 Kelly Kunz's two properties (Renton $75, Dancing Pines Montessori $85), multi-property price
const EXEMPT_JOBS = new Set([5109, 4749, 7961, 8687]);
const isMilitary = j => EXEMPT_JOBS.has(j.jobNumber) || j.lineItems.nodes.some(l => /milit|veteran|senior/i.test(l.name));

// Existing-book groups
const groups = {
  'Grandfathered <$100 (no discount line)': jobs.filter(j => listPrice(j) < 100 && !hasDiscount(j) && !isMilitary(j)).map(j => ({ now: listPrice(j), next: 100 })),
  'Residential $100–199, +10%': jobs.filter(j => listPrice(j) >= 100 && listPrice(j) < COMMERCIAL_FLOOR && !isMilitary(j)).map(j => ({ now: listPrice(j), next: Math.round(listPrice(j) * (1 + PCT) / 5) * 5 })),
};
const skipped = {
  'Military/veteran/senior/named exemptions (honored, no change)': jobs.filter(isMilitary).length,
  'Under $100 with a discount line (leave)': jobs.filter(j => listPrice(j) < 100 && hasDiscount(j)).length,
  'Commercial $200+ (renewal pricing)': jobs.filter(j => listPrice(j) >= COMMERCIAL_FLOOR).length,
};

const LOSS = [0, 0.03, 0.05, 0.10, 0.15];
console.log(`TMCP monthly jobs on book: ${jobs.length} · effective month ${EFFECTIVE_MONTH} (${MONTHS} months in 2027)\n`);
for (const [name, g] of Object.entries(groups)) {
  const n = g.length, now = g.reduce((s, x) => s + x.now, 0), next = g.reduce((s, x) => s + x.next, 0);
  const lift = next - now, avgNext = next / n, avgNow = now / n;
  // Profit flip: lose x of the group and contribution is unchanged
  const flip = 1 - (avgNow - VAR_COST_MO) / (avgNext - VAR_COST_MO);
  const revFlip = 1 - now / next;
  console.log(`## ${name}: ${n} jobs, $${now.toFixed(0)} → $${next.toFixed(0)}/mo (+$${lift.toFixed(0)}/mo, +${(100 * lift / now).toFixed(1)}%)`);
  console.log(`   revenue flip ${(100 * revFlip).toFixed(1)}% lost · contribution flip ${(100 * flip).toFixed(1)}% lost`);
  console.log('   lost | jobs lost | net MRR Δ | 2027 cash Δ | run-rate contribution Δ/yr');
  for (const x of LOSS) {
    const lost = Math.round(n * x);
    const mrr = lift - lost * avgNext;               // gain on stayers minus lost jobs at their old price... approximated at new avg
    const mrrExact = (next * (1 - x)) - now;
    const contrib = ((avgNext - VAR_COST_MO) * n * (1 - x) - (avgNow - VAR_COST_MO) * n) * 12;
    console.log(`   ${String(100 * x).padStart(3)}% | ${String(lost).padStart(9)} | ${mrrExact.toFixed(0).padStart(9)} | ${(mrrExact * MONTHS).toFixed(0).padStart(11)} | ${contrib.toFixed(0).padStart(10)}`);
    void mrr;
  }
  console.log('');
}
console.log('Not touched:', skipped);
