#!/usr/bin/env node
// READ-ONLY. Spencer 10-04: of last week's visits (09-28..10-02), how many notes put the job on
// MONTHLY cadence, yet the job still has a visit in the coming week (10-05..10-09)?
// Cadence comes from decide.mjs (canonical): TMCP + no activity + no catch + no miss -> monthly.
// Quick Fix is always weekly, so it is never "monthly". OTHER products are reported separately.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNote } from '../../../../jobber-notes-automation/parse-note.mjs';
import { productOf, decideVisit } from '../../../../jobber-notes-automation/decide.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../../../.env');
const TZ = 'America/Los_Angeles';
const LAST = ['2026-09-28', '2026-10-02'], NEXT = ['2026-10-05', '2026-10-09'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const env = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) })).json();
if (!tr.access_token) { console.error('token refresh failed'); process.exit(1); }
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) { const t = fs.readFileSync(ENV_PATH, 'utf8'); fs.writeFileSync(ENV_PATH, t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token)); }
async function gql(query, attempt = 0) {
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + tr.access_token, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query }) });
  const d = await res.json().catch(() => ({}));
  if ((res.status === 429 || JSON.stringify(d.errors || '').includes('THROTTLED')) && attempt < 8) { await sleep(Math.min(60000, 3000 * 2 ** attempt)); return gql(query, attempt + 1); }
  const ts = d.extensions?.cost?.throttleStatus; if (ts && ts.currentlyAvailable < 4000) await sleep(Math.min(Math.ceil(((4000 - ts.currentlyAvailable) / (ts.restoreRate || 500)) * 1000), 20000));
  if (!d.data) throw new Error(JSON.stringify(d.errors || d).slice(0, 300));
  return d.data;
}
const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const day = iso => pt(iso).slice(0, 10);
async function visitsIn([from, to]) {
  const out = []; let cur = null;
  for (;;) {
    const d = await gql(`query { visits(first: 100${cur ? `, after: "${cur}"` : ''}, filter: { startAt: { after: "${from}T00:00:00-07:00", before: "${to}T23:59:59-07:00" } }) {
      nodes { id startAt isComplete job { id jobNumber } assignedUsers(first: 2) { nodes { name { full } } } } pageInfo { hasNextPage endCursor } } }`);
    for (const v of d.visits.nodes) if (v.job) out.push({ id: v.id, date: day(v.startAt), done: v.isComplete, jobId: v.job.id, jobNumber: String(v.job.jobNumber), tech: v.assignedUsers.nodes.map(u => u.name.full).join('+') });
    if (!d.visits.pageInfo.hasNextPage) break; cur = d.visits.pageInfo.endCursor; await sleep(300);
  }
  return out;
}

const last = (await visitsIn(LAST)).filter(v => v.done);
const next = await visitsIn(NEXT);
const nextByJob = new Map(); for (const v of next) { if (!nextByJob.has(v.jobId)) nextByJob.set(v.jobId, []); nextByJob.get(v.jobId).push(v); }
const lastByJob = new Map(); for (const v of last) { const p = lastByJob.get(v.jobId); if (!p || v.date > p.date) lastByJob.set(v.jobId, v); }
console.error(`last week: ${last.length} completed visits on ${lastByJob.size} jobs; coming week: ${next.length} visits on ${nextByJob.size} jobs`);

const SEL = `id jobNumber jobStatus client { id name } lineItems(first: 8) { nodes { name } }
  notes(last: 12) { nodes { __typename ... on JobNote { message createdAt } } }
  visits(first: 4, filter: { startAt: { after: "${NEXT[0]}T00:00:00-07:00" } }) { nodes { startAt } }`;
const ids = [...lastByJob.keys()], jobs = [];
for (let i = 0; i < ids.length; i += 12) {
  const chunk = ids.slice(i, i + 12);
  const d = await gql(`query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { ${SEL} }`).join(' ')} }`);
  for (const k of Object.keys(d)) if (d[k]) jobs.push(d[k]);
  process.stderr.write(`\r  jobs ${Math.min(i + 12, ids.length)}/${ids.length}`); await sleep(500);
}
console.error('');

const rows = [];
for (const j of jobs) {
  const lv = lastByJob.get(j.id);
  // the note for last week's visit: the latest JobNote created on the visit day or up to 2 days after
  const lim = new Date(lv.date + 'T12:00:00Z'); lim.setUTCDate(lim.getUTCDate() + 2); const limD = lim.toISOString().slice(0, 10);
  const notes = (j.notes.nodes || []).filter(n => n?.__typename === 'JobNote' && n.message).filter(n => { const c = day(n.createdAt); return c >= lv.date && c <= limD; });
  const note = notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).pop() || null;
  const product = productOf(j.lineItems.nodes.map(n => n.name));
  const p = note ? parseNote(note.message) : {};
  const upcoming = (j.visits.nodes || []).map(v => ({ date: day(v.startAt) }));
  const dec = note ? decideVisit(lv.date, p.nextAction, upcoming, { product, activity: p.activity, moles: p.moles, misses: p.misses }) : { action: 'NONOTE' };
  const monthly = product === 'TMCP' && note && !(p.moles > 0) && !(p.misses > 0) && p.activity === 'None';
  const nw = nextByJob.get(j.id) || [];
  rows.push({ job: String(j.jobNumber), client: j.client?.name, status: j.jobStatus, product, last: lv.date, lastTech: lv.tech, activity: p.activity ?? null, moles: p.moles ?? null, misses: p.misses ?? null, nextAction: p.nextAction ?? null, hasNote: !!note, cadence: product === 'QUICKFIX' ? 'weekly (QF)' : monthly ? 'monthly' : product === 'TMCP' ? (note ? (p.activity == null && p.moles == null && p.misses == null ? 'unparsed' : 'weekly') : 'no note') : 'other', nextWeek: nw.map(v => `${v.date} ${v.tech}`), gapDays: nw.length ? Math.round((new Date(nw[0].date) - new Date(lv.date)) / 86400000) : null, note: note ? note.message.replace(/\s+/g, ' ').slice(0, 140) : null });
}
fs.writeFileSync(path.join(__dirname, 'monthly-on-next-week.json'), JSON.stringify(rows, null, 1));
const tally = {}; for (const r of rows) { const k = `${r.cadence} | ${r.nextWeek.length ? 'ON next week' : 'not next week'}`; tally[k] = (tally[k] || 0) + 1; }
console.log(JSON.stringify(tally, null, 1));
const hits = rows.filter(r => r.cadence === 'monthly' && r.nextWeek.length).sort((a, b) => (a.lastTech || '').localeCompare(b.lastTech || '') || a.last.localeCompare(b.last));
console.log(`\nMONTHLY but on next week: ${hits.length}`);
for (const r of hits) console.log(`#${r.job}\t${r.client}\tlast ${r.last} ${r.lastTech}\tnext ${r.nextWeek.join(', ')}\t(${r.gapDays}d)\t${r.status}\tNA=${r.activity} c${r.moles} m${r.misses}`);
