// close-rate-mix.mjs — resolve the unclassified quote bucket and compute revenue-weighted mix.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(path.resolve(here, '..'), 'data');
const cf = readdirSync(cacheDir).filter((f) => f.startsWith('_close-rate-cache_')).sort().pop();
const { jobs, quotes } = JSON.parse(readFileSync(path.join(cacheDir, cf), 'utf8'));
const TZ = 'America/Los_Angeles';
const ptMonth = (i) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(i)).slice(0, 7);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '—');
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const TMC_RE = /total mole control|tmcp|year.?round|annual mole control|(?:[2-9]|\d\d+)\s*month of mole control/i;
const QF_RE = /quick fix|1\s*month of mole control|month of mole control/i;
const lines = (o) => (o.lineItems?.nodes || []).map((l) => l.name || '').join(' | ');
const cls = (o) => { const s = lines(o) + ' ' + (o.title || ''); return TMC_RE.test(s) ? 'TMC' : QF_RE.test(s) ? 'QF' : 'other'; };

const others = quotes.filter((q) => cls(q) === 'other');
console.log(`Unclassified quotes: ${others.length} of ${quotes.length}. Distinct line-item text (top 25):`);
const t = {};
for (const q of others) { const k = lines(q) || '(no line items)'; t[k] = t[k] || { n: 0, v: 0 }; t[k].n++; t[k].v += q.amounts?.total || 0; }
for (const [k, v] of Object.entries(t).sort((a, b) => b[1].n - a[1].n).slice(0, 25)) {
  console.log(`  ${String(v.n).padStart(4)}x  avg ${money(v.v / v.n).padStart(8)}   ${k.slice(0, 95)}`);
}

// revenue-weighted mix on jobs created in window (TMC job.total is a MONTHLY rate)
console.log('\n--- Revenue-weighted mix, jobs created in window ---');
const qf = jobs.filter((j) => cls(j) === 'QF');
const tmc = jobs.filter((j) => cls(j) === 'TMC');
const sum = (a) => a.reduce((s, j) => s + (j.total || 0), 0);
const qfV = sum(qf), tmcMo = sum(tmc), tmcYr = tmcMo * 12;
console.log(`Quick Fix : ${qf.length} jobs, ${money(qfV)} one-time      (avg ${money(qfV / qf.length)})`);
console.log(`TMC       : ${tmc.length} jobs, ${money(tmcMo)}/month = ${money(tmcYr)}/yr  (avg ${money(tmcMo / tmc.length)}/mo)`);
console.log(`Annualized value share: QF ${pct(qfV, qfV + tmcYr)}  |  TMC ${pct(tmcYr, qfV + tmcYr)}`);
console.log(`First-90-days cash share: QF ${pct(qfV, qfV + tmcMo * 3)}  |  TMC ${pct(tmcMo * 3, qfV + tmcMo * 3)}`);

// monthly quote issue rate vs close rate
console.log('\n--- Quote issue + close by month (window) ---');
console.log('month     quotes  converted  approved  open  archived   close%(decided)');
for (const m of ['2026-05', '2026-06', '2026-07']) {
  const qs = quotes.filter((q) => ptMonth(q.createdAt) === m);
  const c = qs.filter((q) => q.quoteStatus === 'converted').length;
  const a = qs.filter((q) => q.quoteStatus === 'approved').length;
  const o = qs.filter((q) => ['awaiting_response', 'draft', 'changes_requested'].includes(q.quoteStatus)).length;
  const x = qs.filter((q) => q.quoteStatus === 'archived').length;
  console.log(`${m}  ${String(qs.length).padStart(6)}  ${String(c).padStart(9)}  ${String(a).padStart(8)}  ${String(o).padStart(4)}  ${String(x).padStart(8)}   ${pct(c + a, c + a + x).padStart(6)}`);
}

// average quote value by product, won only
console.log('\n--- Average WON quote value by product (12 mo) ---');
for (const p of ['QF', 'TMC', 'other']) {
  const w = quotes.filter((q) => cls(q) === p && ['converted', 'approved'].includes(q.quoteStatus));
  const v = w.reduce((s, q) => s + (q.amounts?.total || 0), 0);
  console.log(`  ${p.padEnd(6)} ${String(w.length).padStart(4)} won, total ${money(v).padStart(11)}, avg ${money(w.length ? v / w.length : 0)}`);
}
