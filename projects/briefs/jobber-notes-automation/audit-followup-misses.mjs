// audit-followup-misses.mjs — retrospective sweep: which notes asked for a follow-up
// visit that never actually happened?
//
// Why this exists (2026-08-01, Spencer): the daily engine is DRY-RUN by design — techs
// are meant to add the follow-up on-site. So a note implying a follow-up is only "done"
// if a real visit landed near the implied date. Two separate failure modes:
//
//   1. TECH MISS   — note said "Add visit"/"2 weeks", parser read it fine, nobody booked it.
//   2. PARSER BLIND — note said "1 week" / "two weeks" / "10 days" — phrasings the shipped
//      parse-note.mjs next-action regex does NOT match, so it returned null, the engine
//      said LEAVE, and the nightly review never even surfaced it. (Robert Norton writes
//      intervals this way rather than "Add visit".) These are invisible misses.
//
// This script detects intent with a BROAD matcher, then checks the job's real visit
// history for a visit that actually landed in the implied window.
//
// REPORT ONLY — never mutates the schedule.
//
// Usage (from repo root):
//   node projects/briefs/jobber-notes-automation/audit-followup-misses.mjs [--from=YYYY-MM-DD] [--to=YYYY-MM-DD] [--tol=3] [--json]

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { parseNote } from './parse-note.mjs';
import { detectFollowUp } from './detect-followup.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
const TZ = 'America/Los_Angeles';

const argv = process.argv.slice(2);
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const JSON_OUT = argv.includes('--json');

const ptToday = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 86400000);

const TO = arg('to') || ptToday();
const FROM = arg('from') || addDays(TO, -45);
const TOL = +(arg('tol') || 3);       // a visit within TOL days of target counts as satisfied
const CHUNK = +(arg('chunk') || 12);

// ---------- auth (same sanctioned pattern as engine.mjs — rotated token persisted) ----------
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
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
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
  if (res.status === 401 && attempt < 3) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 7) {
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    process.stderr.write(`  … throttled — backing off ${wait / 1000}s\n`);
    await sleep(wait); return gql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  }
  return data.data;
}

// PT day [00:00, 24:00) expressed in UTC (handles PDT/PST).
function ptDayBoundsUtc(date) {
  const mk = (yy, mm, dd) => {
    const noonUtc = new Date(Date.UTC(yy, mm - 1, dd, 12));
    const ptHour = +noonUtc.toLocaleString('en-US', { timeZone: TZ, hour: '2-digit', hour12: false });
    return new Date(Date.UTC(yy, mm - 1, dd, 12 - ptHour)).toISOString();
  };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { after: mk(y, m, d), before: mk(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}

// ---------- fetch ----------
async function visitedJobIds() {
  const { after } = ptDayBoundsUtc(FROM);
  const { before } = ptDayBoundsUtc(TO);
  const ids = new Set();
  let cursor = null, pages = 0;
  for (;;) {
    pages++;
    const afterArg = cursor ? `, after: "${cursor}"` : '';
    const v = (await gql(`query { visits(first: 100${afterArg}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
      nodes { id job { id } } pageInfo { hasNextPage endCursor } } }`)).visits;
    for (const n of v.nodes) if (n.job) ids.add(n.job.id);
    process.stderr.write(`\r  visits page ${pages} — ${ids.size} jobs`);
    if (!v.pageInfo.hasNextPage || pages >= 60) break;
    cursor = v.pageInfo.endCursor;
    await sleep(350);
  }
  process.stderr.write('\n');
  return [...ids];
}

async function fetchJobs(ids) {
  // Visit window: a little before FROM (to anchor the completed visit) through +90d
  // (to see whether a follow-up ever landed, including one booked well late).
  const { after: vAfter } = ptDayBoundsUtc(addDays(FROM, -10));
  const { before: vBefore } = ptDayBoundsUtc(addDays(TO, 90));
  const SEL = `id jobNumber jobStatus jobType jobberWebUri client { name }
    notes(last: 60) { nodes { __typename ... on JobNote { message createdAt
      createdBy { __typename ... on User { id name { full } } } } } }
    visits(first: 60, filter: { startAt: { after: "${vAfter}", before: "${vBefore}" } }) {
      nodes { id startAt visitStatus } }`;
  const out = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { ${SEL} }`).join(' ')} }`;
    const d = await gql(q);
    for (const k of Object.keys(d)) if (d[k]) out.push(d[k]);
    process.stderr.write(`\r  jobs ${Math.min(i + CHUNK, ids.length)}/${ids.length}`);
    if (i + CHUNK < ids.length) await sleep(500);
  }
  process.stderr.write('\n');
  return out;
}

// ---------- analyse ----------
const localDate = s => String(s).slice(0, 10);

function analyse(job) {
  const rows = [];
  const notes = (job.notes?.nodes || []).filter(n => n && n.__typename === 'JobNote' && n.message);
  const visits = (job.visits?.nodes || [])
    .map(v => ({ date: localDate(v.startAt), status: v.visitStatus }))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const n of notes) {
    const noteDate = localDate(n.createdAt);
    if (noteDate < FROM || noteDate > TO) continue;

    const det = detectFollowUp(n.message);
    if (det.kind !== 'interval') continue;   // only rows that ask for a return visit

    // Anchor to the real completed visit: latest visit on/before the note date (notes are
    // sometimes written the next morning), else fall back to the note date itself.
    const anchor = [...visits].filter(v => v.date <= noteDate).pop();
    const completed = anchor && daysBetween(noteDate, anchor.date) <= 3 ? anchor.date : noteDate;
    const target = addDays(completed, det.days);

    // Did a visit actually land in the implied window?
    const after = visits.filter(v => v.date > completed);
    const next = after[0] || null;
    // Satisfied = ANY visit landed between the noted visit and target+TOL. Deliberately
    // generous: a tech returning EARLIER than asked still honoured the instruction, so
    // only a genuine absence (or a visit later than target+TOL) counts as a miss.
    const satisfied = after.some(v => v.date <= addDays(target, TOL));
    const slip = next ? daysBetween(next.date, target) : null;

    // What the LIVE automation read from the same note.
    const shipped = parseNote(n.message).nextAction;
    const parserBlind = shipped === null || (det.days === 7 && shipped === '2 weeks') || (det.days !== 7 && shipped === 'Add visit');

    rows.push({
      jobNumber: job.jobNumber, client: job.client?.name || '(no client)',
      jobStatus: job.jobStatus, webUri: job.jobberWebUri,
      author: n.createdBy?.name?.full || n.createdBy?.__typename || 'unknown',
      noteDate, completed, phrase: det.phrase, label: det.label, days: det.days,
      allHits: det.allHits, alsoMonthly: det.alsoMonthly, ambiguous: !!det.ambiguous,
      shippedRead: shipped, parserBlind,
      target, nextVisit: next ? next.date : null, nextStatus: next ? next.status : null,
      slip, satisfied,
      message: n.message.replace(/\s+/g, ' ').trim(),
    });
  }
  return rows;
}

// ---------- run ----------
process.stderr.write(`Follow-up miss audit — notes ${FROM} → ${TO} (tolerance ±${TOL}d)\n`);
const ids = await visitedJobIds();
const jobs = await fetchJobs(ids);
const rows = jobs.flatMap(analyse).sort((a, b) => a.completed.localeCompare(b.completed) || String(a.jobNumber).localeCompare(String(b.jobNumber)));

const misses = rows.filter(r => !r.satisfied);

if (JSON_OUT) {
  console.log(JSON.stringify({ from: FROM, to: TO, tol: TOL, jobsScanned: jobs.length, rows }, null, 2));
  process.exit(0);
}

const lines = [];
const say = s => { lines.push(s); console.log(s); };

say(`# Follow-up misses — notes ${FROM} → ${TO}`);
say('');
say(`Jobs visited in window: ${jobs.length}. Notes asking for a return visit: ${rows.length}. **Not honoured: ${misses.length}.**`);
say('');

// by author
const byAuthor = {};
for (const r of rows) {
  const a = (byAuthor[r.author] ||= { total: 0, miss: 0, blind: 0, blindMiss: 0 });
  a.total++; if (!r.satisfied) a.miss++; if (r.parserBlind) a.blind++; if (r.parserBlind && !r.satisfied) a.blindMiss++;
}
say('## By note author');
say('');
say('| Author | Follow-ups asked | Not honoured | Phrasing the parser can\'t read | Blind AND missed |');
say('|---|---:|---:|---:|---:|');
for (const [a, v] of Object.entries(byAuthor).sort((x, y) => y[1].miss - x[1].miss)) {
  say(`| ${a} | ${v.total} | ${v.miss} | ${v.blind} | ${v.blindMiss} |`);
}
say('');

const fmt = r => `| ${r.jobNumber} | ${r.client.slice(0, 26)} | ${r.author.split(' ')[0]} | ${r.completed} | \`${r.phrase}\` | ${r.target} | ${r.nextVisit || '**none**'} | ${r.slip === null ? '—' : (r.slip > 0 ? '+' + r.slip : r.slip) + 'd'} | ${r.shippedRead || '**null**'} |`;
const HEAD = '| Job | Client | Note by | Visited | Note said | Due | Next visit | Slip | Automation read |\n|---|---|---|---|---|---|---|---:|---|';

const blindMiss = misses.filter(r => r.parserBlind);
const seenMiss = misses.filter(r => !r.parserBlind);

say(`## A. Invisible misses — the automation could not read the interval (${blindMiss.length})`);
say('');
if (!blindMiss.length) say('_None._');
else { say(HEAD); for (const r of blindMiss) say(fmt(r)); }
say('');

say(`## B. Read correctly, still never booked (${seenMiss.length})`);
say('');
if (!seenMiss.length) say('_None._');
else { say(HEAD); for (const r of seenMiss) say(fmt(r)); }
say('');

const amb = rows.filter(r => r.ambiguous);
say(`## C. Ambiguous notes — more than one interval, or an interval plus "monthly" (${amb.length})`);
say('');
if (!amb.length) say('_None._');
else {
  say('| Job | Client | Note by | Visited | Phrases found | Read as | Honoured |');
  say('|---|---|---|---|---|---|---|');
  for (const r of amb) say(`| ${r.jobNumber} | ${r.client.slice(0, 26)} | ${r.author.split(' ')[0]} | ${r.completed} | ${r.allHits.map(h => '`' + h + '`').join(' ')}${r.alsoMonthly ? ' + `monthly`' : ''} | ${r.days}d | ${r.satisfied ? 'yes' : '**no**'} |`);
}
say('');

say('## Full note text for every miss');
say('');
for (const r of misses) {
  say(`**#${r.jobNumber} ${r.client}** — visited ${r.completed}, note by ${r.author}, due ${r.target}, next visit ${r.nextVisit || 'NONE'}`);
  say('```');
  say(r.message);
  say('```');
  say(r.webUri || '');
  say('');
}

const dir = path.join(__dirname, 'runs');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `followup-misses-${TO}.md`);
fs.writeFileSync(file, lines.join('\n') + '\n');
fs.writeFileSync(path.join(dir, `followup-misses-${TO}.json`), JSON.stringify({ from: FROM, to: TO, tol: TOL, jobsScanned: jobs.length, rows }, null, 2));
console.error(`\nWritten: ${file}`);
