// report-sync.mjs — writes the Job Custom Field report from visit notes.
// Read strategy (v2, 2026-07-10): visits-first. Page the day's visits (cheap), dedup to
// their jobs, then fetch notes + custom-field IDs for ONLY those jobs (aliased batches).
// This closes the old coverage gap where an unfiltered jobs(first: N) pull could miss
// visited jobs entirely on busy days — and it stays under Jobber's query-cost throttle.
// For each such job: parse the latest note; if it's dated DATE (PT), write via jobEdit.
// Dry-run by default.
//
// Auth: sanctioned direct-fetch pattern from backfill-time-windows.mjs (refresh at start,
// rotated token persisted to .env, re-refresh on 401). Direct fetch — NOT the tool-jobber
// CLI — because Jobber returns partial "hidden due to permissions" errors for RequestNote
// objects our token can't read; the CLI treats any GraphQL error as fatal and drops the
// data, while here we tolerate permission-hides and keep the JobNote data that did arrive.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/report-sync.mjs [--date=YYYY-MM-DD] [--write]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote } from './parse-note.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';

const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const DATE = arg('date') || new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10);
const WRITE = argv.includes('--write');
const CHUNK = +arg('chunk') || 15; // jobs per aliased batch query (keeps query cost low)

// ---------- auth (persist rotated refresh token, same as jobber-api.mjs) ----------
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
let accessToken = null, tokenAt = 0;
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Partial errors that only report permission-hidden note objects (RequestNote etc.)
// are harmless — the JobNote data still arrives alongside them.
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));

async function gql(query, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION,
    },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 6) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  … throttled — backing off ${wait / 1000}s`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  }
  return data.data;
}

const localDate = s => String(s).slice(0, 10);
const norm = s => String(s || '').trim();

// PT day [00:00, 24:00) expressed in UTC (handles PDT/PST).
function ptDayBoundsUtc(date) {
  const mk = (yy, mm, dd) => {
    const noonUtc = new Date(Date.UTC(yy, mm - 1, dd, 12));
    const ptHour = +noonUtc.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', hour12: false });
    return new Date(Date.UTC(yy, mm - 1, dd, 12 - ptHour)).toISOString();
  };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { after: mk(y, m, d), before: mk(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}

// Canonical field name -> how to derive its value + which jobEdit value key to use.
// Returns undefined to SKIP a field (leaves the prior value untouched).
const DROPDOWN_NEXT = new Set(['Add visit', '2 weeks', 'Monthly', 'Return visit scheduled', 'Convert to annual']);
function fieldValues(parsed, totalCaught) {
  return {
    'Latest Activity':          parsed.activity ? { valueDropdown: parsed.activity } : undefined,
    'Moles Caught (last visit)': parsed.moles != null ? { valueNumeric: parsed.moles } : undefined,
    'Misses (last visit)':       parsed.misses != null ? { valueNumeric: parsed.misses } : undefined,
    'Trap Inventory':            parsed.inventoryStr ? { valueText: parsed.inventoryStr } : undefined,
    'Next Action':               DROPDOWN_NEXT.has(parsed.nextAction) ? { valueDropdown: parsed.nextAction }
                                  : parsed.nextAction === 'Weekly' ? { valueDropdown: 'Add visit' } : undefined,
    'Customer Shown':            { valueTrueFalse: !!parsed.customerShown },
    'onX Mapped':                { valueTrueFalse: !!parsed.onX },
    'Total Caught':              { valueNumeric: totalCaught },
  };
}

// ── 1. Page the day's visits, dedup to jobs ──────────────────────────────────
const { after, before } = ptDayBoundsUtc(DATE);
const jobsById = new Map();
let cursor = null, pages = 0;
for (;;) {
  pages++;
  const afterArg = cursor ? `, after: "${cursor}"` : '';
  const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
    nodes { id job { id jobNumber client { name } } }
    pageInfo { hasNextPage endCursor } } }`)).visits;
  for (const n of v.nodes) if (n.job) jobsById.set(n.job.id, n.job);
  if (!v.pageInfo.hasNextPage || pages >= 10) break;
  cursor = v.pageInfo.endCursor;
  await sleep(400);
}
console.log(`\nReport sync ${WRITE ? '⚡ WRITE' : '🔍 DRY RUN'} — visits on ${DATE} (PT): ${jobsById.size} jobs across ${pages} page(s)\n`);

// ── 2. Fetch notes + custom-field ids for only those jobs, in aliased chunks ─
const JOB_SEL = `id jobNumber client { name }
  notes(last: 40) { nodes { __typename ... on JobNote { message createdAt } } }
  customFields {
    __typename
    ... on CustomFieldText { id label }
    ... on CustomFieldNumeric { id label }
    ... on CustomFieldDropdown { id label }
    ... on CustomFieldTrueFalse { id label }
  }`;
const ids = [...jobsById.keys()];
const jobs = [];
for (let i = 0; i < ids.length; i += CHUNK) {
  const chunk = ids.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { ${JOB_SEL} }`).join(' ')} }`;
  const d = await gql(q);
  for (const k of Object.keys(d)) if (d[k]) jobs.push(d[k]);
  if (i + CHUNK < ids.length) await sleep(600);
}

// ── 3. Parse latest note per job; write custom fields ────────────────────────
let synced = 0, skipped = 0;
for (const j of jobs) {
  const notes = (j.notes.nodes || []).filter(n => n && n.__typename === 'JobNote' && n.message);
  if (!notes.length) continue;
  const latest = notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  if (localDate(latest.createdAt) !== DATE) continue;

  const parsed = parseNote(latest.message);
  const totalCaught = notes.reduce((s, n) => s + (parseNote(n.message).moles || 0), 0);
  const wanted = fieldValues(parsed, totalCaught);

  // map this job's field labels -> ids
  const byLabel = {};
  for (const f of (j.customFields || [])) byLabel[norm(f.label)] = f.id;

  const edits = [];
  for (const [name, val] of Object.entries(wanted)) {
    if (val === undefined) continue;
    const id = byLabel[name];
    if (!id) { console.log(`  ⚠ ${j.jobNumber} ${j.client?.name}: field "${name}" not found on job`); continue; }
    edits.push({ id, ...val });
  }
  if (!edits.length) { skipped++; continue; }

  const summary = edits.map(e => `${Object.values(e)[1]}`).join(' | ');
  if (WRITE) {
    const cf = edits.map(e => `{ id: "${e.id}", ${Object.entries(e).filter(([k]) => k !== 'id').map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')} }`).join(', ');
    const r = (await gql(`mutation { jobEdit(jobId: "${j.id}", input: { customFields: [${cf}] }) { userErrors { message } } }`)).jobEdit;
    if (r.userErrors?.length) { console.log(`  ❌ ${j.jobNumber} ${j.client?.name}: ${JSON.stringify(r.userErrors)}`); continue; }
    console.log(`  ✅ ${String(j.jobNumber).padEnd(5)} ${(j.client?.name || '').slice(0, 22).padEnd(22)} | ${summary}`);
  } else {
    console.log(`  · ${String(j.jobNumber).padEnd(5)} ${(j.client?.name || '').slice(0, 22).padEnd(22)} | ${summary}`);
  }
  synced++;
  if (WRITE) await sleep(300);
}
console.log(`\n${WRITE ? 'Wrote' : 'Would write'} ${synced} jobs; ${skipped} skipped (no fields to set). ${WRITE ? '' : 'Re-run with --write to apply.'}`);
