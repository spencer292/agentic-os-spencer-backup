#!/usr/bin/env node
/**
 * make-service-day-sheet.mjs — build the office-facing "what day are we in your area?" lookup.
 *
 * Reads a territory grid and emits two artifacts for whoever is answering the phone:
 *   service-day-lookup.html  — self-contained, offline, type-a-zip instant answer
 *   service-day-sheet.md     — printable fallback, grouped by route day
 *
 * The grid is the same file push-week.mjs uses to force flexible visits onto a zip's
 * weekday, so the day in here is the day the truck is genuinely in that area.
 *
 * Usage:
 *   node make-service-day-sheet.mjs [--grid=territory-grid-v5.json] [--out=<dir>]
 *
 * Default --grid is territory-grid-v5.json (the live four-way grid), NOT territory-grid.json,
 * which is still the stale v4 three-truck map as of 2026-08-03.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const gridFile = String(args.grid || 'territory-grid-v5.json');
const gridPath = path.isAbsolute(gridFile) ? gridFile : path.join(HERE, gridFile);
const outDir = path.resolve(String(args.out || path.join(ROOT, 'projects/briefs/callrail-faq/service-day-lookup')));

if (!fs.existsSync(gridPath)) {
  console.error(`Grid not found: ${gridPath}`);
  process.exit(1);
}

const grid = JSON.parse(fs.readFileSync(gridPath, 'utf8'));
const gridStat = fs.statSync(gridPath);
const generatedAt = new Date();
/** Local calendar date — toISOString() would shift an evening edit to the next day. */
const localDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LONG = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };

/** Grid -> flat records. One record per zip. */
const records = Object.entries(grid.zips || {})
  .map(([zip, v]) => {
    const days = (v.days || [v.day]).filter(Boolean).map(d => String(d).toLowerCase());
    days.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
    // "Auburn/auburn" -> ["Auburn"]; dedupe case-insensitively, keep first casing seen.
    const seen = new Map();
    for (const c of String(v.cities || '').split('/').map(s => s.trim()).filter(Boolean)) {
      if (!seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
    }
    return {
      zip,
      days,
      tech: v.tech || '',
      techFirst: String(v.tech || '').split(' ')[0] || '',
      cities: [...seen.values()],
      visitsPerYear: v.visitsPerYear || 0,
    };
  })
  .sort((a, b) => a.zip.localeCompare(b.zip));

/**
 * City index. A city label is "ambiguous" only when its zips disagree on the DAY —
 * Puyallup spans six zips across Monday, Tuesday and Friday, so the zip is the only safe
 * answer there. A city split across techs on the same day (Seattle: 21 zips, all Tuesday,
 * two techs) is NOT ambiguous: the office never promises a technician, so "Tuesdays" is a
 * complete and correct answer.
 */
const cityIndex = new Map();
for (const r of records) {
  for (const c of r.cities) {
    const key = c.toLowerCase();
    if (!cityIndex.has(key)) cityIndex.set(key, { label: c, zips: [] });
    cityIndex.get(key).zips.push(r.zip);
  }
}
const cities = [...cityIndex.values()].map(({ label, zips }) => {
  const rows = zips.map(z => records.find(r => r.zip === z));
  const daySigs = new Set(rows.map(r => r.days.join('+')));
  const techs = new Set(rows.map(r => r.tech));
  return {
    label,
    zips,
    ambiguous: daySigs.size > 1,
    days: daySigs.size === 1 ? rows[0].days : [],
    techFirst: techs.size === 1 ? rows[0].tech.split(' ')[0] : 'varies by zip',
  };
}).sort((a, b) => a.label.localeCompare(b.label));

const ambiguousCount = cities.filter(c => c.ambiguous).length;

const payload = {
  grid: path.basename(gridPath),
  gridModified: localDay(gridStat.mtime),
  generated: localDay(generatedAt),
  records,
  cities,
  dayLong: DAY_LONG,
};

// ---------------------------------------------------------------- HTML

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Got Moles — Service Day Lookup</title>
<style>
  :root { --bg:#fff; --fg:#14181d; --mut:#6b7280; --line:#e5e7eb; --accent:#166534; --warn:#b45309; --warnbg:#fffbeb; --card:#f9fafb; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0f1115; --fg:#e8eaed; --mut:#9aa3af; --line:#262b33; --accent:#4ade80; --warn:#fbbf24; --warnbg:#2a2010; --card:#161a20; }
  }
  * { box-sizing:border-box }
  body { margin:0; padding:20px; max-width:720px; margin-inline:auto; background:var(--bg); color:var(--fg);
         font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  h1 { font-size:18px; margin:0 0 2px }
  .sub { color:var(--mut); font-size:13px; margin-bottom:14px }
  #q { width:100%; padding:14px 16px; font-size:22px; border:2px solid var(--line); border-radius:10px;
       background:var(--card); color:var(--fg); }
  #q:focus { outline:none; border-color:var(--accent) }
  .card { border:1px solid var(--line); border-radius:10px; padding:16px; margin-top:12px; background:var(--card) }
  .day { font-size:30px; font-weight:700; color:var(--accent); line-height:1.15 }
  .where { font-size:15px; margin-top:2px }
  .dates { margin-top:10px; font-size:14px }
  .dates b { font-weight:600 }
  .meta { margin-top:10px; padding-top:10px; border-top:1px solid var(--line); font-size:13px; color:var(--mut) }
  .warn { background:var(--warnbg); border-color:var(--warn) }
  .warn .day { color:var(--warn); font-size:20px }
  ul.zips { list-style:none; padding:0; margin:10px 0 0 }
  ul.zips li { padding:7px 0; border-top:1px solid var(--line); display:flex; gap:10px; align-items:baseline; font-size:14px }
  ul.zips li b { min-width:52px; font-variant-numeric:tabular-nums }
  .hint { color:var(--mut); font-size:13px; margin-top:14px }
  footer { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); color:var(--mut); font-size:12px }
  kbd { background:var(--card); border:1px solid var(--line); border-radius:4px; padding:1px 5px; font-size:12px }
</style>

<h1>Service Day Lookup</h1>
<div class="sub">Type the customer's <b>zip code</b>. City names alone are not reliable — ${ambiguousCount} of ${cities.length} cities span more than one route day.</div>

<input id="q" placeholder="98374" autocomplete="off" autofocus inputmode="numeric">
<div id="out"></div>
<div class="hint">Tip: you can also type a city to see which zips it covers — then ask the caller which one they're in.</div>

<footer>
  Generated ${payload.generated} from <b>${payload.grid}</b> (grid last changed ${payload.gridModified}).<br>
  Route days change when the territory grid is re-cut. If this file is more than a week old, ask Spencer for a fresh one.
</footer>

<script>
const DATA = ${JSON.stringify(payload)};
const DAY_IDX = { mon:1, tue:2, wed:3, thu:4, fri:5 };

function nextDates(dayKey, n = 3) {
  const out = [], today = new Date(); today.setHours(0,0,0,0);
  const target = DAY_IDX[dayKey];
  for (let i = 1; out.length < n; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (d.getDay() === target) out.push(d);
  }
  return out;
}
const fmt = d => d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });

function daysPhrase(days) {
  const long = days.map(d => DATA.dayLong[d]);
  return long.length === 1 ? long[0] + 's' : long.map(s => s + 's').join(' and ');
}

function renderZip(r) {
  const dates = r.days.flatMap(d => nextDates(d, 2))
    .sort((a,b) => a - b).slice(0, 3).map(fmt).join(' &middot; ');
  return \`<div class="card">
    <div class="day">\${daysPhrase(r.days)}</div>
    <div class="where">\${r.zip} — \${r.cities.join(', ')}</div>
    <div class="dates">Next route dates: <b>\${dates}</b></div>
    <div class="meta">Internal only — tech on this run: \${r.techFirst || 'unassigned'}. Never promise a technician by name.</div>
  </div>\`;
}

function renderCity(c) {
  if (!c.ambiguous) {
    const r = DATA.records.find(x => x.zip === c.zips[0]);
    const detail = c.zips.length > 1
      ? 'all ' + c.zips.length + ' zips are on the same day'
      : c.zips[0];
    return renderZip({ ...r, zip: c.label, cities: [detail], techFirst: c.techFirst });
  }
  const rows = c.zips.map(z => DATA.records.find(x => x.zip === z))
    .sort((a,b) => a.zip.localeCompare(b.zip))
    .map(r => \`<li><b>\${r.zip}</b> <span>\${daysPhrase(r.days)}</span></li>\`).join('');
  return \`<div class="card warn">
    <div class="day">Ask for the zip code</div>
    <div class="where">\${c.label} covers \${c.zips.length} zips on different route days.</div>
    <ul class="zips">\${rows}</ul>
    <div class="meta">Say: "Let me grab your zip so I give you the right day."</div>
  </div>\`;
}

function search(raw) {
  const q = raw.trim().toLowerCase();
  const out = document.getElementById('out');
  if (!q) { out.innerHTML = ''; return; }

  if (/^\\d+$/.test(q)) {
    if (q.length < 3) { out.innerHTML = ''; return; }   // still typing — don't flash "no match"
    const exact = DATA.records.find(r => r.zip === q);
    if (exact) { out.innerHTML = renderZip(exact); return; }
    const partial = DATA.records.filter(r => r.zip.startsWith(q));
    if (q.length >= 5) {
      out.innerHTML = \`<div class="card warn">
        <div class="day">Not in our route grid</div>
        <div class="where">\${q} isn't on any current route.</div>
        <div class="meta">Take the full address and phone, tell them you'll confirm coverage and call back today. Do not say yes or no. Flag it to Spencer.</div>
      </div>\`;
      return;
    }
    out.innerHTML = partial.slice(0, 12).map(renderZip).join('');
    return;
  }

  const hits = DATA.cities.filter(c => c.label.toLowerCase().includes(q));
  out.innerHTML = hits.length
    ? hits.slice(0, 6).map(renderCity).join('')
    : \`<div class="card warn"><div class="day">No match</div>
        <div class="where">Nothing matching "\${raw}". Try the zip code.</div></div>\`;
}

const box = document.getElementById('q');
box.addEventListener('input', e => search(e.target.value));
</script>
`;

// ---------------------------------------------------------------- Markdown (printable)

const byDay = new Map(DAY_ORDER.map(d => [d, []]));
for (const r of records) for (const d of r.days) byDay.get(d).push(r);

const mdLines = [
  '# Got Moles — Service Day Sheet',
  '',
  `**Generated ${payload.generated} from \`${payload.grid}\` (grid last changed ${payload.gridModified}).**`,
  'Route days change whenever the territory grid is re-cut. If this sheet is more than a week old, get a fresh one.',
  '',
  '## How to use it',
  '',
  '1. **Get the zip code.** City names are not enough — ' +
    `${ambiguousCount} of ${cities.length} cities in the grid span more than one route day ` +
    '(Seattle covers 21 zips, Tacoma 13, Puyallup 6).',
  '2. Find the zip below. That is the day the truck is in their area for **ongoing service visits**.',
  '3. Zip not listed? Take the address, say you\'ll confirm coverage and call back today. Never say yes or no on the spot.',
  '4. Never promise a technician by name — assignments move.',
  '',
];

for (const d of DAY_ORDER) {
  const rows = byDay.get(d).sort((a, b) => a.zip.localeCompare(b.zip));
  mdLines.push(`## ${DAY_LONG[d]} — ${rows.length} zips`, '');
  mdLines.push('| Zip | Cities | Also on | Tech (internal) |', '|---|---|---|---|');
  for (const r of rows) {
    const also = r.days.filter(x => x !== d).map(x => DAY_LONG[x]).join(', ') || '—';
    mdLines.push(`| ${r.zip} | ${r.cities.join(', ')} | ${also} | ${r.techFirst || '—'} |`);
  }
  mdLines.push('');
}

const ambRows = cities.filter(c => c.ambiguous);
mdLines.push(
  `## Cities that need a zip (${ambRows.length})`,
  '',
  'If the caller names one of these, ask for the zip before quoting a day.',
  '',
  '| City | Zips | Days involved |',
  '|---|---|---|',
);
for (const c of ambRows) {
  const days = [...new Set(c.zips.flatMap(z => records.find(r => r.zip === z).days))]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map(d => DAY_LONG[d]).join(', ');
  mdLines.push(`| ${c.label} | ${c.zips.join(', ')} | ${days} |`);
}
mdLines.push('');

// ---------------------------------------------------------------- write

fs.mkdirSync(outDir, { recursive: true });
const htmlOut = path.join(outDir, 'service-day-lookup.html');
const mdOut = path.join(outDir, 'service-day-sheet.md');
fs.writeFileSync(htmlOut, html);
fs.writeFileSync(mdOut, mdLines.join('\n'));

/**
 * Day-change tracking. A re-cut can silently invalidate what the office told customers
 * last week, so report which zips moved since the last generation.
 */
const statePath = path.join(outDir, '.last-daymap.json');
const dayMap = Object.fromEntries(records.map(r => [r.zip, r.days.join('+')]));
let changes = null;
if (fs.existsSync(statePath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const moved = Object.keys(dayMap).filter(z => prev.dayMap[z] && prev.dayMap[z] !== dayMap[z]);
    const added = Object.keys(dayMap).filter(z => !prev.dayMap[z]);
    const dropped = Object.keys(prev.dayMap).filter(z => !dayMap[z]);
    changes = { since: prev.generated, moved, added, dropped, prev: prev.dayMap };
  } catch { /* unreadable state — treat as first run */ }
}
fs.writeFileSync(statePath, JSON.stringify({ generated: payload.generated, grid: payload.grid, dayMap }, null, 1));

console.log(`Grid:        ${payload.grid} (modified ${payload.gridModified})`);
console.log(`Zips:        ${records.length} across ${DAY_ORDER.filter(d => byDay.get(d).length).length} days`);
console.log(`Two-day:     ${records.filter(r => r.days.length > 1).map(r => r.zip).join(', ') || 'none'}`);
console.log(`Cities:      ${cities.length} labels, ${ambiguousCount} ambiguous (zip required)`);
console.log(`Techs:       ${[...new Set(records.map(r => r.techFirst))].join(', ')}`);
if (changes) {
  const n = changes.moved.length + changes.added.length + changes.dropped.length;
  if (!n) {
    console.log(`Changes:     none since ${changes.since}`);
  } else {
    console.log(`\nCHANGED since ${changes.since} — ${n} zip(s). Anyone told the old day needs a correction call:`);
    for (const z of changes.moved) {
      const r = records.find(x => x.zip === z);
      console.log(`  ${z} ${r.cities.join(', ')}: ${changes.prev[z]} -> ${dayMap[z]}`);
    }
    if (changes.added.length) console.log(`  added: ${changes.added.join(', ')}`);
    if (changes.dropped.length) console.log(`  dropped from grid: ${changes.dropped.join(', ')}`);
  }
}

console.log(`\nWrote ${htmlOut}`);
console.log(`Wrote ${mdOut}`);
