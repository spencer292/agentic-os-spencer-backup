// _sample-notes.mjs — read-only. Pulls recent visits + their job notes to (a) ground the
// voice formatter in real technician phrasing and (b) build a round-trip test corpus.
// Also confirms the visit->assignedUsers shape the field app needs to list "my jobs today".
//
// Usage (from repo root):  node projects/briefs/jobber-notes-automation/voice-notes/_sample-notes.mjs [--days=14]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote } from '../parse-note.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';

const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const DAYS = +(arg('days') || 14);

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
let accessToken = null;
async function getToken(force = false) {
  if (!force && accessToken) return accessToken;
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
  const d = await res.json();
  if (!res.ok) { console.error('Token refresh failed', res.status); process.exit(1); }
  accessToken = d.access_token;
  return accessToken;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));
async function gql(query, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 6) { await sleep(Math.min(60000, 2000 * 2 ** attempt)); return gql(query, attempt + 1); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 400)}`);
  return data.data;
}

// ── 1. page recent visits, capture assignedUsers shape ──────────────────────
const now = new Date();
const after = new Date(now.getTime() - DAYS * 864e5).toISOString();
const before = now.toISOString();

const jobsById = new Map();
const techTally = new Map();
let cursor = null, pages = 0;
do {
  const q = `query { visits(first: 100, filter: { startAt: { after: ${JSON.stringify(after)}, before: ${JSON.stringify(before)} } }${cursor ? `, after: ${JSON.stringify(cursor)}` : ''}) {
    nodes { id startAt assignedUsers(first: 5) { nodes { id name { full } } } job { id jobNumber client { name } } }
    pageInfo { hasNextPage endCursor } } }`;
  const d = await gql(q);
  for (const v of d.visits.nodes) {
    if (v.job?.id) jobsById.set(v.job.id, v.job);
    for (const u of (v.assignedUsers?.nodes || [])) {
      const n = u.name?.full || u.id;
      techTally.set(n, (techTally.get(n) || 0) + 1);
    }
  }
  cursor = d.visits.pageInfo.hasNextPage ? d.visits.pageInfo.endCursor : null;
  pages++;
  await sleep(400);
} while (cursor && pages < 30);

console.log(`Visits in last ${DAYS}d → ${jobsById.size} distinct jobs across ${pages} page(s)`);
console.log('\nAssigned technicians (visit counts):');
for (const [n, c] of [...techTally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(4)}  ${n}`);

// ── 2. fetch notes for those jobs ───────────────────────────────────────────
const ids = [...jobsById.keys()];
const CHUNK = 15;
const notes = [];
for (let i = 0; i < ids.length; i += CHUNK) {
  const chunk = ids.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { jobNumber client { name } notes(last: 10) { nodes { __typename ... on JobNote { message createdAt } } } }`).join(' ')} }`;
  const d = await gql(q);
  for (const k of Object.keys(d)) {
    const j = d[k];
    if (!j) continue;
    for (const n of (j.notes?.nodes || [])) {
      if (n && n.__typename === 'JobNote' && n.message) {
        notes.push({ jobNumber: j.jobNumber, client: j.client?.name, createdAt: n.createdAt, message: n.message });
      }
    }
  }
  if (i + CHUNK < ids.length) await sleep(600);
  process.stdout.write(`\r  notes fetched from ${Math.min(i + CHUNK, ids.length)}/${ids.length} jobs`);
}
console.log(`\n\nCollected ${notes.length} job notes.`);

const OUT = path.join(__dirname, '_notes-corpus.json');
fs.writeFileSync(OUT, JSON.stringify(notes, null, 1));
console.log(`Corpus → ${OUT}`);

// ── 3. what does the existing parser make of them? ──────────────────────────
let full = 0;
const missing = { moles: 0, misses: 0, activity: 0, inventory: 0, nextAction: 0 };
for (const n of notes) {
  const p = parseNote(n.message);
  if (p.moles === null) missing.moles++;
  if (p.misses === null) missing.misses++;
  if (!p.activity) missing.activity++;
  if (!p.inventory.length) missing.inventory++;
  if (!p.nextAction) missing.nextAction++;
  if (p.moles !== null && p.misses !== null && p.activity && p.inventory.length && p.nextAction) full++;
}
const pct = n => `${((1 - n / notes.length) * 100).toFixed(0)}%`;
console.log(`\nParser coverage on this corpus (${notes.length} notes):`);
console.log(`  moles       ${pct(missing.moles)}`);
console.log(`  misses      ${pct(missing.misses)}`);
console.log(`  activity    ${pct(missing.activity)}`);
console.log(`  inventory   ${pct(missing.inventory)}`);
console.log(`  nextAction  ${pct(missing.nextAction)}`);
console.log(`  ALL FIVE    ${((full / notes.length) * 100).toFixed(0)}%`);

console.log('\n── 25 sample notes (raw) ──');
for (const n of notes.slice(-25)) {
  console.log(`\n#${n.jobNumber} ${n.client} [${n.createdAt.slice(0, 10)}]`);
  console.log(n.message.split(/\r?\n/).map(l => '   | ' + l).join('\n'));
}
