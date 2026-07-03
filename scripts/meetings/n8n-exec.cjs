/** Inspect the latest n8n execution for a workflow id: prints status, the last
 *  node executed, and the error (node + message). Read-only.
 *  Run: node scripts/meetings/n8n-exec.cjs <workflowId> [n]
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
  const n = Number(process.argv[3] || 1);
  const list = await (await fetch(`${BASE}/executions?workflowId=${wfId}&limit=${n}&includeData=true`, { headers: H })).json();
  for (const ex of list.data || []) {
    console.log(`\n=== execution ${ex.id}  status=${ex.status}  finished=${ex.finished}  started=${ex.startedAt}`);
    const rd = ex.data?.resultData;
    if (!rd) { console.log('  (no resultData)'); continue; }
    console.log(`  lastNodeExecuted: ${rd.lastNodeExecuted}`);
    if (rd.error) {
      console.log(`  ERROR node: ${rd.error.node?.name || rd.error.node || '?'}`);
      console.log(`  ERROR message: ${rd.error.message}`);
      if (rd.error.description) console.log(`  desc: ${String(rd.error.description).slice(0, 400)}`);
      if (rd.error.stack) console.log(`  stack: ${String(rd.error.stack).slice(0, 600)}`);
    }
    // per-node error scan
    for (const [name, runs] of Object.entries(rd.runData || {})) {
      for (const run of runs) {
        if (run.error) console.log(`  node "${name}" error: ${run.error.message}`);
      }
    }
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
