#!/usr/bin/env node
/**
 * build-address-day-lookup.mjs — office-facing "type an address, get the day" lookup.
 *
 * Supersedes make-service-day-sheet.mjs for phone work. That sheet answers "what day are we in
 * this ZIP?"; it cannot answer "when are YOU next coming?", which is the call the office currently
 * handles worst (see projects/briefs/callrail-faq/2026-08-03_service-day-scripts.md, call #4).
 *
 * Three sources, joined on the property:
 *   Jobber properties  — every address we have on file (~4.4k)
 *   Jobber visits      — the real scheduled dates for the next N days
 *   OptimoRoute routes — whether that visit is actually on a planned route, and at what time
 *   territory grid     — the route day for the zip, for addresses with nothing scheduled
 *
 * Output is ONE self-contained HTML file. No server, no API keys on the machine that uses it,
 * works offline — same distribution as the zip sheet, because that is what the office can run.
 * The trade-off is that it is a snapshot: the footer carries the build time and the cron
 * (cron/jobs/service-day-sheet-refresh.md) rebuilds it every morning before the phones open.
 *
 * READ-ONLY. Nothing here writes to Jobber or OptimoRoute.
 *
 * Usage:
 *   node build-address-day-lookup.mjs [--grid=territory-grid-v5.json] [--days=90] [--out=<dir>]
 *   node build-address-day-lookup.mjs --cache            # reuse last raw pull, re-render only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const ENV_PATH = path.join(ROOT, '.env');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));

const gridFile = String(args.grid || 'territory-grid-v5.json');
const gridPath = path.isAbsolute(gridFile) ? gridFile : path.join(HERE, gridFile);
const horizonDays = Number(args.days || 90);
const outDir = path.resolve(String(args.out || path.join(ROOT, 'projects/briefs/callrail-faq/service-day-lookup')));
const cachePath = path.join(HERE, '.address-lookup-cache.json');

if (!fs.existsSync(gridPath)) { console.error(`Grid not found: ${gridPath}`); process.exit(1); }

const loadEnv = () => {
  const env = {};
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
  }
  return env;
};
const saveEnvKey = (key, value) => {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  fs.writeFileSync(ENV_PATH, re.test(txt) ? txt.replace(re, `${key}=${value}`) : `${txt}\n${key}=${value}\n`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- Jobber

let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) { console.error('Jobber token refresh failed', r.status, JSON.stringify(d).slice(0, 300)); process.exit(1); }
  // Jobber rotates the refresh token; losing the new one breaks every script in this folder.
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token;
  return tok;
}
async function jgql(query, variables, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await token(true); return jgql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return jgql(query, variables, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}

/** PT calendar date/time. Everything the office says is Pacific; UTC slicing shifts evening visits a day. */
const ptParts = iso => {
  const s = new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
  return { date: s.slice(0, 10), hm: s.slice(11, 16) };
};
const numericId = gid => { try { return Buffer.from(gid, 'base64').toString('utf8').split('/').pop(); } catch { return ''; } };
const addDays = (d, n) => { const [y, m, dd] = d.split('-').map(Number); const x = new Date(y, m - 1, dd + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

const today = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10);
const horizonEnd = addDays(today, horizonDays);

async function pullProperties() {
  const out = [];
  let cursor = null;
  for (;;) {
    const d = await jgql(`query($after:String){ properties(first:100, after:$after){ nodes{ id address{ street city province postalCode } client{ id name isArchived } } pageInfo{ hasNextPage endCursor } } }`, { after: cursor });
    out.push(...d.properties.nodes);
    process.stdout.write(`\r  properties: ${out.length}`);
    if (!d.properties.pageInfo.hasNextPage) break;
    cursor = d.properties.pageInfo.endCursor;
    await sleep(400);
  }
  process.stdout.write('\n');
  return out;
}

async function pullVisits() {
  const out = [];
  let cursor = null;
  const filter = `filter:{ startAt:{ after:"${today}T00:00:00-07:00", before:"${horizonEnd}T23:59:59-07:00" } }`;
  for (;;) {
    const d = await jgql(`query($after:String){ visits(first:50, after:$after, ${filter}){ nodes{ id title startAt endAt isComplete property{ id } job{ jobNumber jobStatus } assignedUsers(first:3){ nodes{ name{ full } } } } pageInfo{ hasNextPage endCursor } } }`, { after: cursor });
    out.push(...d.visits.nodes);
    process.stdout.write(`\r  visits: ${out.length}`);
    if (!d.visits.pageInfo.hasNextPage) break;
    cursor = d.visits.pageInfo.endCursor;
    await sleep(600);
  }
  process.stdout.write('\n');
  return out;
}

// ---------------------------------------------------------------- OptimoRoute

/**
 * Planned routes for the next `n` weekdays. This is the cross-check that matters: a visit can sit
 * in Jobber for a date and never have been pushed to OptimoRoute, in which case no truck is going.
 * Weeks past the planning horizon simply return nothing — absence is "not planned yet", not "wrong".
 */
async function pullRoutes(n = 21) {
  const env = loadEnv();
  const K = env.OPTIMOROUTE_API_KEY;
  if (!K) { console.warn('  OPTIMOROUTE_API_KEY missing — skipping route cross-check'); return { byOrder: {}, dates: [] }; }
  const byOrder = {}, dates = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(today, i);
    const dow = new Date(date + 'T12:00:00').getDay();
    if (dow === 0 || dow === 6) continue;           // Got Moles is Mon-Fri; a weekend route is a defect, not data
    let j;
    try {
      const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`);
      j = await r.json();
    } catch (e) { console.warn(`  OptimoRoute ${date}: ${e.message}`); continue; }
    if (!j?.success) continue;
    let stops = 0;
    for (const route of j.routes || []) {
      for (const s of route.stops || []) {
        if (!s.orderNo) continue;
        byOrder[s.orderNo] = { date, driver: route.driverName || '', at: s.scheduledAt || '' };
        stops++;
      }
    }
    if (stops) dates.push(date);
    process.stdout.write(`\r  optimoroute: ${dates.length} planned days, ${Object.keys(byOrder).length} stops`);
    await sleep(250);
  }
  process.stdout.write('\n');
  return { byOrder, dates };
}

// ---------------------------------------------------------------- gather

let raw;
if (args.cache && fs.existsSync(cachePath)) {
  raw = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log(`Cache: ${raw.properties.length} properties, ${raw.visits.length} visits (pulled ${raw.pulledAt})`);
} else {
  console.log(`Pulling live (${today} .. ${horizonEnd})`);
  const properties = await pullProperties();
  const visits = await pullVisits();
  const routes = await pullRoutes();
  raw = { pulledAt: new Date().toISOString(), properties, visits, routes };
  fs.writeFileSync(cachePath, JSON.stringify(raw));
}

const grid = JSON.parse(fs.readFileSync(gridPath, 'utf8'));
const gridStat = fs.statSync(gridPath);

// ---------------------------------------------------------------- normalise

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LONG = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };
const DOW_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Address canonicaliser. Jobber stores "15706 Southeast 376th Street"; a caller says
 * "15706 SE 376th St". Both sides collapse to "15706 se 376 st" so a token-AND match works.
 * Ordinal suffixes go too — nobody agrees on whether it is 376th or 376.
 */
const ABBR = {
  north: 'n', south: 's', east: 'e', west: 'w',
  northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw',
  street: 'st', avenue: 'ave', av: 'ave', road: 'rd', drive: 'dr', lane: 'ln',
  court: 'ct', place: 'pl', boulevard: 'blvd', circle: 'cir', terrace: 'ter',
  parkway: 'pkwy', highway: 'hwy', trail: 'trl', loop: 'loop', way: 'way',
  apartment: 'apt', suite: 'ste', unit: 'unit',
};
function canon(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(t => {
      const o = t.match(/^(\d+)(st|nd|rd|th)$/);   // 376th -> 376
      if (o) return o[1];
      return ABBR[t] || t;
    })
    .join(' ');
}

// property id -> visits, soonest first
const visitsByProp = new Map();
for (const v of raw.visits) {
  const pid = v.property?.id;
  if (!pid) continue;
  if (!visitsByProp.has(pid)) visitsByProp.set(pid, []);
  visitsByProp.get(pid).push(v);
}

const orderRoute = raw.routes?.byOrder || {};
const plannedDates = new Set(raw.routes?.dates || []);

/**
 * Visit -> compact record. routed: 1 on a planned route, 0 planned day but absent, -1 beyond horizon.
 *
 * `ord` is the date OptimoRoute has actually planned the stop for, which is not always the date
 * Jobber holds. When they disagree, OptimoRoute is the day a truck is going — that is the answer
 * the office needs (Spencer 2026-08-03). Two live examples on the day this was written: #7962 and
 * #7662 both read "Aug 17" in Jobber while Cammeron was routed to them that morning.
 */
function visitRecord(v) {
  const { date, hm } = ptParts(v.startAt);
  const jn = v.job?.jobNumber ? String(v.job.jobNumber) : '';
  const or = orderRoute[`${jn}-${numericId(v.id)}`];
  const routed = or ? 1 : (plannedDates.has(date) ? 0 : -1);
  return {
    d: date,
    hm: hm === '00:00' ? '' : hm,                  // 00:00 = all-day/unpinned, not a 12am promise
    t: (v.assignedUsers?.nodes || []).map(u => u.name.full).join(' + '),
    jn,
    c: v.isComplete ? 1 : 0,
    routed,
    ord: or?.date || '',
    ort: or?.at || '',
    ordrv: or?.driver || '',
  };
}

/**
 * Collapse duplicate property records before anything else.
 *
 * Jobber holds several records for the same physical address — the CallRail integration
 * double-writes, and "2747 NE 90th St" and "2747 Northeast 90th Street" are two rows. Left alone
 * the office gets two cards for one caller, one saying Tuesday and one saying nothing scheduled,
 * with no way to tell which is real. Grouping on the canonical street + zip merges the visits so
 * the answer is single. The duplicate count still shows on the internal line — the office should
 * not fix it, but Spencer should see it.
 */
const groups = new Map();
for (const p of raw.properties) {
  const a = p.address || {};
  const zip = String(a.postalCode || '').trim().slice(0, 5);
  const street = String(a.street || '').trim();
  if (!street && !zip) continue;                    // CallRail stubs: "Wireless Caller", city only
  const key = canon(street) + '|' + zip;
  if (!groups.has(key)) groups.set(key, { street, city: String(a.city || '').trim(), zip, names: [], allArchived: true, visits: [], recs: 0 });
  const g = groups.get(key);
  g.recs++;
  if (p.client?.name) g.names.push(p.client.name);
  if (!p.client?.isArchived) g.allArchived = false;
  // Longest street spelling wins — "2747 Northeast 90th Street" reads back to a caller better than the abbreviation.
  if (street.length > g.street.length) g.street = street;
  g.visits.push(...(visitsByProp.get(p.id) || []));
}

const props = [];
for (const g of groups.values()) {
  const { street, city, zip } = g;

  const vs = g.visits
    .map(visitRecord)
    .sort((x, y) => (x.d + x.hm).localeCompare(y.d + y.hm));
  const next = vs.find(v => !v.c && v.d >= today) || null;
  const name = g.names.sort((a, b) => b.length - a.length)[0] || '';

  const zg = grid.zips?.[zip];
  const gridDays = zg ? (zg.days || [zg.day]).filter(Boolean).map(s => String(s).toLowerCase()).sort((x, y) => DAY_ORDER.indexOf(x) - DAY_ORDER.indexOf(y)) : [];
  // A job-level override beats the zip rule (grid.jobOverrides is keyed by Jobber job number).
  const ov = next?.jn ? grid.jobOverrides?.[next.jn] : null;
  const ovDays = ov ? (ov.days || [ov.day]).filter(Boolean).map(s => String(s).toLowerCase()) : [];

  props.push({
    n: name,
    s: street,
    ci: city,
    z: zip,
    ar: g.allArchived ? 1 : 0,
    dup: g.recs > 1 ? g.recs : 0,
    g: (ovDays.length ? ovDays : gridDays).join('+'),
    gt: (ov?.tech || zg?.tech || '').split(' ')[0],
    ov: ov ? 1 : 0,
    v: next,
    later: vs.filter(v => !v.c && v.d >= today).slice(1, 4).map(v => v.d),
    k: canon(`${street} ${city} ${zip} ${g.names.join(' ')}`),
  });
}
props.sort((a, b) => a.k.localeCompare(b.k));

// zip fallback table (new customers / addresses not on file) — same data as the zip sheet
const zipRows = Object.entries(grid.zips || {}).map(([zip, v]) => {
  const days = (v.days || [v.day]).filter(Boolean).map(s => String(s).toLowerCase())
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const seen = new Map();
  for (const c of String(v.cities || '').split('/').map(s => s.trim()).filter(Boolean)) {
    if (!seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  return { zip, days, cities: [...seen.values()], tech: String(v.tech || '').split(' ')[0] };
}).sort((a, b) => a.zip.localeCompare(b.zip));

const cityIndex = new Map();
for (const r of zipRows) for (const c of r.cities) {
  const k = c.toLowerCase();
  if (!cityIndex.has(k)) cityIndex.set(k, { label: c, zips: [] });
  cityIndex.get(k).zips.push(r.zip);
}
const cities = [...cityIndex.values()].map(({ label, zips }) => {
  const rows = zips.map(z => zipRows.find(r => r.zip === z));
  const sigs = new Set(rows.map(r => r.days.join('+')));
  return { label, zips, ambiguous: sigs.size > 1, days: sigs.size === 1 ? rows[0].days : [] };
}).sort((a, b) => a.label.localeCompare(b.label));

const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 16);
const payload = {
  props, zipRows, cities,
  dayLong: DAY_LONG,
  today,
  built: stamp,
  grid: path.basename(gridPath),
  gridModified: new Date(gridStat.mtime).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10),
  plannedThrough: [...plannedDates].sort().pop() || '',
  horizonEnd,
};

// ---------------------------------------------------------------- HTML

/**
 * Palettes as token sets so light and dark can be declared once and replayed into all four
 * selectors the hosted page needs: the media query carries the OS preference, and the viewer's
 * theme toggle stamps data-theme on the root, which has to beat the media query in BOTH directions.
 * Neutrals are pulled slightly green rather than left as pure grey, so they sit with the accent.
 */
const LIGHT = `--bg:#FBFAF7; --surface:#F3F1EA; --line:#E2DFD4; --fg:#181B17; --mut:#6B7268;
  --accent:#1F6F43; --warn:#B4670C; --warnbg:#FDF6E7; --bad:#A32B21; --badbg:#FBEDEB; --chip:#EAE7DC;`;
const DARK = `--bg:#111310; --surface:#191C18; --line:#2A2E28; --fg:#E9ECE6; --mut:#9AA396;
  --accent:#5FD08A; --warn:#E9A94B; --warnbg:#2A1F0E; --bad:#F08A80; --badbg:#2C1512; --chip:#232720;`;

const CORE = `<title>Got Moles — Address Day Lookup</title>
<style>
  :root { ${LIGHT} }
  @media (prefers-color-scheme: dark) { :root { ${DARK} } }
  :root[data-theme="dark"] { ${DARK} }
  :root[data-theme="light"] { ${LIGHT} }
  * { box-sizing:border-box }
  body { margin:0; padding:20px 20px 40px; max-width:760px; margin-inline:auto; background:var(--bg); color:var(--fg);
         font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  h1 { font-size:18px; margin:0 0 2px; text-wrap:balance }
  .sub { color:var(--mut); font-size:13px; margin-bottom:14px; max-width:62ch }
  #q { width:100%; padding:14px 16px; font-size:21px; border:2px solid var(--line); border-radius:10px;
       background:var(--surface); color:var(--fg); }
  #q:focus-visible { outline:2px solid var(--accent); outline-offset:2px; border-color:var(--accent) }
  /* Cards carry a left severity stripe so urgency reads before any word does. */
  .card { border:1px solid var(--line); border-left:4px solid var(--accent); border-radius:10px;
          padding:15px 16px; margin-top:12px; background:var(--surface) }
  .day { font-size:29px; font-weight:700; color:var(--accent); line-height:1.15; text-wrap:balance }
  .day.sm { font-size:20px }
  .who { font-size:16px; font-weight:600; margin-top:4px }
  .where { font-size:14px; color:var(--mut) }
  .row { margin-top:9px; font-size:14px }
  .meta { margin-top:10px; padding-top:9px; border-top:1px solid var(--line); font-size:13px; color:var(--mut) }
  .warn { background:var(--warnbg); border-color:var(--warn); border-left-color:var(--warn) } .warn .day { color:var(--warn) }
  .bad  { background:var(--badbg);  border-color:var(--bad);  border-left-color:var(--bad)  } .bad  .day { color:var(--bad) }
  .flag { display:block; margin-top:9px; padding:8px 10px; border-radius:7px; background:var(--warnbg);
          border:1px solid var(--warn); font-size:13px; color:var(--fg) }
  .flag.stop { background:var(--badbg); border-color:var(--bad) }
  .flag.ok { background:transparent; border-color:var(--accent); color:var(--mut) }
  .chip { display:inline-block; padding:1px 8px; border-radius:20px; background:var(--chip); font-size:12px;
          color:var(--mut); margin-left:6px; vertical-align:2px }
  ul.zips { list-style:none; padding:0; margin:10px 0 0 }
  ul.zips li { padding:7px 0; border-top:1px solid var(--line); display:flex; gap:10px; align-items:baseline; font-size:14px }
  ul.zips li b { min-width:52px; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-variant-numeric:tabular-nums }
  .more { color:var(--mut); font-size:13px; margin-top:10px }
  .hint { color:var(--mut); font-size:13px; margin-top:14px; max-width:62ch }
  footer { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); color:var(--mut); font-size:12px }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important } }
</style>

<h1>Address Day Lookup</h1>
<div class="sub">Type the <b>street address</b> — house number is enough to start. On file already? You get their
real next visit date. Not on file? You get the route day for the zip.</div>

<input id="q" placeholder="15706 SE 376th  ·  or a zip  ·  or a name" autocomplete="off" autofocus>
<div id="out"></div>
<div class="hint">Read the address back to the caller before you quote anything. Never promise a technician by name.</div>

<footer>
  Built <b>${payload.built}</b> from live Jobber + OptimoRoute, route days from <b>${payload.grid}</b>
  (grid last changed ${payload.gridModified}).<br>
  ${payload.props.length} addresses on file &middot; scheduled visits read through ${payload.horizonEnd}
  &middot; routes planned through ${payload.plannedThrough || 'n/a'}.<br>
  This is a snapshot. It is rebuilt every morning — if the date above is not today's, get a fresh copy before quoting.
</footer>

<script>
const D = ${JSON.stringify(payload)};
const DAY_IDX = { mon:1, tue:2, wed:3, thu:4, fri:5 };
const DOW = ['sun','mon','tue','wed','thu','fri','sat'];

const ABBR = ${JSON.stringify(ABBR)};
function canon(s) {
  return String(s||'').toLowerCase().replace(/[.,#]/g,' ').replace(/[^a-z0-9\\s-]/g,' ')
    .split(/\\s+/).filter(Boolean)
    .map(t => { const o = t.match(/^(\\d+)(st|nd|rd|th)$/); return o ? o[1] : (ABBR[t] || t); })
    .join(' ');
}
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** Local-date parse. new Date("2026-08-11") is UTC midnight and renders as the 10th west of Greenwich. */
function pd(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
const longDate = s => pd(s).toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
const shortDate = s => pd(s).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
function relDays(s) {
  const a = pd(D.today), b = pd(s);
  const n = Math.round((b - a) / 86400000);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n < 0) return Math.abs(n) + ' days ago';
  return 'in ' + n + ' days';
}
function nextDates(dayKey, n = 2) {
  const out = [], t = pd(D.today), target = DAY_IDX[dayKey];
  for (let i = 1; out.length < n; i++) {
    const d = new Date(t); d.setDate(t.getDate() + i);
    if (d.getDay() === target) out.push(d);
  }
  return out;
}
const fmtD = d => d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
function daysPhrase(days) {
  const l = days.map(d => D.dayLong[d]);
  return l.length === 1 ? l[0] + 's' : l.map(s => s + 's').join(' and ');
}

// ------------------------------------------------------------ cards

function propCard(p) {
  const addr = esc([p.s, p.ci, p.z].filter(Boolean).join(', '));
  const gridDays = p.g ? p.g.split('+') : [];
  const flags = [];
  let head, cls = '';

  if (p.v) {
    // The day a truck is actually routed beats the day Jobber holds. Only OptimoRoute knows the first.
    const day = p.v.ord || p.v.d;
    const disagrees = p.v.ord && p.v.ord !== p.v.d;
    const wk = DOW[pd(day).getDay()];

    head = '<div class="day">' + esc(longDate(day)) + '</div>' +
           '<div class="row" style="color:var(--mut)">' + esc(relDays(day)) +
           (p.v.ort ? ' &middot; around ' + esc(p.v.ort)
                    : (p.v.hm ? ' &middot; window starts ' + esc(p.v.hm) : '')) + '</div>';

    if (disagrees) {
      flags.push(['stop', '<b>The two systems disagree.</b> Jobber has this booked for ' +
        esc(shortDate(p.v.d)) + ', but the truck is routed for <b>' + esc(shortDate(p.v.ord)) +
        '</b>. Give the routed date above — that is the day someone is actually coming — then tell Spencer, because the customer was notified off the Jobber date.']);
    } else if (p.v.routed === 1) {
      flags.push(['ok', 'Confirmed on the planned route' + (p.v.ordrv ? '' : '') + '.']);
    } else if (p.v.routed === 0) {
      flags.push(['stop', '<b>Not on the planned route for ' + esc(shortDate(p.v.d)) + '.</b> That day is already planned and this visit is not on it — do not confirm the date. Flag it to Spencer.']);
    } else {
      flags.push(['ok', 'Booked in Jobber. Routes for that week are not planned yet, so nobody is assigned to it on the map — that is normal this far out.']);
    }

    if (gridDays.length && !gridDays.includes(wk)) {
      flags.push(['warn', 'This one falls on a ' + esc(D.dayLong[wk] || wk) + ', but the zip normally runs ' + esc(daysPhrase(gridDays)) + '. Give the date above — it is what is scheduled — and flag the mismatch to Spencer.']);
    }
  } else {
    cls = ' warn';
    head = '<div class="day sm">No visit currently scheduled</div>' +
           '<div class="row">Nothing on the books for this address' +
           (D.horizonEnd ? ' through ' + esc(shortDate(D.horizonEnd)) : '') + '.</div>';
    if (gridDays.length) {
      const dates = gridDays.flatMap(d => nextDates(d, 2)).sort((a,b)=>a-b).slice(0,2).map(fmtD).join(' · ');
      flags.push(['warn', 'We run this zip on <b>' + esc(daysPhrase(gridDays)) + '</b> — next ones are ' + esc(dates) + '. Book on that day.']);
    } else {
      flags.push(['stop', 'This zip is not in the current route grid. Do not say yes or no — take the address and phone, say you will confirm coverage and call back today, then flag it to Spencer.']);
    }
  }

  if (p.ar) flags.push(['warn', 'This client is <b>archived</b> in Jobber — they are a former customer, not an active one. Treat it as a new sale, not a service call.']);

  const later = (p.later || []).length
    ? '<div class="more">Then: ' + p.later.map(d => esc(shortDate(d))).join(' &middot; ') + '</div>' : '';

  const internal = [];
  if (p.v && p.v.jn) internal.push('job #' + esc(p.v.jn));
  // Jobber's assigned user goes stale (visits still sit on techs who left the field); the driver
  // OptimoRoute routed it to is who is actually going. Show both when they differ.
  if (p.v && p.v.ordrv) {
    internal.push('routed to ' + esc(p.v.ordrv) +
      (p.v.t && p.v.t !== p.v.ordrv ? ' (Jobber says ' + esc(p.v.t) + ')' : ''));
  } else if (p.v && p.v.t) internal.push('tech ' + esc(p.v.t));
  else if (p.gt) internal.push('area tech ' + esc(p.gt));
  if (p.ov) internal.push('job-level override');
  if (gridDays.length) internal.push('zip day ' + gridDays.map(d => D.dayLong[d]).join('/'));
  if (p.dup) internal.push(p.dup + ' duplicate property records merged');

  return '<div class="card' + cls + '">' + head +
    '<div class="who">' + esc(p.n || '(no name on file)') + '</div>' +
    '<div class="where">' + addr + '</div>' + later +
    flags.map(([k, t]) => '<span class="flag' + (k === 'warn' ? '' : ' ' + k) + '">' + t + '</span>').join('') +
    '<div class="meta">Internal only — ' + (internal.join(' &middot; ') || 'no job on file') + '. Never promise a technician by name.</div>' +
  '</div>';
}

function zipCard(r) {
  const dates = r.days.flatMap(d => nextDates(d, 2)).sort((a,b)=>a-b).slice(0,3).map(fmtD).join(' · ');
  return '<div class="card"><div class="day">' + esc(daysPhrase(r.days)) + '</div>' +
    '<div class="where">' + esc(r.zip) + ' — ' + esc(r.cities.join(', ')) + '</div>' +
    '<div class="row">Next route dates: <b>' + esc(dates) + '</b></div>' +
    '<span class="flag">This is the <b>area day</b> — what you tell a caller who is not already on our books at that address. For an existing customer, type their house number to get their own date.</span>' +
    '<div class="meta">Internal only — area tech ' + esc(r.tech || 'unassigned') + '. Never promise a technician by name.</div></div>';
}

function cityCard(c) {
  if (!c.ambiguous) {
    const r = D.zipRows.find(x => x.zip === c.zips[0]);
    return zipCard({ ...r, zip: c.label, cities: [c.zips.length > 1 ? 'all ' + c.zips.length + ' zips on the same day' : c.zips[0]] });
  }
  const rows = c.zips.map(z => D.zipRows.find(x => x.zip === z)).sort((a,b) => a.zip.localeCompare(b.zip))
    .map(r => '<li><b>' + esc(r.zip) + '</b> <span>' + esc(daysPhrase(r.days)) + '</span></li>').join('');
  return '<div class="card warn"><div class="day">Ask for the zip code</div>' +
    '<div class="where">' + esc(c.label) + ' covers ' + c.zips.length + ' zips on different route days.</div>' +
    '<ul class="zips">' + rows + '</ul>' +
    '<div class="meta">Say: "Let me grab your zip so I give you the right day."</div></div>';
}

const noMatch = (raw, body) => '<div class="card bad"><div class="day sm">No match</div>' +
  '<div class="row">Nothing on file for "' + esc(raw) + '". ' + body + '</div></div>';

// ------------------------------------------------------------ search

function score(p, toks, houseNo) {
  let s = 0;
  for (const t of toks) { if (!p.k.includes(t)) return -1; }
  if (houseNo && p.k.startsWith(houseNo + ' ')) s += 100;   // house number leading = almost certainly them
  s += Math.max(0, 40 - p.s.length / 4);                    // shorter address = tighter match
  if (p.v) s += 5;
  if (p.ar) s -= 20;
  return s;
}

/**
 * Query router. Order matters more than the matching does.
 *
 * A bare zip or a bare city name is an AREA question ("do you cover 98374, and when are you out
 * there?"), and it must not be answered with whichever existing customer happens to live there —
 * that reads as an answer about the caller and it is not. Addresses only win once the query looks
 * like one. Bare digits are ambiguous between a zip and a house number, so the grid decides: if the
 * digits could start one of our zips it is a zip, otherwise it is a house number.
 */
function search(rawq) {
  const out = document.getElementById('out');
  const raw = rawq.trim();
  if (raw.length < 3) { out.innerHTML = ''; return; }

  const lower = raw.toLowerCase();
  const digitsOnly = /^\\d{3,5}$/.test(raw);
  const looksLikeZip = digitsOnly && D.zipRows.some(r => r.zip.startsWith(raw));

  // --- area question: bare zip
  if (looksLikeZip) {
    const exact = D.zipRows.find(r => r.zip === raw);
    if (exact) { out.innerHTML = zipCard(exact) + onFileNote(p => p.z === raw); return; }
    out.innerHTML = D.zipRows.filter(r => r.zip.startsWith(raw)).slice(0, 12).map(zipCard).join('');
    return;
  }
  if (digitsOnly && raw.length === 5) {
    out.innerHTML = '<div class="card bad"><div class="day sm">Not in our route grid</div>' +
      '<div class="row">' + esc(raw) + ' is not on any current route.</div>' +
      '<span class="flag stop">Take the full address and phone, tell them you will confirm coverage and call back today. Do not say yes or no. Flag it to Spencer.</span></div>';
    return;
  }

  // --- area question: bare city name (no digits, matches a city we serve)
  if (!/\\d/.test(raw)) {
    const cityHits = D.cities.filter(c => c.label.toLowerCase().startsWith(lower));
    if (cityHits.length) {
      out.innerHTML = cityHits.slice(0, 6).map(cityCard).join('') +
        '<div class="more">Looking up a specific customer? Type their house number and street instead.</div>';
      return;
    }
  }

  // --- address (or name) question
  const toks = canon(raw).split(' ').filter(Boolean);
  const houseNo = /^\\d+$/.test(toks[0]) && toks[0].length <= 6 ? toks[0] : '';
  const hits = D.props.map(p => ({ p, s: score(p, toks, houseNo) }))
    .filter(x => x.s >= 0).sort((a, b) => b.s - a.s);

  if (hits.length) {
    out.innerHTML = hits.slice(0, 6).map(x => propCard(x.p)).join('') +
      (hits.length > 6 ? '<div class="more">' + (hits.length - 6) + ' more match — add the street name or zip to narrow it.</div>' : '');
    return;
  }

  // --- nothing on file: answer from the grid, which is the new-customer answer
  const zipInQuery = (raw.match(/\\b\\d{5}\\b/) || [])[0];
  if (zipInQuery) {
    const r = D.zipRows.find(x => x.zip === zipInQuery);
    if (r) { out.innerHTML = noMatch(raw, 'No address on file matches that — treat as a new customer:') + zipCard(r); return; }
    out.innerHTML = noMatch(raw, 'And ' + esc(zipInQuery) + ' is not in the route grid — take the address and phone, say you will confirm coverage and call back today.');
    return;
  }
  const loose = D.cities.filter(c => c.label.toLowerCase().includes(lower));
  if (loose.length) { out.innerHTML = loose.slice(0, 6).map(cityCard).join(''); return; }

  out.innerHTML = noMatch(raw, 'Try just the house number and street, or the zip code.');
}

/** How many addresses we already have in a zip — tells the office whether "we already serve you" is likely. */
function onFileNote(pred) {
  const n = D.props.filter(pred).length;
  if (!n) return '<div class="more">No addresses on file in this zip yet.</div>';
  return '<div class="more">' + n + ' address' + (n === 1 ? '' : 'es') +
    ' on file here. If the caller is an existing customer, type their house number to get their own date.</div>';
}

document.getElementById('q').addEventListener('input', e => search(e.target.value));
</script>
`;

/**
 * Two shapes, one body.
 *   html         — standalone file, double-clicked from disk. Needs its own doctype and meta.
 *   artifactHtml — for the hosted page, which supplies the doctype/head/body skeleton itself.
 *                  Emitting our own would nest a second document inside theirs.
 */
const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${CORE}`;
const artifactHtml = CORE;

// ---------------------------------------------------------------- write

fs.mkdirSync(outDir, { recursive: true });
const htmlOut = path.join(outDir, 'address-day-lookup.html');
fs.writeFileSync(htmlOut, html);
// Source for the hosted copy. Publishing reads this file; keeping it beside the standalone one
// means the two can never drift to different data.
const artifactOut = path.join(outDir, 'address-day-lookup.artifact.html');
fs.writeFileSync(artifactOut, artifactHtml);

// The office copy is the one people actually open — keep the portable bundle in step automatically,
// because a bundle carrying last week's dates is worse than no bundle at all.
const portable = path.join(ROOT, 'projects/briefs/callrail-faq/muhammad-portable');
let portableOut = '';
if (fs.existsSync(portable)) {
  portableOut = path.join(portable, 'address-day-lookup.html');
  fs.writeFileSync(portableOut, html);
}

const withVisit = props.filter(p => p.v).length;
const offGrid = props.filter(p => p.v && p.g && !p.g.split('+').includes(DOW_KEY[new Date(p.v.d + 'T12:00:00').getDay()])).length;
const unrouted = props.filter(p => p.v && p.v.routed === 0).length;
const clash = props.filter(p => p.v && p.v.ord && p.v.ord !== p.v.d);
const techClash = props.filter(p => p.v && p.v.ordrv && p.v.t && p.v.ordrv !== p.v.t).length;
const noGrid = props.filter(p => !p.g).length;

const dupAddrs = props.filter(p => p.dup);
const dupRecs = dupAddrs.reduce((n, p) => n + p.dup - 1, 0);

console.log(`\nAddresses:   ${props.length} (${withVisit} with a scheduled visit, ${props.length - withVisit} without)`);
console.log(`Duplicates:  ${dupAddrs.length} addresses held ${dupRecs} extra Jobber property records — merged here, still duplicated in Jobber`);
console.log(`Grid:        ${payload.grid} — ${zipRows.length} zips, ${noGrid} addresses in a zip the grid does not cover`);
console.log(`Routes:      planned through ${payload.plannedThrough || 'n/a'}`);
console.log(`Off-day:     ${offGrid} scheduled visits fall outside their zip's route day`);
console.log(`Unrouted:    ${unrouted} scheduled visits on an already-planned day with no OptimoRoute stop`);
console.log(`Date clash:  ${clash.length} visits where OptimoRoute is routed to a different day than Jobber holds${clash.length ? ' — the customer was notified off the Jobber date' : ''}`);
for (const p of clash) console.log(`  #${p.v.jn} ${p.n} — ${p.s}, ${p.ci} ${p.z}: Jobber ${p.v.d} -> routed ${p.v.ord} (${p.v.ordrv})`);
console.log(`Tech clash:  ${techClash} visits routed to a different tech than Jobber has assigned`);
console.log(`\nWrote ${htmlOut}  (${(fs.statSync(htmlOut).size / 1024).toFixed(0)} KB)`);
if (portableOut) console.log(`Wrote ${portableOut}`);
