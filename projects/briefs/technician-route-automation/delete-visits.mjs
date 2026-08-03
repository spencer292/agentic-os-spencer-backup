#!/usr/bin/env node
// Delete named Jobber visits. General form of delete-dup-visits-0803.mjs, for stale records that
// are NOT same-day duplicates — e.g. a leftover visit still pointing at an off-roster tech sitting
// on a different day than the live one (#7303 Bryce Murphy, 2026-08-01).
//
// SAFETY: refuses unless every id resolves in the live snapshot, none is complete, and the job
// still has another incomplete visit in the window afterwards. Never leave a job with no visit.
//
// Usage: node delete-visits.mjs dry|live --visits=<snapshot.json> --ids='<num>:<reason>[;<num>:<reason>]'
// Records are separated by ';' — reasons routinely contain commas, and a comma separator silently
// turned one id into two on 2026-08-01 (the resolve guard caught it and aborted).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: dry|live --visits=<file> --ids=<num>:<reason>'); process.exit(1); }
const getArg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, getArg('visits')), 'utf8'));
// Split only where a ';' is followed by "<digits>:" — a record boundary. Reasons contain commas
// and semicolons freely, and a naive split turned one id into three on 2026-08-01 (twice). The
// resolve guard caught both, but the parser should not be the thing being guarded against.
const DELETE = Object.fromEntries(getArg('ids').split(/;(?=\d+:)/).filter(Boolean)
  .map(s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }));
if (!Object.keys(DELETE).length) { console.log('--ids required'); process.exit(1); }

const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
const num = id => { try { return Buffer.from(id, 'base64').toString('utf8').split('/').pop(); } catch { return null; } };

const idx = {}, perJob = {};
for (const v of V) {
  const n = num(v.id); if (!n) continue;
  idx[n] = v;
  (perJob[String(v.job?.jobNumber)] = perJob[String(v.job?.jobNumber)] || []).push({ n, complete: v.isComplete });
}

const targets = [], problems = [];
for (const [n, why] of Object.entries(DELETE)) {
  const v = idx[n];
  if (!v) { problems.push(`${n} — not in snapshot`); continue; }
  if (v.isComplete) { problems.push(`${n} — already COMPLETE, refusing`); continue; }
  const job = String(v.job?.jobNumber);
  const survivors = (perJob[job] || []).filter(s => s.n !== n && !DELETE[s.n] && !s.complete);
  if (!survivors.length) { problems.push(`${n} — would leave job ${job} with NO visit this week, refusing`); continue; }
  targets.push({ num: n, enc: v.id, job, title: v.title, startAt: v.startAt, why, keeps: survivors.map(s => s.n).join(',') });
}

for (const t of targets) console.log(`  del ${t.num}  ${pt(t.startAt).slice(0, 16)}  "${t.title}"  job ${t.job} — ${t.why}  [survivor ${t.keeps}]`);
if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p)); }
if (targets.length !== Object.keys(DELETE).length) { console.error('\n!! not every id resolved cleanly — ABORT'); process.exit(1); }
if (mode === 'dry') { console.log('\nDRY — nothing deleted.'); process.exit(0); }

const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
const tok = tr.access_token;
if (!tok) { console.error('no Jobber token', JSON.stringify(tr).slice(0, 200)); process.exit(1); }
let ok = 0, fail = 0;
for (const t of targets) {
  const r = await (await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2023-11-15' },
    body: JSON.stringify({ query: `mutation($ids:[EncodedId!]!){ visitDelete(visitIds:$ids){ userErrors{ message } } }`, variables: { ids: [t.enc] } }),
  })).json();
  const errs = r.errors || r.data?.visitDelete?.userErrors || [];
  if (errs.length) { fail++; console.log(`  FAIL ${t.num}: ${JSON.stringify(errs).slice(0, 160)}`); }
  else { ok++; console.log(`  deleted ${t.num}  (job ${t.job})`); }
  await new Promise(r => setTimeout(r, 450));
}
console.log(`\nDONE — deleted ${ok}, failed ${fail} of ${targets.length}`);
