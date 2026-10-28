// Traps currently in the ground, per active job and per responsible tech.
// Read-only. Source = the trap-inventory lines at the end of each tech visit note
// ("1 TL 2 VOOS foh", "2 v boh"). Responsible tech = assignee on the job's next
// scheduled visit; the tech who wrote the inventory note is reported alongside.
// Resumable caches: jobs.json, notes.json, visits.json (delete to refresh).
import fs from 'node:fs';
import { gql, sleep } from '../catch-tally/jb.mjs';
import { inventory, PULLED_ALL } from './parse.mjs';

const today = new Date().toISOString().slice(0, 10);
const cache = (f, fn) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;

// ---- stage 1: every non-archived job
let jobs = cache('jobs.json');
if (!jobs) {
  jobs = []; let cursor = null, page = 0;
  for (;;) {
    const a = cursor ? `, after: "${cursor}"` : '';
    const d = await gql(`query { jobs(first: 100${a}, filter: { status: active }) { pageInfo { hasNextPage endCursor }
      nodes { id jobNumber jobStatus title client { name } property { address { city postalCode } }
        lineItems(first: 5) { nodes { name } } } } }`);
    for (const n of d.jobs.nodes) jobs.push({ id: n.id, num: n.jobNumber, status: n.jobStatus, title: n.title,
      client: n.client?.name, city: n.property?.address?.city, zip: n.property?.address?.postalCode,
      items: n.lineItems.nodes.map(x => x.name) });
    process.stderr.write(`jobs page ${++page}: ${jobs.length}\n`);
    if (!d.jobs.pageInfo.hasNextPage) break;
    cursor = d.jobs.pageInfo.endCursor; await sleep(100);
  }
  fs.writeFileSync('jobs.json', JSON.stringify(jobs));
}

// ---- stage 2: last 10 notes per job
const nc = cache('notes.json') || { notes: {} };
const todo = jobs.filter(j => !nc.notes[j.id]);
for (let i = 0; i < todo.length; i += 20) {
  const chunk = todo.slice(i, i + 20);
  const d = await gql(`query { ${chunk.map((j, k) => `j${k}: job(id: ${JSON.stringify(j.id)}) {
    notes(last: 10) { nodes { __typename ... on JobNote { message createdAt createdBy { __typename ... on User { name { full } } } } } } }`).join(' ')} }`);
  chunk.forEach((j, k) => {
    nc.notes[j.id] = (d[`j${k}`]?.notes?.nodes || []).filter(n => n.__typename === 'JobNote')
      .map(n => ({ msg: n.message || '', at: n.createdAt, by: n.createdBy?.name?.full || 'Unknown' }))
      .sort((a, b) => b.at.localeCompare(a.at));
  });
  fs.writeFileSync('notes.json', JSON.stringify(nc));
  process.stderr.write(`notes ${Object.keys(nc.notes).length}/${jobs.length}\n`);
  await sleep(100);
}

// ---- stage 3: next scheduled visit per job (next 90 days) -> assignee
let next = cache('visits.json');
if (!next) {
  next = {}; let cursor = null, page = 0;
  const after = new Date().toISOString(), before = new Date(Date.now() + 90 * 864e5).toISOString();
  for (;;) {
    const a = cursor ? `, after: "${cursor}"` : '';
    const d = await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
      pageInfo { hasNextPage endCursor } nodes { startAt visitStatus job { id } assignedUsers(first: 3) { nodes { name { full } } } } } }`);
    for (const v of d.visits.nodes) {
      if (!v.job?.id || v.visitStatus === 'COMPLETED') continue;
      const cur = next[v.job.id];
      if (!cur || v.startAt < cur.at) next[v.job.id] = { at: v.startAt, techs: v.assignedUsers.nodes.map(u => u.name.full) };
    }
    process.stderr.write(`visits page ${++page}\n`);
    if (!d.visits.pageInfo.hasNextPage) break;
    cursor = d.visits.pageInfo.endCursor; await sleep(100);
  }
  fs.writeFileSync('visits.json', JSON.stringify(next));
}

const rows = [];
for (const j of jobs) {
  const ns = nc.notes[j.id] || [];
  let src = null, inv = null, idx = -1;
  for (let i = 0; i < ns.length; i++) {
    if (PULLED_ALL.test(ns[i].msg)) { src = ns[i]; inv = { tl: 0, v: 0, total: 0, lines: [] }; idx = i; break; }
    const x = inventory(ns[i].msg);
    if (x.total > 0) { src = ns[i]; inv = x; idx = i; break; }
  }
  const nv = next[j.id];
  rows.push({ job: j.num, client: j.client, city: j.city, status: j.status,
    product: /total mole control/i.test(j.items.join('|')) ? 'TMCP' : /quick fix/i.test(j.items.join('|')) ? 'Quick Fix' : 'Other',
    traps: inv?.total ?? null, tl: inv?.tl ?? null, victor: inv?.v ?? null,
    responsible: nv?.techs.join(' + ') || null, nextVisit: nv?.at?.slice(0, 10) || null,
    noteBy: src?.by || null, noteAt: src?.at?.slice(0, 10) || null,
    stale: idx > 0, // inventory came from an older note than the latest
    latestNoteAt: ns[0]?.at?.slice(0, 10) || null, lines: inv?.lines || [] });
}

fs.writeFileSync(`${today}_trap-inventory.json`, JSON.stringify(rows, null, 1));
const tech = new Map();
for (const r of rows) {
  const who = r.responsible || `(no visit in 90d) last: ${r.noteBy || '?'}`;
  const t = tech.get(who) || { jobs: 0, jobsWithTraps: 0, traps: 0, tl: 0, victor: 0, unknown: 0 };
  t.jobs++;
  if (r.traps == null) t.unknown++; else { t.traps += r.traps; t.tl += r.tl; t.victor += r.victor; if (r.traps) t.jobsWithTraps++; }
  tech.set(who, t);
}
const sum = k => rows.reduce((a, r) => a + (r[k] || 0), 0);
console.log(JSON.stringify({
  activeJobs: rows.length, withInventory: rows.filter(r => r.traps != null).length,
  unknown: rows.filter(r => r.traps == null).length, staleSource: rows.filter(r => r.stale).length,
  traps: sum('traps'), tl: sum('tl'), victor: sum('victor'),
  byStatus: Object.fromEntries([...new Set(rows.map(r => r.status))].map(s => [s, rows.filter(r => r.status === s).length])),
  byTech: Object.fromEntries([...tech].sort((a, b) => b[1].traps - a[1].traps)),
}, null, 1));
