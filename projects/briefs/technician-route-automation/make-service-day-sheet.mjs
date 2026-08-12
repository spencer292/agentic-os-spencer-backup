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

/**
 * --overlay-week=<monday> : bake a ONE-WEEK exception layer on top of the grid.
 *
 * The grid is the standing territory: which zip runs which day in a normal week. Some weeks are not
 * normal. Week of 2026-08-10, with Cammeron out and Robert covering his territory, 55 of 110
 * serviced zips were routed on a different day than the grid says — while the current week matched
 * the grid on all but a handful of single-stop spills. Rewriting the grid from a week like that
 * would corrupt the standing definition push-week relies on; ignoring it would have the office
 * quoting a day no truck runs. So we read the real routes for that week and show BOTH: the normal
 * day, and the exception for that week only.
 */
const gridFile = String(args.grid || 'territory-grid-v5.json');
/**
 * `--overlay-week=next` resolves to the coming Monday, so the nightly job can pass a fixed flag and
 * the overlay follows the calendar on its own. A hardcoded date would silently stop applying the
 * moment the week rolled over — and an overlay that quietly vanishes is worse than none, because
 * the office would go back to quoting the standing day with no signal anything changed.
 */
let overlayWeek = args['overlay-week'] ? String(args['overlay-week']) : null;
if (overlayWeek === 'next' || overlayWeek === 'auto') {
  const t = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  t.setHours(0, 0, 0, 0);
  const ahead = (8 - t.getDay()) % 7 || 7;          // strictly the NEXT Monday, never today
  t.setDate(t.getDate() + ahead);
  overlayWeek = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
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

/**
 * Zips where we hold active clients but the grid assigns no day.
 *
 * Why this exists: on 2026-08-11 the lookup told a caller we do not service 98444 Parkland. We do —
 * three active clients — the zip had simply never been added to the grid. The page only knows the
 * grid, so a missing zip and an out-of-area zip were indistinguishable and both got a flat "not in
 * our route grid". That is the worst possible answer: it turns a real customer away.
 *
 * Zip codes only, taken from the address-lookup cache. No names, no addresses — the file stays
 * small and carries no personal data. If the cache is absent the list is simply empty and the page
 * behaves as before.
 */
let servedNoDay = [];
const cachePath = path.join(HERE, '.address-lookup-cache.json');
if (fs.existsSync(cachePath)) {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const live = new Set();
    for (const p of cache.properties || []) {
      if (p.client?.isArchived) continue;
      const z = String(p.address?.postalCode || '').trim().slice(0, 5);
      if (/^9[89]\d{3}$/.test(z) && !grid.zips?.[z]) live.add(z);   // WA only; out-of-state is noise
    }
    servedNoDay = [...live].sort();
    if (servedNoDay.length) console.log(`Served, no day: ${servedNoDay.length} zips hold active clients but have no grid entry — ${servedNoDay.join(', ')}`);
  } catch { /* unreadable cache — fall back to an empty list */ }
}

// ---------------------------------------------------------------- one-week overlay

/** zip -> {day, stops, total} for the overlay week, only where it disagrees with the grid. */
let overlay = null;
if (overlayWeek) {
  const env = {};
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
  }
  const K = env.OPTIMOROUTE_API_KEY;
  if (!K) { console.error('--overlay-week needs OPTIMOROUTE_API_KEY'); process.exit(1); }
  const addD = (d, n) => { const [y, m, dd] = d.split('-').map(Number); const x = new Date(y, m - 1, dd + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  // zip = LAST 5-digit group; the first one is the house number.
  const zipOf = a => { const m = String(a).match(/(\d{5})(?!.*\d{5})/); return m ? m[1] : ''; };
  const dates = [0, 1, 2, 3, 4].map(i => addD(overlayWeek, i));
  const counts = new Map();
  for (const d of dates) {
    const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`);
    const j = await r.json().catch(() => ({}));
    if (j?.success === false) { console.error(`overlay get_routes ${d} failed`); process.exit(1); }
    const key = DAY_ORDER[new Date(d + 'T12:00:00').getDay() - 1];
    for (const rt of j.routes || []) for (const s of rt.stops || []) {
      const z = zipOf(s.address); if (!z || !key) continue;
      if (!counts.has(z)) counts.set(z, {});
      const m = counts.get(z); m[key] = (m[key] || 0) + 1;
    }
    await new Promise(x => setTimeout(x, 250));
  }
  const zips = {};
  let planned = 0;
  for (const [z, c] of counts) {
    planned++;
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    const [day, stops] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    const rec = records.find(r => r.zip === z);
    // Only an exception if the grid claims a different day. A zip with no grid entry is a coverage
    // gap, not a week exception — the "not in our route grid" card already handles that.
    if (rec && !rec.days.includes(day)) zips[z] = { day, stops, total };
  }
  overlay = { monday: overlayWeek, friday: dates[4], zips, servicedZips: planned };
  console.log(`Overlay:     week of ${overlayWeek} — ${Object.keys(zips).length} of ${planned} serviced zips differ from the grid`);
}

const payload = {
  grid: path.basename(gridPath),
  gridModified: localDay(gridStat.mtime),
  generated: localDay(generatedAt),
  records,
  cities,
  dayLong: DAY_LONG,
  overlay,
  servedNoDay,
};

// ---------------------------------------------------------------- HTML

const CORE = `<title>Got Moles — What Day Are We In Their Area?</title>
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
  .ex { margin-top:10px; padding:9px 11px; border-radius:8px; background:var(--warnbg);
        border:1px solid var(--warn); font-size:14px; line-height:1.45 }
  .card.hasex { border-left:4px solid var(--warn) }
  .hint { color:var(--mut); font-size:13px; margin-top:14px }
  footer { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); color:var(--mut); font-size:12px }
  kbd { background:var(--card); border:1px solid var(--line); border-radius:4px; padding:1px 5px; font-size:12px }
</style>

<h1>What day are we in their area?</h1>
<div class="sub">Paste the customer's <b>address</b>, or type just the zip or the city.
You'll get the day of the week we run that area.</div>

<input id="q" placeholder="1234 Main St, Bonney Lake, WA 98391" autocomplete="off" autofocus>
<div id="out"></div>
<div class="hint">The zip is what decides the day. If you only have a city, this will tell you whether
that city is safe to answer or whether you need to ask for the zip — ${ambiguousCount} of ${cities.length}
cities we serve are split across more than one route day.</div>

<footer>
  Route days from <b>${payload.grid}</b>, last changed ${payload.gridModified}. Sheet generated ${payload.generated}.<br>
  This only changes when the territory is re-cut — not daily. Ask Spencer for a fresh copy after a re-cut.
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

/** Human date for an overlay week, e.g. "Aug 10-14". */
function weekLabel(o) {
  const a = pd(o.monday), b = pd(o.friday);
  const mo = a.toLocaleDateString(undefined, { month:'short' });
  const mo2 = b.toLocaleDateString(undefined, { month:'short' });
  return mo === mo2 ? \`\${mo} \${a.getDate()}-\${b.getDate()}\` : \`\${mo} \${a.getDate()} - \${mo2} \${b.getDate()}\`;
}
function pd(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }

function renderZip(r) {
  const ex = DATA.overlay && DATA.overlay.zips[r.zip];
  const wkStart = DATA.overlay ? pd(DATA.overlay.monday) : null;
  const wkEnd = DATA.overlay ? pd(DATA.overlay.friday) : null;
  const inWeek = d => wkStart && d >= wkStart && d <= wkEnd;

  // Dates for the standing pattern. When an exception week applies, drop any date inside it —
  // showing "Tue Aug 11" beside "that week we run Thursday" is a contradiction on the same card.
  const dates = r.days.flatMap(d => nextDates(d, 3))
    .sort((a,b) => a - b).filter(d => !(ex && inWeek(d))).slice(0, 3).map(fmt).join(' &middot; ');

  let exBlock = '';
  if (ex) {
    // The concrete date of the exception day in that week, so nobody has to work it out.
    const idx = { mon:0, tue:1, wed:2, thu:3, fri:4 }[ex.day];
    const exDate = new Date(wkStart); exDate.setDate(wkStart.getDate() + idx);
    exBlock = \`<div class="ex"><b>Week of \${weekLabel(DATA.overlay)}: \${DATA.dayLong[ex.day]} (\${fmt(exDate)})</b><br>
      That week only — the routes were re-cut. Normally \${daysPhrase(r.days)}.</div>\`;
  }
  return \`<div class="card\${ex ? ' hasex' : ''}">
    <div class="day">\${daysPhrase(r.days)}</div>
    <div class="where">\${r.zip} — \${r.cities.join(', ')}</div>
    \${exBlock}
    <div class="dates">\${ex ? 'Other weeks' : 'Next route dates'}: <b>\${dates}</b></div>
    <div class="meta">Say the day, not a date or a technician — which tech runs a zip changes week to week.</div>
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

/**
 * The zip decides the day, so pull one out of whatever was typed before anything else. Someone
 * reading an address off a call types the whole line — "1234 Main St, Bonney Lake, WA 98391" —
 * and the zip is the last 5-digit group, not the first (that's the house number).
 */
function search(raw) {
  const out = document.getElementById('out');
  const s = raw.trim();
  if (!s) { out.innerHTML = ''; return; }

  const zipInText = (s.match(/(\\d{5})(?!.*\\d{5})/) || [])[1];
  if (zipInText) {
    const exact = DATA.records.find(r => r.zip === zipInText);
    if (exact) { out.innerHTML = renderZip(exact); return; }
    // We already have customers here — never tell the caller we don't serve them.
    if (DATA.servedNoDay.includes(zipInText)) {
      out.innerHTML = \`<div class="card warn">
        <div class="day">We have customers here</div>
        <div class="where">\${zipInText} — but no route day is assigned to it yet.</div>
        <div class="meta"><b>Do not tell them we don't cover it.</b> Say: "We do work in your area —
        let me confirm the day and call you right back today." Take the address and phone, then send
        the zip to Spencer so it gets a day.</div>
      </div>\`;
      return;
    }
    out.innerHTML = \`<div class="card warn">
      <div class="day">Not in our route grid</div>
      <div class="where">\${zipInText} isn't on any current route.</div>
      <div class="meta">Take the full address and phone, tell them you'll confirm coverage and call back today. Do not say yes or no. Flag it to Spencer.</div>
    </div>\`;
    return;
  }

  // Partial zip — still typing. Show the candidates rather than flashing "no match".
  if (/^\\d+$/.test(s)) {
    if (s.length < 3) { out.innerHTML = ''; return; }
    const partial = DATA.records.filter(r => r.zip.startsWith(s));
    out.innerHTML = partial.length
      ? partial.slice(0, 12).map(renderZip).join('')
      : \`<div class="card warn"><div class="day">Keep typing</div>
          <div class="where">No zip starts with \${s}. Ours all begin 98 or 99.</div></div>\`;
    return;
  }

  // No zip anywhere — fall back to city. Match any word in what was typed, so a pasted
  // address without a zip ("1234 Main St, Bonney Lake, WA") still finds the city.
  const q = s.toLowerCase();
  const matched = DATA.cities.filter(c => {
    const label = c.label.toLowerCase();
    return q.includes(label) || label.startsWith(q);
  });
  // The grid carries several spellings of the same place ("Bonney Lake/BonneyLake/bonney"), which
  // would otherwise show as two or three identical cards. Same zips = same place; keep the
  // best-spelled label.
  const bySig = new Map();
  for (const c of matched) {
    const sig = c.zips.join(',');
    const prev = bySig.get(sig);
    if (!prev || c.label.length > prev.label.length) bySig.set(sig, c);
  }
  const hits = [...bySig.values()];
  out.innerHTML = hits.length
    ? hits.slice(0, 6).map(renderCity).join('')
    : \`<div class="card warn"><div class="day">No match</div>
        <div class="where">Nothing matching "\${raw}".</div>
        <div class="meta">Ask the caller for their zip code — that's what decides the day.</div></div>\`;
}

const box = document.getElementById('q');
box.addEventListener('input', e => search(e.target.value));
</script>
`;

// Standalone gets its own doctype/meta; the hosted copy omits them because the host supplies the
// document skeleton. Same body either way, so the two can never show different route days.
const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${CORE}`;
const artifactHtml = CORE;

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
const artifactOut = path.join(outDir, 'service-day-lookup.artifact.html');
fs.writeFileSync(htmlOut, html);
fs.writeFileSync(mdOut, mdLines.join('\n'));
fs.writeFileSync(artifactOut, artifactHtml);
// The portable bundle is what actually reaches whoever is on the phone — keep it in step.
const portable = path.join(ROOT, 'projects/briefs/callrail-faq/muhammad-portable');
if (fs.existsSync(portable)) fs.writeFileSync(path.join(portable, 'service-day-lookup.html'), html);

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
