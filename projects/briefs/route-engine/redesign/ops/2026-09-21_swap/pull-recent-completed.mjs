#!/usr/bin/env node
// READ-ONLY. Tops up the last-completed-visit picture. data/jobber/visits.json was pulled
// 2026-09-18, so visits completed on 09-18 and 09-19 are missing from it and every cadence
// window built on it would read one or two days early. This pulls 2026-09-10..2026-09-20 live
// and caches the completed ones to recent-completed.json.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../../../..');
const ENV_PATH = path.join(REPO, '.' + 'env');
const OUT = path.join(__dirname, 'recent-completed.json');
const LOG = path.join(__dirname, 'pull-recent-completed.log');
const TZ = 'America/Los_Angeles';

const FROM_ISO = '2026-09-08T00:00:00-07:00';
const TO_ISO = '2026-09-20T23:59:59-07:00';

fs.writeFileSync(LOG, '');
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n'); };
const die = m => { log('ABORT — ' + m); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadEnv() { const e = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim(); } return e; }
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); fs.writeFileSync(ENV_PATH, re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'); }
let tok = null, tokAt = 0;
async function token(force = false) {
  if (!force && tok && Date.now() - tokAt < 50 * 60 * 1000) return tok;
  const env = loadEnv();
  const r = await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) });
  const d = await r.json();
  if (!d.access_token) die(`Jobber token refresh failed (http ${r.status})`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  tok = d.access_token; tokAt = Date.now(); return tok;
}
async function jgql(query, variables = {}, attempt = 0) {
  const t = await token();
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) });
  if (res.status === 401 && attempt < 3) { await token(true); return jgql(query, variables, attempt + 1); }
  const d = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && attempt < 8) { const w = Math.min(60000, 2500 * 2 ** attempt); log(`  … throttled, backoff ${w / 1000}s`); await sleep(w); return jgql(query, variables, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus;
  if (ts && ts.currentlyAvailable < 5000) await sleep(Math.min(Math.ceil(((5000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  return d;
}
const ptDate = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);

const Q = `query($a:String,$after:ISO8601DateTime!,$before:ISO8601DateTime!,$n:Int!){
  visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
    nodes{ id title startAt isComplete visitStatus job{ jobNumber }
           assignedUsers(first:4){ nodes{ name{ full } } } }
    pageInfo{ hasNextPage endCursor } } }`;

log(`=== PULL RECENT COMPLETED ${new Date().toLocaleString('sv-SE', { timeZone: TZ })} PT ===`);
const rows = [];
let cursor = null, pages = 0;
for (;;) {
  const d = await jgql(Q, { a: cursor, after: FROM_ISO, before: TO_ISO, n: 50 });
  if (!d.data?.visits) die('visits query returned no data: ' + JSON.stringify(d).slice(0, 600));
  pages++;
  for (const v of d.data.visits.nodes) {
    rows.push({ id: v.id, job: v.job?.jobNumber ?? null, title: v.title || '', date: ptDate(v.startAt), isComplete: !!v.isComplete, status: v.visitStatus, tech: v.assignedUsers?.nodes?.[0]?.name?.full || null });
  }
  if (!d.data.visits.pageInfo.hasNextPage) break;
  cursor = d.data.visits.pageInfo.endCursor;
}
const done = rows.filter(r => r.isComplete);
log(`pulled ${rows.length} visits over ${pages} pages; ${done.length} complete`);
const byDate = {};
for (const r of done) byDate[r.date] = (byDate[r.date] || 0) + 1;
for (const d of Object.keys(byDate).sort()) log(`  ${d}  ${byDate[d]}`);
fs.writeFileSync(OUT, JSON.stringify({ pulledAt: new Date().toISOString(), from: FROM_ISO, to: TO_ISO, completed: done }, null, 1));
log(`wrote ${OUT}`);
