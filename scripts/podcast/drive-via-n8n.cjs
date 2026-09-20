/**
 * Reusable Google Drive API caller, routed through a throwaway n8n workflow so it
 * can use the n8n "Google Docs account 4" credential (which has Drive scope) —
 * we have no local Drive OAuth. Spins a temp webhook workflow with one httpRequest
 * node hitting the Drive API, triggers it, prints the JSON, deletes the temp wf.
 *
 * Usage:
 *   node scripts/podcast/drive-via-n8n.cjs GET  "<url>"
 *   node scripts/podcast/drive-via-n8n.cjs POST "<url>" '{"json":"body"}'
 * Always append supportsAllDrives=true&includeItemsFromAllDrives=true for shared drives.
 */
const fs = require('fs');
const { runTempWorkflow, hookNode, httpNode } = require('../lib/n8n-temp-workflow.cjs');

const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const METHOD = (process.argv[2] || 'GET').toUpperCase();
const URL = process.argv[3];
const BODY = process.argv[4]; // optional JSON string
if (!URL) { console.log('usage: drive-via-n8n.cjs <METHOD> "<url>" [jsonBody]'); process.exit(1); }

// Lifecycle AND teardown live in scripts/lib/n8n-temp-workflow.cjs. Do not re-inline this.
(async () => {
  const out = await runTempWorkflow({
    apiKey: env.N8N_API_KEY,
    tag: 'drive',
    attempts: 6,
    buildNodes: (hookPath) => [
      hookNode(hookPath),
      httpNode({ method: METHOD, url: URL, jsonBody: BODY, id: 'call', name: 'Drive' }),
    ],
    connections: { Hook: { main: [[{ node: 'Drive', type: 'main', index: 0 }]] } },
  });
  try { console.log(JSON.stringify(JSON.parse(out), null, 1)); }
  catch { console.log(out.slice(0, 1200)); }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
