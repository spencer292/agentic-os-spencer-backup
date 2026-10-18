// READ-ONLY. Fetch Jobber quotes + jobs (with client phones) created in a window, so
// unanswered CallRail calls can be matched to whether the caller ever bought.
//
//   node projects/briefs/callrail-faq/scripts/missed-call-outcomes.mjs 2026-08-10
//
// Writes data/missed-call-jobber-<since>.json. Never mutates anything.
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

const API = path.resolve('.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const SINCE = process.argv[2] || '2026-08-10';
const OUT = path.resolve(`projects/briefs/callrail-faq/data/missed-call-jobber-${SINCE}.json`);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function gql(q, attempt = 0) {
  try {
    return JSON.parse(execFileSync('node', [API, 'query', q], { maxBuffer: 1 << 28 }).toString());
  } catch (e) {
    const msg = `${e.stderr || ''}${e.stdout || ''}`;
    if (/THROTTLED/i.test(msg) && attempt < 7) { sleep(6000 * 2 ** attempt); return gql(q, attempt + 1); }
    throw new Error('Jobber query failed: ' + msg.slice(0, 400));
  }
}
function pageAll(root, selection, filter) {
  const out = []; let cursor = null;
  for (let p = 0; p < 80; p++) {
    const after = cursor ? `, after: ${JSON.stringify(cursor)}` : '';
    const d = gql(`query { ${root}(first: 50${after}, filter: ${filter}) { nodes { ${selection} } pageInfo { hasNextPage endCursor } } }`);
    out.push(...d[root].nodes);
    if (!d[root].pageInfo.hasNextPage) break;
    cursor = d[root].pageInfo.endCursor; sleep(1200);
  }
  return out;
}
const range = `{ createdAt: { after: "${SINCE}T00:00:00Z" } }`;
const client = 'client { id name createdAt phones { number } }';
const quotes = pageAll('quotes', `quoteNumber quoteStatus createdAt amounts { total } ${client}`, range);
process.stderr.write(`${quotes.length} quotes\n`);
const jobs = pageAll('jobs', `jobNumber jobStatus createdAt total ${client} lineItems(first: 3) { nodes { name } }`, range);
process.stderr.write(`${jobs.length} jobs\n`);
writeFileSync(OUT, JSON.stringify({ since: SINCE, quotes, jobs }));
process.stderr.write(`-> ${OUT}\n`);
