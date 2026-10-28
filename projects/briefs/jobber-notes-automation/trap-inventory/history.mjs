// Month-by-month traps in the ground, from full job-note history. Read-only.
// At each month start D, a job is open if it started on/before D and (if archived) closed after D.
// Its traps = the latest inventory note written before D ("pulled all/closed" -> 0).
// Separately tracks traps LEFT on jobs that closed with traps still listed and no pull recorded.
// Caches: hist-jobs.json, hist-notes.json (delete to refresh).
import fs from 'node:fs';
import { gql, sleep } from '../catch-tally/jb.mjs';
import { inventory, PULLED_ALL, PULLED_ANY } from './parse.mjs';

const SINCE = process.argv[2] || '2023-10-01';
// Windows can briefly lock a file another process is scanning — retry the write
const save = async (f, o) => { for (let i = 0; ; i++) { try { return fs.writeFileSync(f, JSON.stringify(o)); } catch (e) { if (i > 5) throw e; await sleep(1000); } } };
const cache = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
const FIELDS = 'id jobNumber jobStatus startAt createdAt completedAt endAt';

// ---- stage 1: jobs open at any point since SINCE
let jobs = cache('hist-jobs.json');
if (!jobs) {
  const byId = new Map();
  const after = new Date(`${SINCE}T08:00:00Z`).toISOString();
  for (const filter of ['status: active', `status: archived, completedAt: { after: "${after}" }`, `status: archived, endAt: { after: "${after}" }`]) {
    let cursor = null, page = 0;
    for (;;) {
      const a = cursor ? `, after: "${cursor}"` : '';
      const d = await gql(`query { jobs(first: 100${a}, filter: { ${filter} }) { pageInfo { hasNextPage endCursor } nodes { ${FIELDS} } } }`);
      for (const n of d.jobs.nodes) byId.set(n.id, n);
      process.stderr.write(`jobs [${filter.slice(0, 30)}] page ${++page}: ${byId.size}\n`);
      if (!d.jobs.pageInfo.hasNextPage) break;
      cursor = d.jobs.pageInfo.endCursor; await sleep(100);
    }
  }
  jobs = [...byId.values()];
  fs.writeFileSync('hist-jobs.json', JSON.stringify(jobs));
}

// ---- stage 2: every note on every job (paginated)
const nc = cache('hist-notes.json') || { notes: {} };
const noteQ = (id, a = '') => `job(id: ${JSON.stringify(id)}) { notes(first: 50${a}) { pageInfo { hasNextPage endCursor }
  nodes { __typename ... on JobNote { message createdAt } } } }`;
const keep = nodes => nodes.filter(n => n.__typename === 'JobNote').map(n => ({ at: n.createdAt, msg: n.message || '' }));
const todo = jobs.filter(j => !nc.notes[j.id]);
for (let i = 0; i < todo.length; i += 10) {
  const chunk = todo.slice(i, i + 10);
  const d = await gql(`query { ${chunk.map((j, k) => `j${k}: ${noteQ(j.id)}`).join(' ')} }`);
  for (let k = 0; k < chunk.length; k++) {
    let conn = d[`j${k}`]?.notes; const all = keep(conn?.nodes || []);
    while (conn?.pageInfo?.hasNextPage) {
      const more = await gql(`query { j: ${noteQ(chunk[k].id, `, after: "${conn.pageInfo.endCursor}"`)} }`);
      conn = more.j?.notes; all.push(...keep(conn?.nodes || []));
    }
    nc.notes[chunk[k].id] = all.sort((a, b) => a.at.localeCompare(b.at));
  }
  if ((i / 10) % 5 === 0 || i + 10 >= todo.length) await save('hist-notes.json', nc);
  process.stderr.write(`notes ${Object.keys(nc.notes).length}/${jobs.length}\n`);
  await sleep(100);
}
await save('hist-notes.json', nc);

// ---- stage 3: per-job inventory timeline (ascending): [{at, tl, v}] and close state
const clients = cache('hist-clients.json') || {}; // from hist-clients.mjs
const tl = new Map();
for (const j of jobs) {
  const ev = [];
  for (const n of nc.notes[j.id] || []) {
    if (PULLED_ALL.test(n.msg)) { ev.push({ at: n.at, tl: 0, v: 0 }); continue; }
    const x = inventory(n.msg);
    if (x.total > 0) ev.push({ at: n.at, tl: x.tl, v: x.v });
    else if (PULLED_ANY.test(n.msg) && n === (nc.notes[j.id] || []).at(-1)) ev.push({ at: n.at, tl: 0, v: 0 });
  }
  const start = j.startAt || j.createdAt;
  const close = j.jobStatus === 'archived' ? (j.completedAt || j.endAt) : null;
  const notes = nc.notes[j.id] || [];
  const lastNote = notes.at(-1);
  // closed with traps still listed on its final note and no pull on it
  let left = null;
  if (close && lastNote) {
    const x = inventory(lastNote.msg);
    if (!PULLED_ALL.test(lastNote.msg) && !(PULLED_ANY.test(lastNote.msg) && x.total === 0) && x.total > 0) left = { tl: x.tl, v: x.v };
  }
  tl.set(j.id, { start, close, ev, left, client: clients[j.id] });
}
// a closed job whose client has a LATER job (renewal, Quick Fix -> TMCP) carried its traps over — not left behind
for (const [id, s] of tl) {
  if (!s.left) continue;
  s.carried = [...tl].some(([id2, o]) => id2 !== id && o.client && o.client === s.client && o.start > s.start);
}

// ---- stage 4: month-start snapshots
const months = [];
for (let d = new Date(`${SINCE}T08:00:00Z`); d <= new Date(); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 8))) months.push(d.toISOString());
months.push(new Date().toISOString());
const rows = months.map(D => {
  let open = 0, known = 0, v = 0, t = 0, stale = 0, leftV = 0, leftT = 0, leftJobs = 0;
  for (const s of tl.values()) {
    if (s.close && s.close <= D && s.close >= `${SINCE}T00:00:00Z` && s.left && !s.carried) { leftV += s.left.v; leftT += s.left.tl; leftJobs++; }
    if (!s.start || s.start > D || (s.close && s.close <= D)) continue;
    open++;
    let e = null; for (const x of s.ev) { if (x.at < D) e = x; else break; }
    if (!e) continue;
    known++; v += e.v; t += e.tl;
    if (Date.parse(D) - Date.parse(e.at) > 120 * 864e5) stale++;
  }
  return { date: D.slice(0, 10), openJobs: open, jobsWithCount: known, staleOver120d: stale, victorInGround: v, tlInGround: t,
    victorLeftOnClosedJobs: leftV, tlLeftOnClosedJobs: leftT, closedJobsWithTrapsLeft: leftJobs };
});
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(`${today}_trap-history.json`, JSON.stringify(rows, null, 1));
console.table(rows);
