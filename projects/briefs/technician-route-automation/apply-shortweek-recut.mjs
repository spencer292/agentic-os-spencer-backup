#!/usr/bin/env node
// apply-shortweek-recut.mjs — cut each territory from five day-tiles to four for the Labor Day week.
//
// Approved by Spencer 2026-09-04, including the two cross-territory lends.
//
// WHAT IT DOES, AND ONLY THIS
//   1. DATE: a visit currently parked on Tue 9/8 whose home weekday is MONDAY moves to the day this
//      map sends it. Everything else keeps its date — genuine Tuesday work, and anything already on
//      Wed/Thu/Fri, is left alone.
//   2. TECH: three zip blocks change owner for this week only (the lends).
//   Nothing else moves. No times, no arrival windows, no visits outside Sep 8-11.
//
// THE MAP IS DATA, NOT CODE. Each entry is a geographic judgement about which remaining day already
// touches that ground — Bellevue joins the Sammamish plateau over I-90/520, Redmond and Kirkland
// join the Woodinville day, Olympia-north merges into Olympia-south so the 60-mile Thurston run
// happens once instead of twice, Black Diamond joins the Enumclaw run via SR-169.
//
// SAFETY: write-gate first import; dry by default; refuses SETs, weekends, and Labor Day itself;
// re-reads the live board before writing and skips anything that moved since the plan was built.
//
// Usage: node apply-shortweek-recut.mjs [--live]
import '../route-engine/lib/write-gate.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const LIVE = process.argv.includes('--live');

const WEEK = { Tue: '2026-09-08', Wed: '2026-09-09', Thu: '2026-09-10', Fri: '2026-09-11' };
const PARKED = '2026-09-08';
const HOLIDAY = '2026-09-07';

// --- the four-day merge map: where each Monday-tile zip goes, per tech ---
const MERGE = {
  'Alias Franks': {
    98052: 'Wed', 98033: 'Wed', 98034: 'Wed', 98011: 'Wed',           // Redmond/Kirkland -> Woodinville day
    98005: 'Thu', 98007: 'Thu', 98008: 'Thu',                          // Bellevue east -> Sammamish plateau, 520/I-90
    98004: 'Tue', 98039: 'Tue',                                        // Medina/Clyde Hill/Yarrow Pt -> N Seattle over 520
  },
  'Cory Ventura': {
    98042: 'Wed', 98038: 'Wed',                                        // Covington/Maple Valley -> his Wed block
    98030: 'Tue', 98031: 'Tue', 98032: 'Tue', 98051: 'Tue',            // Kent valley / Ravensdale stay Tue
    98178: 'Fri', 98168: 'Fri', 98198: 'Fri', 98148: 'Fri',            // lent Skyway corner -> his Renton Fri, it borders it
    98092: 'Tue', 98001: 'Tue', 98002: 'Tue',                          // Auburn -> Robert's Tue Enumclaw run, SR-164
    98058: 'Fri', 98055: 'Fri',
  },
  'Luke LaVergne': {
    98501: 'Thu', 98502: 'Thu', 98503: 'Thu', 98506: 'Thu',            // Thurston north merges into Thurston south
    98512: 'Thu', 98513: 'Thu', 98516: 'Thu',
    98388: 'Fri', 98465: 'Fri', 98466: 'Fri', 98498: 'Fri', 98499: 'Fri', // Lakewood/UP/Steilacoom -> Tacoma Fri
  },
  'Robert Norton': {
    98092: 'Tue', 98001: 'Tue', 98002: 'Tue',                          // Auburn joins the Enumclaw run over SR-164
    98010: 'Tue',                                                      // Black Diamond -> Enumclaw run, SR-169
    98042: 'Wed', 98038: 'Wed',                                        // Covington -> Cory's Wed block
  },
  'Tavis Alexander': {
    98166: 'Tue', 98136: 'Tue', 98116: 'Tue',                          // his own West Seattle day
    98146: 'Wed',                                                      // White Center -> Renton Wed, 12 mi over 518/405
    98178: 'Fri', 98168: 'Fri', 98198: 'Fri', 98148: 'Fri',            // the corner going to Cory
  },
};

// --- relief: blocks already on their own day that move so no tech ends up with a monster day ---
// Same principle as the merge map, applied to non-Monday work: a whole zip block, to an adjacent day.
const RELIEF = [
  { tech: 'Tavis Alexander', zips: [98108], from: 'Tue', to: 'Thu', why: 'Georgetown -> Mercer Is/Bellevue Thu over I-90; his Tue is the heaviest day on the board' },
  { tech: 'Alias Franks', zips: [98074, 98075], from: 'Thu', to: 'Fri', why: 'Sammamish already runs majority-Friday (98074 Thu 19/Fri 39, 98075 Thu 12/Fri 41) — consolidating it fills his light Friday and unloads Thursday' },
];

// --- the lends: this week only, reversed 9/14 ---
const LENDS = [
  { zips: [98178, 98168, 98198, 98148], from: 'Tavis Alexander', to: 'Cory Ventura', why: 'Skyway/Tukwila/SeaTac corner — Cory already runs these zips and has the headroom' },
  { zips: [98042, 98038], from: 'Robert Norton', to: 'Cory Ventura', why: 'Covington/Maple Valley — Cory owns this ground Wed and Fri' },
  { zips: [98092, 98001, 98002], from: 'Cory Ventura', to: 'Robert Norton', why: 'Auburn — consolidates onto Robert Thursday Auburn block' },
];

const PACE = { 'Cory Ventura': 17.3, 'Robert Norton': 17.7, 'Luke LaVergne': 19.1, 'Alias Franks': 21.3, 'Tavis Alexander': 19.0, 'Spencer Hill': 22.0 };

// ---------------------------------------------------------------- jobber
const loadEnv = () => { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; };
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp(`^${k}=.*$`, 'm'); t = re.test(t) ? t.replace(re, `${k}=${v}`) : t + `\n${k}=${v}\n`; fs.writeFileSync(ENV_PATH, t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; return tok;
}
async function gql(query, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query }) });
  if (res.status === 401 && attempt < 2) { await token(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, attempt + 1); }
  if (data.errors) throw new Error('Jobber: ' + JSON.stringify(data.errors).slice(0, 300));
  return data.data;
}

const ptDate = s => new Date(new Date(s).getTime() - 7 * 3600e3).toISOString().slice(0, 10);
const dow = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];

// --- home weekday per tech+zip, from five weeks of real routes ---
const hist = [
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '_visits_aug.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '_visits_wk0831.json'), 'utf8')),
];
const tally = {};
for (const x of hist) {
  const t = x.assignedUsers?.nodes?.[0]?.name?.full || 'X';
  const z = (x.property?.address?.postalCode || '').slice(0, 5);
  const d = dow(ptDate(x.startAt));
  ((tally[t] = tally[t] || {})[z] = tally[t][z] || {})[d] = (tally[t][z][d] || 0) + 1;
}
const homeDay = (tech, zip) => {
  const v = tally[tech]?.[zip]; if (!v) return null;
  const b = Object.entries(v).filter(([d]) => d !== 'Sat' && d !== 'Sun').sort((a, c) => c[1] - a[1])[0];
  return b ? b[0] : null;
};

// --- read the live board ---
const board = [];
{
  let cursor = null;
  for (let p = 0; p < 20; p++) {
    const a = cursor ? `, after: "${cursor}"` : '';
    const v = (await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${HOLIDAY}T07:00:00Z", before: "2026-09-11T23:59:59-07:00" } }) {
      nodes { id title startAt
        assignedUsers(first: 3) { nodes { id name { full } } }
        property { address { city postalCode } }
        job { id jobNumber startAt } }
      pageInfo { hasNextPage endCursor } } }`)).visits;
    board.push(...v.nodes);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor; await sleep(300);
  }
}
console.log(`\n  live board Sep 7-11: ${board.length} visits`);

// --- tech user ids, taken from the board itself ---
const techId = {};
for (const v of board) for (const u of v.assignedUsers?.nodes || []) techId[u.name.full] = u.id;

// --- plan ---
const plan = [];
const unmapped = [];
for (const v of board) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const zip = (v.property?.address?.postalCode || '').slice(0, 5);
  const date = ptDate(v.startAt);
  const isSet = v.job?.startAt && ptDate(v.job.startAt) === date;
  const row = { visitId: v.id, jobNumber: v.job?.jobNumber, client: (v.title || '').replace(/\s*\(SET\)\s*$/, '').trim(), tech, zip, city: v.property?.address?.city || '', date, day: dow(date), isSet, newDate: null, newTech: null, why: [] };

  // 1. DATE — only the parked Monday tile
  if (date === PARKED && !isSet) {
    const h = homeDay(tech, zip);
    if (h === 'Mon') {
      const target = MERGE[tech]?.[zip];
      if (target) { if (WEEK[target] !== date) { row.newDate = WEEK[target]; row.why.push(`Monday tile -> ${target}`); } }
      else unmapped.push(row);
    }
  }

  // 1b. RELIEF — named blocks already on their own day, moved to level the tech's week
  if (!row.newDate && !isSet) {
    for (const R of RELIEF) {
      if (tech === R.tech && R.zips.includes(+zip) && row.day === R.from) { row.newDate = WEEK[R.to]; row.why.push(`relief: ${R.from} -> ${R.to}`); }
    }
  }

  // 2. TECH — the lends, wherever in the week they sit
  for (const L of LENDS) {
    if (tech === L.from && L.zips.includes(+zip)) { row.newTech = L.to; row.why.push(`lend: ${L.from.split(' ')[0]} -> ${L.to.split(' ')[0]}`); }
  }

  if (row.newDate || row.newTech) plan.push(row);
}

// --- guards ---
for (const r of plan) {
  if (r.newDate && (r.newDate === HOLIDAY || ['Sat', 'Sun'].includes(dow(r.newDate)))) throw new Error(`REFUSED — #${r.jobNumber} targeted ${r.newDate}, a non-working day`);
  if (r.isSet && r.newDate) throw new Error(`REFUSED — #${r.jobNumber} is a SET and would be rescheduled`);
  if (r.newTech && !techId[r.newTech]) throw new Error(`REFUSED — no Jobber user id found for ${r.newTech}`);
}

// --- projected board ---
const after = board.map(v => {
  const p = plan.find(x => x.visitId === v.id);
  return { date: p?.newDate || ptDate(v.startAt), tech: p?.newTech || v.assignedUsers?.nodes?.[0]?.name?.full || 'UNASSIGNED' };
});
const grid = (rows) => {
  const g = {}; const days = ['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'];
  for (const r of rows) { if (!days.includes(r.date)) continue; (g[r.tech] = g[r.tech] || {})[r.date] = (g[r.tech][r.date] || 0) + 1; }
  let out = '  TECH              ' + days.map(d => (dow(d) + ' ' + d.slice(8)).padStart(9)).join('') + '     WK    h/day\n';
  for (const t of Object.keys(g).sort()) {
    if (!PACE[t]) continue;
    let s = 0; const row = days.map(d => { const n = g[t][d] || 0; s += n; return String(n).padStart(9); }).join('');
    out += '  ' + t.padEnd(18) + row + String(s).padStart(7) + ((s * PACE[t] / 60) / 4).toFixed(1).padStart(9) + '\n';
  }
  return out;
};
const beforeRows = board.map(v => ({ date: ptDate(v.startAt), tech: v.assignedUsers?.nodes?.[0]?.name?.full || 'UNASSIGNED' }));

console.log(`\n  ${plan.length} visits change: ${plan.filter(r => r.newDate).length} dates, ${plan.filter(r => r.newTech).length} techs\n`);
console.log('  === BEFORE ===');
console.log(grid(beforeRows));
console.log('  === AFTER ===');
console.log(grid(after));
if (unmapped.length) {
  console.log(`  !! ${unmapped.length} Monday-tile visits have no entry in the merge map — LEFT ON TUESDAY, not guessed:`);
  const u = {}; for (const r of unmapped) u[`${r.tech} ${r.zip} ${r.city}`] = (u[`${r.tech} ${r.zip} ${r.city}`] || 0) + 1;
  for (const [k, n] of Object.entries(u).sort((a, b) => b[1] - a[1])) console.log(`       ${String(n).padStart(3)}  ${k}`);
  console.log('');
}
for (const L of LENDS) {
  const n = plan.filter(r => r.newTech === L.to && r.tech === L.from).length;
  console.log(`  LEND  ${String(n).padStart(3)}  ${L.from} -> ${L.to}   [${L.zips.join(', ')}]`);
}

fs.writeFileSync(path.join(__dirname, '_recut_plan.json'), JSON.stringify({ builtAt: new Date().toISOString(), plan, unmapped }, null, 1));

if (!LIVE) {
  console.log('\n  DRY RUN — nothing written. Plan saved to _recut_plan.json');
  process.exit(0);
}

// --- execute ---
console.log('');
let dOk = 0, tOk = 0, failed = 0;
for (const r of plan) {
  if (r.newDate) {
    const m = `mutation { visitEditSchedule(id: ${JSON.stringify(r.visitId)}, input: {
      startAt: { date: "${r.newDate}", timezone: "${TZ}" }, endAt: { date: "${r.newDate}", timezone: "${TZ}" }
    }) { visit { startAt } userErrors { message } } }`;
    try {
      const x = (await gql(m)).visitEditSchedule;
      if (x.userErrors?.length) { console.log(`  FAIL date #${r.jobNumber} ${JSON.stringify(x.userErrors)}`); failed++; }
      else { dOk++; console.log(`  DATE  #${String(r.jobNumber).padEnd(5)} ${r.client.slice(0, 22).padEnd(23)} ${r.zip} ${r.date} -> ${r.newDate}`); }
    } catch (e) { console.log(`  FAIL date #${r.jobNumber} ${e.message.slice(0, 140)}`); failed++; }
    await sleep(350);
  }
  if (r.newTech) {
    // visitEditAssignedUsers REPLACES the assignee list. Schema-checked 2026-09-04 against API
    // version 2025-04-16: the ids go inside `input`, NOT at the top level — a top-level
    // assignedUserIds fails every call with "missing required arguments: input".
    // It can also fail transiently on a recurring visit ("required to handle future items"), so retry once.
    const m = `mutation { visitEditAssignedUsers(visitId: ${JSON.stringify(r.visitId)}, input: { assignedUserIds: [${JSON.stringify(techId[r.newTech])}] }) { visit { id } userErrors { message } } }`;
    let done = false;
    for (let a = 0; a < 2 && !done; a++) {
      try {
        const x = (await gql(m)).visitEditAssignedUsers;
        if (x.userErrors?.length) { if (a === 1) { console.log(`  FAIL tech #${r.jobNumber} ${JSON.stringify(x.userErrors)}`); failed++; } else await sleep(1200); }
        else { done = true; tOk++; console.log(`  TECH  #${String(r.jobNumber).padEnd(5)} ${r.client.slice(0, 22).padEnd(23)} ${r.zip} ${r.tech.split(' ')[0]} -> ${r.newTech.split(' ')[0]}`); }
      } catch (e) { if (a === 1) { console.log(`  FAIL tech #${r.jobNumber} ${e.message.slice(0, 140)}`); failed++; } else await sleep(1200); }
    }
    await sleep(350);
  }
}
console.log(`\n  dates ${dOk}   techs ${tOk}   failed ${failed}`);
fs.writeFileSync(path.join(__dirname, `_recut_executed_${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify({ ranAt: new Date().toISOString(), dOk, tOk, failed, plan }, null, 1));
