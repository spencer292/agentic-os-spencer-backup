/** Dump a node's output items for a workflow's latest execution(s). Read-only.
 *  Run: node scripts/meetings/n8n-node-out.cjs <workflowId> "<Node Name>" [n]
 *  Polls until the latest execution is finished, then prints each emitted item's
 *  date / title / transcript length / _meta (no secrets).
 */
const fs = require('fs');
const path = require('path');
const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, accept: 'application/json' };

(async () => {
  const wfId = process.argv[2];
  const node = process.argv[3];
  const n = Number(process.argv[4] || 1);
  let ex;
  for (let i = 0; i < 20; i++) {
    const j = await (await fetch(`${BASE}/executions?workflowId=${wfId}&limit=${n}&includeData=true`, { headers: H })).json();
    ex = (j.data || [])[0];
    if (ex && ex.finished) break;
    await new Promise(r => setTimeout(r, 3000));
  }
  if (!ex) { console.log('no execution found'); return; }
  console.log(`execution ${ex.id}  status=${ex.status}  finished=${ex.finished}  started=${ex.startedAt}`);
  const rd = ex.data && ex.data.resultData;
  console.log('lastNode:', rd && rd.lastNodeExecuted);
  if (rd && rd.error) console.log('ERROR:', (rd.error.node && rd.error.node.name) || rd.error.node, '—', rd.error.message);
  const runs = (rd && rd.runData && rd.runData[node]) || [];
  if (!runs.length) { console.log(`(no runData for node "${node}")`); return; }
  for (const run of runs) {
    if (run.error) console.log(`node error: ${run.error.message}`);
    const out = ((run.data && run.data.main) || [])[0] || [];
    console.log(`"${node}" emitted ${out.length} item(s):`);
    for (const it of out) {
      const j = it.json || {};
      const t = j.transcript != null ? ` | tx=${String(j.transcript).length}ch` : '';
      const meta = j._meta ? ` | ${JSON.stringify(j._meta)}` : '';
      console.log(`  - ${j.date || ''}  ${(j.title || '').slice(0, 55)}${t}${meta}`);
    }
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
