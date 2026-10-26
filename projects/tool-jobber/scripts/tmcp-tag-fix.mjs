// tmcp-tag-fix.mjs — applies Spencer-approved TMCP tag fixes from an audit run.
// Re-reads every client live immediately before writing (records move mid-run), skips any whose
// state no longer matches the audit, and prints before/after tags. clientEdit tagsToAdd/tagsToDelete
// are additive/subtractive only — no other tag is touched.
// Usage: node projects/tool-jobber/scripts/tmcp-tag-fix.mjs <YYYY-MM-DD audit> [--execute]
//   default is a dry run. Adds `TMCP - Active` to every missingTagDetail client that has no
//   Churned tag (skips SKIP_JOBS), and flips taggedNoJobDetail clients Active -> Churned.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const dataDir = path.resolve(here, '..', 'data');
const API = path.join(root, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const RUN = process.argv[2];
const EXECUTE = process.argv.includes('--execute');
const ACTIVE = 'TMCP - Active', CHURNED = 'TMCP Churned';
const SKIP_JOBS = new Set([8219]); // Trent Bryan: semi-annual exception, deliberately untagged
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmcp-tagfix-'));

function gql(query) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  let out;
  try { out = execSync(`node "${API}" query "${f}"`, { encoding: 'utf8', cwd: root, maxBuffer: 16 * 1024 * 1024 }); }
  catch (e) { out = String(e.stdout || e.message); }
  const i = out.indexOf('{');
  if (i < 0 || /GraphQL errors/i.test(out)) throw new Error(out.slice(0, 300));
  return JSON.parse(out.slice(i));
}
const live = (id) => gql(`query { client(id: "${id}") { name tags(first: 25) { nodes { label } }
  jobs(first: 30) { nodes { jobNumber jobStatus lineItems(first: 10) { nodes { name } } } } } }`).client;
const labels = (c) => c.tags.nodes.map((t) => t.label);
const liveTmcp = (c) => c.jobs.nodes.filter((j) => j.jobStatus !== 'archived'
  && j.lineItems.nodes.some((n) => /total mole control/i.test(n.name || '')));
const edit = (id, add, del) => gql(`mutation { clientEdit(clientId: "${id}", input: {
  ${add.length ? `tagsToAdd: ${JSON.stringify(add)}` : ''} ${del.length ? `tagsToDelete: ${JSON.stringify(del)}` : ''} }) {
  client { tags(first: 25) { nodes { label } } } userErrors { message path } } }`).clientEdit;

const r = JSON.parse(fs.readFileSync(path.join(dataDir, `${RUN}_tmcp-billing-audit.json`), 'utf8'));
const plan = [
  ...r.missingTagDetail.filter((x) => !SKIP_JOBS.has(x.job) && !x.hasChurnedTag)
    .map((x) => ({ kind: 'add-active', id: x.clientId, label: `#${x.job} ${x.client}` })),
  ...r.taggedNoJobDetail.map((x) => ({ kind: 'flip-churned', id: x.clientId, label: x.client })),
];
console.log(`${EXECUTE ? 'EXECUTE' : 'DRY RUN'}: ${plan.length} clients\n`);

let done = 0, skipped = 0, failed = 0;
for (const p of plan) {
  const c = live(p.id);
  const before = labels(c), jobs = liveTmcp(c);
  let add = [], del = [], why = null;
  if (p.kind === 'add-active') {
    if (before.includes(ACTIVE)) why = 'already tagged';
    else if (before.includes(CHURNED)) why = 'now tagged Churned';
    else if (!jobs.length) why = 'no live TMCP job any more';
    else add = [ACTIVE];
  } else {
    if (jobs.length) why = `live TMCP job #${jobs[0].jobNumber} reappeared`;
    else { add = before.includes(CHURNED) ? [] : [CHURNED]; del = before.includes(ACTIVE) ? [ACTIVE] : []; }
    if (!why && !add.length && !del.length) why = 'already correct';
  }
  if (why) { console.log(`SKIP ${p.label}: ${why}`); skipped++; continue; }
  if (!EXECUTE) { console.log(`WOULD ${p.label}: +[${add}] -[${del}]  (now: ${before.join(' | ') || 'none'})`); continue; }
  const res = edit(p.id, add, del);
  const after = (res.client?.tags?.nodes || []).map((t) => t.label);
  const ok = !res.userErrors?.length && add.every((t) => after.includes(t)) && del.every((t) => !after.includes(t));
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${p.label}: ${before.join(' | ') || 'none'}  ->  ${after.join(' | ')}${res.userErrors?.length ? '  ' + JSON.stringify(res.userErrors) : ''}`);
  ok ? done++ : failed++;
  execSync(process.platform === 'win32' ? 'ping -n 2 127.0.0.1 > nul' : 'sleep 0.4');
}
console.log(`\ndone ${done}, skipped ${skipped}, failed ${failed}`);
