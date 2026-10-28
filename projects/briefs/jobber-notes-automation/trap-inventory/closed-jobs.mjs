// Traps possibly left behind on jobs archived since SINCE (default 2026-03-01).
// Read-only. For each archived job, reads its notes newest-first:
//   pulled      — the last note records a pull (or "pulled all/closed") and lists no traps left
//   left        — the last note still lists traps in the ground (no pull recorded after it)
//   unconfirmed — the last note says neither; traps come from the latest older inventory note
//   no-notes    — nothing to read
// Caches: closed-jobs.json, closed-notes.json (delete to refresh).
import fs from 'node:fs';
import { gql, sleep } from '../catch-tally/jb.mjs';
import { inventory, PULLED_ALL, PULLED_ANY } from './parse.mjs';

const SINCE = process.argv[2] || '2026-03-01';
const after = new Date(`${SINCE}T08:00:00Z`).toISOString();
const today = new Date().toISOString().slice(0, 10);
const cache = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;

// ---- stage 1: archived jobs completed OR ended since SINCE (union)
let jobs = cache('closed-jobs.json');
if (!jobs) {
  const byId = new Map();
  for (const field of ['completedAt', 'endAt']) {
    let cursor = null, page = 0;
    for (;;) {
      const a = cursor ? `, after: "${cursor}"` : '';
      const d = await gql(`query { jobs(first: 100${a}, filter: { status: archived, ${field}: { after: "${after}" } }) {
        pageInfo { hasNextPage endCursor }
        nodes { id jobNumber completedAt endAt client { name } property { address { city } } lineItems(first: 5) { nodes { name } } } } }`);
      for (const n of d.jobs.nodes) byId.set(n.id, { id: n.id, num: n.jobNumber, completedAt: n.completedAt, endAt: n.endAt,
        client: n.client?.name, city: n.property?.address?.city, items: n.lineItems.nodes.map(x => x.name) });
      process.stderr.write(`${field} page ${++page}: ${byId.size}\n`);
      if (!d.jobs.pageInfo.hasNextPage) break;
      cursor = d.jobs.pageInfo.endCursor; await sleep(100);
    }
  }
  jobs = [...byId.values()];
  fs.writeFileSync('closed-jobs.json', JSON.stringify(jobs));
}

// ---- stage 2: last 10 notes per job
const nc = cache('closed-notes.json') || { notes: {} };
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
  fs.writeFileSync('closed-notes.json', JSON.stringify(nc));
  process.stderr.write(`notes ${Object.keys(nc.notes).length}/${jobs.length}\n`);
  await sleep(100);
}

// ---- classify
// a client who still has an active job most likely had the traps carried over (QF -> TMCP,
// "Going annual", "Sold a month") — those traps are already in trap-inventory.mjs's count
const activeClients = new Set((cache('jobs.json') || []).map(j => j.client?.trim().toLowerCase()));
const rows = [];
for (const j of jobs) {
  const ns = nc.notes[j.id] || [];
  const last = ns[0];
  let state, src = null, inv = { tl: 0, v: 0, total: 0, lines: [] };
  const lostOnClose = last ? inventory(last.msg) : { lost: 0, lostLines: [] };
  if (!last) state = 'no-notes';
  else {
    const li = inventory(last.msg);
    if (PULLED_ALL.test(last.msg) || (PULLED_ANY.test(last.msg) && li.total === 0)) { state = 'pulled'; src = last; }
    else if (li.total > 0) { state = 'left'; src = last; inv = li; }
    else {
      state = 'unconfirmed';
      for (const n of ns.slice(1)) {
        if (PULLED_ALL.test(n.msg)) break;
        const x = inventory(n.msg);
        if (x.total > 0) { src = n; inv = x; break; }
      }
      if (!src) state = 'no-inventory';
    }
  }
  if (inv.total > 0 && activeClients.has(j.client?.trim().toLowerCase())) state = 'converted';
  const items = j.items.join('|');
  rows.push({ job: j.num, client: j.client, city: j.city,
    product: /total mole control/i.test(items) ? 'TMCP' : /quick fix/i.test(items) ? 'Quick Fix' : 'Other',
    closed: (j.completedAt || j.endAt || '').slice(0, 10), state,
    traps: inv.total, tl: inv.tl, victor: inv.v, lost: lostOnClose.lost, lostLines: lostOnClose.lostLines,
    noteBy: src?.by || last?.by || null, noteAt: (src || last)?.at?.slice(0, 10) || null,
    lastNote: last ? last.msg.replace(/\s+/g, ' ').slice(0, 140) : '', lines: inv.lines });
}
fs.writeFileSync(`${today}_closed-jobs-traps.json`, JSON.stringify(rows, null, 1));

const agg = (filter, key) => { const m = {}; for (const r of rows.filter(filter)) { const t = m[r[key]] ||= { jobs: 0, traps: 0, tl: 0, victor: 0 }; t.jobs++; t.traps += r.traps; t.tl += r.tl; t.victor += r.victor; } return m; };
const out = rows.filter(r => r.traps > 0 && r.state !== 'converted');
console.log(JSON.stringify({
  since: SINCE, archivedJobs: rows.length,
  byState: agg(() => true, 'state'),
  recordedLost: { jobs: rows.filter(r => r.lost).length, traps: rows.reduce((a, r) => a + r.lost, 0) },
  trapsPossiblyOut: { jobs: out.length, traps: out.reduce((a, r) => a + r.traps, 0), victor: out.reduce((a, r) => a + r.victor, 0), tl: out.reduce((a, r) => a + r.tl, 0) },
  outByTech: agg(r => r.traps > 0 && r.state !== 'converted', 'noteBy'),
  outByProduct: agg(r => r.traps > 0 && r.state !== 'converted', 'product'),
}, null, 1));
