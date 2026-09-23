#!/usr/bin/env node
// Parse the Gusto "time tracking hours" CSV export (per employee sections, one row per day) into
// private/gusto/paid-hours.json: { tech, date, totalHours, regularHours, overtime, clockIn, clockOut, breaks[], note }.
// Paid hours are the success metric for the redesign: a route-day is what the company paid for it.
// Output stays in the gitignored private folder; stage docs carry only per-tech weekly totals (hours, never pay).
//
// Usage: node parse-gusto-hours.mjs <csv path>   (defaults to the newest *time-tracking-hours*.csv in private/gusto)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DIR = path.join(ROOT, 'projects/briefs/route-engine/redesign/private/gusto');
let file = process.argv[2];
if (!file) { const c = fs.readdirSync(DIR).filter(f => /time-tracking-hours.*\.csv$/i.test(f)).sort(); file = path.join(DIR, c[c.length - 1]); }
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const parseCsv = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
// Gusto lists employees as "Last, First" in section headers; map to the names Jobber uses.
const NAME_MAP = { 'Alexander, Tavis': 'Tavis Alexander', 'Franks, Alias': 'Alias Franks', 'LaVergne, Lukas': 'Luke LaVergne', 'Norton, Robert': 'Robert Norton', 'Ventura, Cory': 'Cory Ventura', 'Hill, Spencer': 'Spencer Hill' };
const rows = []; let tech = null, header = null;
for (const raw of lines) {
  const m = raw.match(/^"Hours for (.+)"$/); if (m) { tech = NAME_MAP[m[1]] || m[1]; header = null; continue; }
  if (!tech) continue;
  const cells = parseCsv(raw);
  if (cells[0] === 'Date') { header = cells; continue; }
  if (!header || !/^\d\d\/\d\d\/\d\d$/.test(cells[0])) continue;
  const rec = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  const [mm, dd, yy] = cells[0].split('/'); const date = `20${yy}-${mm}-${dd}`;
  const span = (rec['Hours'] || '').match(/^(\d{1,2}:\d\d [AP]M) - (\d{1,2}:\d\d [AP]M)/);
  const breaks = Object.keys(rec).filter(k => /^Breaks/.test(k)).map(k => rec[k]).filter(Boolean);
  rows.push({ tech, date, totalHours: +rec['Total hours'] || 0, regularHours: +rec['Regular hours'] || 0, overtime: +rec['Overtime'] || 0, clockIn: span ? span[1] : null, clockOut: span ? span[2] : null, breaks, note: rec['Notes'] || '', status: rec['Approval status'] || '' });
}
const out = path.join(DIR, 'paid-hours.json');
fs.writeFileSync(out, JSON.stringify({ source: path.basename(file), parsedAt: new Date().toISOString(), rows }, null, 1));
// summary: per tech per ISO week (Mon-start) total + OT, plus zero-hour weekdays
const mondayOf = d => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const techs = [...new Set(rows.map(r => r.tech))]; const weeks = [...new Set(rows.map(r => mondayOf(r.date)))].sort();
console.log(`parsed ${rows.length} day-rows for ${techs.length} techs from ${path.basename(file)} -> ${path.relative(ROOT, out)}\n`);
console.log('tech'.padEnd(18) + weeks.map(w => w.slice(5).padEnd(12)).join('') + 'total   OT');
for (const t of techs) {
  const cells = weeks.map(w => { const r = rows.filter(x => x.tech === t && mondayOf(x.date) === w); const tot = r.reduce((s, x) => s + x.totalHours, 0), ot = r.reduce((s, x) => s + x.overtime, 0); return `${tot.toFixed(1)}${ot ? '+' + ot.toFixed(1) : ''}`.padEnd(12); });
  const tot = rows.filter(x => x.tech === t).reduce((s, x) => s + x.totalHours, 0), ot = rows.filter(x => x.tech === t).reduce((s, x) => s + x.overtime, 0);
  console.log(t.padEnd(18) + cells.join('') + tot.toFixed(1).padStart(6) + ot.toFixed(1).padStart(6));
}
const zeroWeekdays = rows.filter(r => r.totalHours === 0 && ![0, 6].includes(new Date(r.date + 'T12:00:00Z').getUTCDay()));
console.log(`\nweekday rows with zero hours (absence / no clock): ${zeroWeekdays.length}` + (zeroWeekdays.length ? ' -> ' + zeroWeekdays.map(r => `${r.tech.split(' ')[0]} ${r.date}`).join(', ') : ''));
const long = rows.filter(r => r.totalHours >= 10).map(r => `${r.tech.split(' ')[0]} ${r.date} ${r.totalHours}h ${r.clockIn}-${r.clockOut}`);
console.log(`days at 10 h or more: ${long.length}` + (long.length ? '\n  ' + long.join('\n  ') : ''));
