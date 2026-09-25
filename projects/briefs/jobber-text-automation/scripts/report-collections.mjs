#!/usr/bin/env node
// report-collections.mjs — turns the open-balance pull into the collections work pack.
//
//   node projects/briefs/jobber-text-automation/scripts/pull-past-due.mjs
//   node projects/briefs/jobber-text-automation/scripts/pull-client-open-balances.mjs
//   node projects/briefs/jobber-text-automation/scripts/report-collections.mjs
//
// Writes data/{YYYY-MM-DD}_collections.md — cohorts, channel per cohort, per-invoice pay links.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const arg = process.argv.find(a => a.endsWith('.json'));
const src = arg || fs.readdirSync(DATA_DIR).filter(f => /_client-open-balances\.json$/.test(f)).sort().pop();
const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, path.basename(src)), 'utf8'));

const m = v => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = s => String(s).replace(/\s+/g, ' ').trim();
const phone = r => {
  const p = r.phones.find(x => x.primary && x.smsAllowed) || r.phones.find(x => x.smsAllowed) || r.phones[0];
  return p ? p.number : '—';
};
const textable = r => r.phones.some(p => p.smsAllowed);
// Org accounts get a call or an email, never the collections text robot (brief, 2026-08-11).
const COMMERCIAL = /plaza|storage|\bhoa\b|association|archers|wakefield|rental management|\bllc\b|\binc\b|mill\b|church|school|district/i;
const isOrg = r => COMMERCIAL.test(r.name);

const pt = new Date(d.generatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
const today = d.generatedAt.slice(0, 10);
const L = [];
const p = s => L.push(s);

p(`# Collections work pack — ${today}`);
p('');
p(`**Pulled live from Jobber ${pt} PT. Read-only — nothing was sent.**`);
p('');
p(`**${d.rows.length} clients / ${m(d.openBalance)} open**, of which **${m(d.pastDueBalance)} is past due.**`);
p('');
p('This is the full open balance per client, not the `status: past_due` slice. An invoice that is');
p('issued but not yet due is invisible to the past-due filter and understates what to ask for on a');
p('call — Western Plaza shows $1,000 past due and owes $1,700.');
p('');

p('## Where the money is');
p('');
p('| Age of oldest open invoice | Clients | Open | Channel |');
p('|---|--:|--:|---|');
const buckets = [
  [0, 14, 'leave alone — September billing is still landing'],
  [15, 15, 'TEXT — the Sep 1 TMCP batch, due Aug 31'],
  [16, 30, 'TEXT — slipping, never chased'],
  [31, 60, 'CALL — texted in August, did not pay'],
  [61, 9999, 'CALL — chronic, and never actually texted'],
];
for (const [lo, hi, note] of buckets) {
  const s = d.rows.filter(r => r.oldestDaysPastDue >= lo && r.oldestDaysPastDue <= hi);
  p(`| ${hi === 9999 ? lo + '+ days' : `${lo}-${hi} days`} | ${s.length} | ${m(s.reduce((a, x) => a + x.openBalance, 0))} | ${note} |`);
}
p('');
p('| Cut | Clients | Open |');
p('|---|--:|--:|');
const cut = (label, f) => {
  const s = d.rows.filter(f);
  p(`| ${label} | ${s.length} | ${m(s.reduce((a, x) => a + x.openBalance, 0))} |`);
};
cut('Card already on file', r => r.cardsOnFile > 0);
cut('No card on file', r => !r.cardsOnFile);
cut('Autopay switched ON', r => r.autopay);
cut('Never opened the invoice in the client hub', r => r.neverOpened);
cut('Commercial / HOA / property manager (never text)', isOrg);
cut('No email address on file at all', r => !r.emails.length);
p('');

const section = (title, rows, note) => {
  if (!rows.length) return;
  p(`## ${title} — ${rows.length} clients, ${m(rows.reduce((a, x) => a + x.openBalance, 0))}`);
  p('');
  if (note) { p(note); p(''); }
  p('| Days | Client | Open | Past due | Card | Phone | Last texted | Opened? |');
  p('|--:|---|--:|--:|:--:|---|---|:--:|');
  for (const r of rows) {
    p(`| ${r.oldestDaysPastDue} | ${clean(r.name)} | **${m(r.openBalance)}** | ${m(r.pastDueBalance)} | ${r.cardsOnFile ? 'yes' : '—'} | ${phone(r)}${textable(r) ? '' : ' (no SMS)'} | ${r.lastTexted || 'never'} | ${r.neverOpened ? 'never' : 'yes'} |`);
  }
  p('');
};

const org = d.rows.filter(isOrg).sort((a, b) => b.openBalance - a.openBalance);
const res = d.rows.filter(r => !isOrg(r));
const band = (lo, hi) => res.filter(r => r.oldestDaysPastDue >= lo && r.oldestDaysPastDue <= hi).sort((a, b) => b.oldestDaysPastDue - a.oldestDaysPastDue || b.openBalance - a.openBalance);

section('Chronic — 61+ days', band(61, 9999), 'Never opened an invoice in the client hub. Voice or a payment-plan call; text has had its chance.');
section('Stalled — 31 to 60 days', band(31, 60), 'All texted in the August runs and still unpaid. Text has already failed on this cohort once.');
section('Slipping — 16 to 30 days', band(16, 30), 'Never chased at all. Cheapest money on the board — one text each.');
section('The September batch — 15 days', band(15, 15), 'Invoiced 2026-09-01, due 2026-08-31. Routine monthly lag, exactly what the text robot exists for.');
section('Fresh — under 15 days', band(0, 14), 'Do not chase yet.');
section('Commercial / HOA / property managers', org, 'Phone or email to the AP contact. Never the text robot — these go through accounts payable, not a mobile.');

p('## Invoice detail and pay links');
p('');
for (const r of d.rows.filter(x => x.oldestDaysPastDue >= 16).sort((a, b) => b.openBalance - a.openBalance)) {
  p(`### ${clean(r.name)} — ${m(r.openBalance)}${r.cardsOnFile ? ` · ${r.cardsOnFile} card${r.cardsOnFile > 1 ? 's' : ''} on file` : ''}`);
  p(`${phone(r)}${r.emails.length ? ' · ' + r.emails.join(', ') : ' · **no email on file**'}${r.address ? ' · ' + r.address : ''}`);
  for (const i of r.invoices) {
    p(`- Invoice **#${i.number}** — ${m(i.balance)}${i.balance !== i.total ? ` of ${m(i.total)}` : ''}, due ${i.due.slice(0, 10)}, **${i.daysPastDue > 0 ? i.daysPastDue + ' days past due' : 'not yet due'}**${i.viewed ? '' : ' — never opened'}`);
    if (i.payLink) p(`  ${i.payLink}`);
  }
  p('');
}

const dest = path.join(DATA_DIR, `${today}_collections.md`);
fs.writeFileSync(dest, L.join('\n'));
console.log(`wrote ${dest}  (${L.length} lines)`);
