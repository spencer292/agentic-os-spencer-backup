#!/usr/bin/env node
// WF-3 — ONE-TIME BACKFILL: give every future "anytime" Jobber visit a placeholder
// arrival window (07:00–19:00 PT on its own date) so Jobber's day-before arrival-window
// emails work. After this, Spencer adds a placeholder time manually on new jobs.
//
// The 12h-wide window is ALSO the sentinel WF-1 uses to know a visit is NOT committed:
// wide window = floats across days; tight (+3h) window = day-pinned. Do not change the
// 07:00–19:00 convention without updating WF-1's pin rule.
//
// Usage (run from repo root):
//   node projects/briefs/technician-route-automation/backfill-time-windows.mjs scan
//       -> pages ALL upcoming visits, collects anytime ones into backfill-state.json (read-only)
//   node ... backfill-time-windows.mjs report
//       -> summarize state file: counts by month, remaining
//   node ... backfill-time-windows.mjs live --max 20
//       -> write windows for the next N pending visits (resumable; reruns skip done ones)
//
// Auth: sanctioned pattern from .claude/skills/tool-jobber/scripts/jobber-api.mjs —
// single refresh at start (rotation persisted back to .env), token reused, re-refreshed
// after 50 min or on 401. Throttle + backoff on Jobber rate/cost limits.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(REPO, '.env');
const STATE = path.join(__dirname, 'backfill-state.json');
const TZ_OFFSET_CHECK = true; // PT handling below uses explicit timezone in mutation

const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';

// ---------- env (same behavior as jobber-api.mjs: persist rotated refresh token) ----------
function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}

let accessToken = null;
let tokenAt = 0;
async function getToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token;
  tokenAt = Date.now();
  return accessToken;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, variables, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled =
    res.status === 429 ||
    (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 6) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return gql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors) throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  return data.data;
}

// ---------- PT date helpers (no deps) ----------
function toPT(iso) {
  // Pacific offset: -07:00 (PDT) or -08:00 (PST). Determine via Intl.
  const d = new Date(iso);
  const s = d.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }); // "YYYY-MM-DD HH:mm:ss"
  return { date: s.slice(0, 10), hm: s.slice(11, 16) };
}
function tomorrowUtcIso() {
  const now = new Date();
  const pt = now.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10);
  // tomorrow PT midnight expressed as an after-filter: use today PT 23:59 -> simplest is date+1 at 00:00 PT.
  // Build from PT date arithmetic:
  const [y, m, d] = pt.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1)); // tomorrow's PT calendar date
  const iso = t.toISOString().slice(0, 10);
  // 00:00 PT = 07:00Z (PDT) / 08:00Z (PST). July = PDT.
  return `${iso}T07:00:00Z`;
}

// ---------- state ----------
function loadState() {
  if (!fs.existsSync(STATE)) return null;
  return JSON.parse(fs.readFileSync(STATE, 'utf8'));
}
function saveState(st) {
  fs.writeFileSync(STATE, JSON.stringify(st));
}

// ---------- commands ----------
async function scan() {
  const after = tomorrowUtcIso();
  console.log(`Scanning UPCOMING visits with startAt after ${after} (100/page)…`);
  let cursor = null;
  let page = 0, total = 0;
  const anytime = [];
  for (;;) {
    const q = `query($after: String) { visits(first: 100, after: $after, filter: { status: UPCOMING, startAt: { after: "${after}" } }) { nodes { id startAt endAt } pageInfo { hasNextPage endCursor } } }`;
    const d = await gql(q, { after: cursor });
    const v = d.visits;
    page++;
    for (const n of v.nodes) {
      total++;
      const pt = toPT(n.startAt);
      if (pt.hm === '00:00') anytime.push({ id: n.id, date: pt.date });
    }
    if (page % 20 === 0) console.log(`  page ${page}: scanned ${total}, anytime so far ${anytime.length}`);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    await sleep(250);
  }
  const st = { scannedAt: new Date().toISOString(), after, totalScanned: total, pending: anytime, done: [], failed: [] };
  saveState(st);
  console.log(`\nSCAN COMPLETE: ${total} upcoming visits, ${anytime.length} anytime (need windows).`);
  console.log(`State: ${STATE}`);
  reportFromState(st);
}

function reportFromState(st) {
  st = st || loadState();
  if (!st) { console.log('No state file — run scan first.'); return; }
  const byMonth = {};
  for (const p of st.pending) byMonth[p.date.slice(0, 7)] = (byMonth[p.date.slice(0, 7)] || 0) + 1;
  console.log(`\nScanned ${st.totalScanned} @ ${st.scannedAt}`);
  console.log(`Pending: ${st.pending.length} | Done: ${st.done.length} | Failed: ${st.failed.length}`);
  console.log('Pending by month:');
  for (const k of Object.keys(byMonth).sort()) console.log(`  ${k}: ${byMonth[k]}`);
}

async function live(max) {
  const st = loadState();
  if (!st) { console.log('No state file — run scan first.'); return; }
  if (!max || max < 1) { console.log('Refusing: pass --max N (explicit write cap).'); return; }
  const batch = st.pending.slice(0, max);
  console.log(`Writing 07:00–19:00 PT windows to ${batch.length} visits (of ${st.pending.length} pending)…`);
  let ok = 0, failed = 0;
  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    const mut = `mutation { visitEditSchedule(id: "${p.id}", input: { startAt: { date: "${p.date}", time: "07:00:00", timezone: "America/Los_Angeles" }, endAt: { date: "${p.date}", time: "19:00:00", timezone: "America/Los_Angeles" } }) { userErrors { message } } }`;
    try {
      const d = await gql(mut, {});
      const ue = d.visitEditSchedule && d.visitEditSchedule.userErrors;
      if (ue && ue.length) {
        failed++;
        st.failed.push({ ...p, error: ue.map((e) => e.message).join('; ') });
      } else {
        ok++;
        st.done.push(p);
      }
    } catch (e) {
      failed++;
      st.failed.push({ ...p, error: String(e).slice(0, 200) });
    }
    // remove from pending regardless (failed ones are tracked separately for retry)
    st.pending = st.pending.filter((x) => x.id !== p.id);
    if ((i + 1) % 25 === 0) {
      saveState(st);
      console.log(`  ${i + 1}/${batch.length} (ok ${ok}, failed ${failed})`);
    }
    await sleep(200);
  }
  saveState(st);
  console.log(`\nDONE: ok ${ok}, failed ${failed}. Remaining pending: ${st.pending.length}`);
  if (st.failed.length) console.log(`Failed so far (${st.failed.length}) — first 5:`, JSON.stringify(st.failed.slice(0, 5), null, 1));
}

// ---------- main ----------
const [cmd, ...rest] = process.argv.slice(2);
const maxIdx = rest.indexOf('--max');
const max = maxIdx >= 0 ? Number(rest[maxIdx + 1]) : 0;

if (cmd === 'scan') await scan();
else if (cmd === 'report') reportFromState(null);
else if (cmd === 'live') await live(max);
else console.log('Usage: backfill-time-windows.mjs scan | report | live --max N');
