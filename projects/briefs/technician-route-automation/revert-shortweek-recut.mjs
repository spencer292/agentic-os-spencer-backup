#!/usr/bin/env node
// revert-shortweek-recut.mjs — put the Sep 8-11 board back the way it was before the re-cut.
//
// Undoes the 2026-09-04 run: 65 visit dates and 19 tech reassignments. Reads the exact before-state
// from _recut_date_moves.json (recovered from the live run log) and _recut_executed_2026-09-04.json.
//
// SAFE BY CONSTRUCTION
//   * Anything Spencer has changed himself since the run is SKIPPED, not overwritten. A visit is
//     only reverted if it is currently sitting exactly where the run left it.
//   * write-gate first import. Dry by default.
//
// Usage: node revert-shortweek-recut.mjs [--dates] [--techs] [--zip 98146,98108] [--tech "Alias Franks"] [--live]
//   With no filter it reverts everything. --zip / --tech narrow it to one block.
import '../route-engine/lib/write-gate.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const argv = process.argv.slice(2);
const LIVE = argv.includes('--live');
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ONLY_ZIPS = flag('zip') ? new Set(flag('zip').split(',').map(s => s.trim())) : null;
const ONLY_TECH = flag('tech');
const doDates = argv.includes('--dates') || (!argv.includes('--dates') && !argv.includes('--techs'));
const doTechs = argv.includes('--techs') || (!argv.includes('--dates') && !argv.includes('--techs'));

const loadEnv = () => { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; };
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp(`^${k}=.*$`, 'm'); t = re.test(t) ? t.replace(re, `${k}=${v}`) : t + `\n${k}=${v}\n`; fs.writeFileSync(ENV_PATH, t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tok = null;
async function token(force = false) {
  if (tok && !force) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('token refresh failed', r.status); process.exit(1); }
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

// --- read the live board (both weeks: a reverted visit may have been deferred too) ---
const board = [];
{
  let cursor = null;
  for (let p = 0; p < 25; p++) {
    const a = cursor ? `, after: "${cursor}"` : '';
    const v = (await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "2026-09-07T07:00:00Z", before: "2026-09-18T23:59:59-07:00" } }) {
      nodes { id startAt assignedUsers(first: 3) { nodes { id name { full } } }
        property { address { city postalCode } } job { jobNumber startAt } }
      pageInfo { hasNextPage endCursor } } }`)).visits;
    board.push(...v.nodes);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor; await sleep(300);
  }
}
const byId = new Map(board.map(v => [v.id, v]));
const byJob = new Map(); for (const v of board) byJob.set(v.job?.jobNumber, v);
const techId = {}; for (const v of board) for (const u of v.assignedUsers?.nodes || []) techId[u.name.full] = u.id;

const actions = [];

// --- date reverts ---
if (doDates) {
  const moves = JSON.parse(fs.readFileSync(path.join(__dirname, '_recut_date_moves.json'), 'utf8'));
  for (const m of moves) {
    const v = byJob.get(m.job);
    if (!v) { actions.push({ kind: 'date', job: m.job, skip: 'not on the board any more' }); continue; }
    if (ONLY_ZIPS && !ONLY_ZIPS.has(m.zip)) continue;
    const tech = v.assignedUsers?.nodes?.[0]?.name?.full || '';
    if (ONLY_TECH && tech !== ONLY_TECH) continue;
    const now = ptDate(v.startAt);
    if (now !== m.to) { actions.push({ kind: 'date', job: m.job, client: m.client, zip: m.zip, skip: `you have already moved it (now ${now}, run left it ${m.to})` }); continue; }
    actions.push({ kind: 'date', visitId: v.id, job: m.job, client: m.client, zip: m.zip, from: m.to, to: m.from, tech });
  }
}

// --- tech reverts ---
if (doTechs) {
  const ex = JSON.parse(fs.readFileSync(path.join(__dirname, '_recut_executed_2026-09-04.json'), 'utf8'));
  for (const r of ex.plan.filter(x => x.newTech)) {
    const v = byId.get(r.visitId);
    if (!v) { actions.push({ kind: 'tech', job: r.jobNumber, skip: 'not on the board any more' }); continue; }
    if (ONLY_ZIPS && !ONLY_ZIPS.has(r.zip)) continue;
    if (ONLY_TECH && r.tech !== ONLY_TECH && r.newTech !== ONLY_TECH) continue;
    const now = v.assignedUsers?.nodes?.[0]?.name?.full || '';
    if (now !== r.newTech) { actions.push({ kind: 'tech', job: r.jobNumber, client: r.client, zip: r.zip, skip: `you have already reassigned it (now ${now || 'unassigned'})` }); continue; }
    if (!techId[r.tech]) { actions.push({ kind: 'tech', job: r.jobNumber, skip: `no user id on the board for ${r.tech}` }); continue; }
    actions.push({ kind: 'tech', visitId: r.visitId, job: r.jobNumber, client: r.client, zip: r.zip, from: r.newTech, to: r.tech });
  }
}

const live = actions.filter(a => !a.skip);
const skipped = actions.filter(a => a.skip);
console.log(`\n  REVERT — ${LIVE ? '*** LIVE ***' : 'DRY RUN'}   ${live.length} to undo, ${skipped.length} left alone\n`);
for (const a of live) console.log(`  ${a.kind.toUpperCase().padEnd(5)} #${String(a.job).padEnd(5)} ${String(a.client).slice(0, 22).padEnd(23)} ${a.zip}  ${a.from}  ->  ${a.to}`);
if (skipped.length) { console.log('\n  LEFT ALONE (changed since the run — not overwriting your work):'); for (const a of skipped) console.log(`    #${String(a.job).padEnd(5)} ${String(a.client || '').slice(0, 22).padEnd(23)} ${a.skip}`); }

if (!LIVE) { console.log('\n  DRY RUN — nothing written.'); process.exit(0); }

let ok = 0, failed = 0;
for (const a of live) {
  const m = a.kind === 'date'
    ? `mutation { visitEditSchedule(id: ${JSON.stringify(a.visitId)}, input: { startAt: { date: "${a.to}", timezone: "${TZ}" }, endAt: { date: "${a.to}", timezone: "${TZ}" } }) { visit { startAt } userErrors { message } } }`
    : `mutation { visitEditAssignedUsers(visitId: ${JSON.stringify(a.visitId)}, input: { assignedUserIds: [${JSON.stringify(techId[a.to])}] }) { visit { id } userErrors { message } } }`;
  try {
    const d = await gql(m);
    const r = d.visitEditSchedule || d.visitEditAssignedUsers;
    if (r.userErrors?.length) { console.log(`  FAIL #${a.job} ${JSON.stringify(r.userErrors)}`); failed++; }
    else { ok++; console.log(`  BACK  #${String(a.job).padEnd(5)} ${String(a.client).slice(0, 22).padEnd(23)} -> ${a.to}`); }
  } catch (e) { console.log(`  FAIL #${a.job} ${e.message.slice(0, 140)}`); failed++; }
  await sleep(350);
}
console.log(`\n  reverted ${ok}   failed ${failed}`);
