/**
 * Dump a node's output JSON from the most recent execution of a workflow.
 * Read-only. Usage: node scripts/podcast/n8n-exec-dump.cjs <workflowId> <nodeNameSubstr>
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const base = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY };
const [wfId, sub] = process.argv.slice(2);
if (!wfId || !sub) { console.log('usage: n8n-exec-dump.cjs <workflowId> <nodeNameSubstr>'); process.exit(1); }

(async () => {
  const r = await fetch(`${base}/executions?workflowId=${wfId}&includeData=true&limit=3`, { headers: H });
  const j = await r.json();
  const execs = j.data || [];
  if (!execs.length) { console.log('no executions'); return; }
  for (const ex of execs) {
    const runData = ex.data?.resultData?.runData || {};
    const nodeName = Object.keys(runData).find(n => n.toLowerCase().includes(sub.toLowerCase()));
    console.log(`\n--- exec ${ex.id} (${ex.startedAt}) status=${ex.status} ---`);
    if (!nodeName) { console.log('  node not found; nodes ran:', Object.keys(runData).join(', ').slice(0, 200)); continue; }
    const out = runData[nodeName]?.[0]?.data?.main?.[0]?.[0]?.json;
    const full = JSON.stringify(out);
    // show only url/id/status/schedule-ish keys to find whether a YouTube URL exists yet
    const hits = full.match(/"[^"]*(url|youtube|videoId|video_id|status|scheduled|_id|id|state|link)[^"]*"\s*:\s*("[^"]*"|[^,}]+)/gi) || [];
    console.log(`  [${nodeName}] keys of interest:\n   ` + hits.slice(0, 40).join('\n   '));
  }
})().catch(e => console.log('ERR', e.message));
