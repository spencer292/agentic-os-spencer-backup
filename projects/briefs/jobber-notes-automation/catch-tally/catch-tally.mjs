// Mole catches by tech for a date window, from Jobber job notes (the tech's visit checklist).
// Attribution = note.createdBy (the tech who wrote it). Resumable: stage1.json + notes.json.
import fs from 'node:fs';
import { gql, sleep, ptDayBoundsUtc } from './jb.mjs';

const FROM = process.argv[2] || '2026-08-01';
const TO   = process.argv[3] || '2026-08-31';
const { after } = ptDayBoundsUtc(FROM);
const { before } = ptDayBoundsUtc(TO);

// ---- stage 1: page the window's visits -> job ids + completed-visit counts per tech
let jobIds = [], visitsByTech = new Map(), total = 0;
if (fs.existsSync('stage1.json')) {
  const s = JSON.parse(fs.readFileSync('stage1.json', 'utf8'));
  jobIds = s.jobIds; visitsByTech = new Map(s.visitsByTech); total = s.total;
  process.stderr.write(`stage1 cached: ${total} visits, ${jobIds.length} jobs\n`);
} else {
  const set = new Set();
  let cursor = null, page = 0;
  for (;;) {
    page++;
    const a = cursor ? `, after: "${cursor}"` : '';
    const d = await gql(`query { visits(first: 100${a}, filter: { startAt: { after: "${after}", before: "${before}" } }) {
      pageInfo { hasNextPage endCursor }
      nodes { visitStatus completedBy job { id } } } }`);
    const v = d.visits;
    for (const n of v.nodes) {
      total++;
      if (n.job?.id) set.add(n.job.id);
      if (n.visitStatus === 'COMPLETED') {
        const who = n.completedBy || 'Unassigned';
        visitsByTech.set(who, (visitsByTech.get(who) || 0) + 1);
      }
    }
    process.stderr.write(`visits page ${page}: ${total} visits, ${set.size} jobs\n`);
    if (!v.pageInfo.hasNextPage) break;
    cursor = v.pageInfo.endCursor;
    await sleep(120);
  }
  jobIds = [...set];
  fs.writeFileSync('stage1.json', JSON.stringify({ jobIds, visitsByTech: [...visitsByTech], total }));
}

// ---- stage 2: batch-fetch notes for those jobs (resumable)
const CHUNK = 20;
let notes = {}, doneJobs = new Set();
if (fs.existsSync('notes.json')) {
  const s = JSON.parse(fs.readFileSync('notes.json', 'utf8'));
  notes = s.notes; doneJobs = new Set(s.doneJobs);
  process.stderr.write(`notes cached: ${Object.keys(notes).length} notes, ${doneJobs.size} jobs done\n`);
}
const todo = jobIds.filter(id => !doneJobs.has(id));
for (let i = 0; i < todo.length; i += CHUNK) {
  const chunk = todo.slice(i, i + CHUNK);
  const q = `query { ${chunk.map((id, k) => `j${k}: job(id: ${JSON.stringify(id)}) { jobNumber client { name }
    notes(last: 8) { nodes { __typename ... on JobNote { id message createdAt createdBy { __typename ... on User { name { full } } } } } } }`).join(' ')} }`;
  const d = await gql(q);
  for (const key of Object.keys(d)) {
    const job = d[key]; if (!job) continue;
    for (const n of (job.notes?.nodes || [])) {
      if (n.__typename !== 'JobNote' || !n.id) continue;
      if (n.createdAt < after || n.createdAt >= before) continue;
      notes[n.id] = { msg: n.message || '', at: n.createdAt, by: n.createdBy?.name?.full || 'Unknown', job: job.jobNumber, client: job.client?.name };
    }
  }
  for (const id of chunk) doneJobs.add(id);
  fs.writeFileSync('notes.json', JSON.stringify({ notes, doneJobs: [...doneJobs] }));
  process.stderr.write(`jobs ${doneJobs.size}/${jobIds.length} — ${Object.keys(notes).length} notes in window\n`);
  await sleep(120);
}

// ---- stage 3: parse catches, line-aware (multi-site notes list a catch per site)
function molesInNote(msg) {
  let sum = 0; const hits = [];
  for (const raw of String(msg).split(/[\n\r]+/)) {
    const l = raw.replace(/\s+/g, ' ').trim();
    if (!l) continue;
    if (/\bno\s*(mole|catch|caught)/i.test(l)) continue;
    const m = l.match(/(\d+)\s*moles?\b/i) || l.match(/(\d+)\s*(?:caught|catch(?:es)?)\b/i) || l.match(/\bcaught\s*(\d+)\b/i);
    if (m) { sum += +m[1]; if (+m[1] > 0) hits.push(`${l} => ${+m[1]}`); }
  }
  return { sum, hits };
}

const byTech = new Map(); const rows = [];
for (const n of Object.values(notes)) {
  const { sum, hits } = molesInNote(n.msg);
  const t = byTech.get(n.by) || { moles: 0, notes: 0, notesWithCatch: 0 };
  t.moles += sum; t.notes++; if (sum > 0) t.notesWithCatch++;
  byTech.set(n.by, t);
  if (sum > 0) rows.push({ ...n, moles: sum, hits });
}
const out = {
  window: { from: FROM, to: TO },
  totals: { visits: total, jobs: jobIds.length, notes: Object.keys(notes).length, moles: [...byTech.values()].reduce((a, b) => a + b.moles, 0) },
  byTech: [...byTech.entries()].map(([tech, v]) => ({ tech, ...v, completedVisits: visitsByTech.get(tech) || 0,
    molesPerNote: +(v.moles / Math.max(1, v.notes)).toFixed(2), catchRate: +(100 * v.notesWithCatch / Math.max(1, v.notes)).toFixed(1) }))
    .sort((a, b) => b.moles - a.moles),
  visitsByTech: [...visitsByTech.entries()].sort((a, b) => b[1] - a[1]),
  catches: rows.sort((a, b) => b.moles - a.moles),
};
fs.writeFileSync('catches.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ window: out.window, totals: out.totals, byTech: out.byTech, visitsByTech: out.visitsByTech }, null, 1));
