/**
 * Search all n8n workflows for a string in their node JSON.
 * Read-only. Usage: node scripts/podcast/n8n-grep.cjs "<needle>"
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const base = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY };
const needle = (process.argv[2] || '').toLowerCase();
if (!needle) { console.log('usage: n8n-grep.cjs "<needle>"'); process.exit(1); }

(async () => {
  let wfs = [], cursor;
  do {
    const r = await fetch(`${base}/workflows?limit=100${cursor ? '&cursor=' + cursor : ''}`, { headers: H });
    const j = await r.json(); wfs = wfs.concat(j.data || []); cursor = j.nextCursor;
  } while (cursor);
  console.log(`scanning ${wfs.length} workflows for "${needle}"...\n`);
  for (const wf of wfs) {
    const r = await fetch(`${base}/workflows/${wf.id}`, { headers: H });
    const full = await r.json();
    const blob = JSON.stringify(full.nodes || []).toLowerCase();
    if (blob.includes(needle)) {
      const nodes = (full.nodes || []).filter(n => JSON.stringify(n).toLowerCase().includes(needle)).map(n => n.name);
      console.log(`HIT ${full.active ? '[active]' : '[off]   '} ${wf.id}  ${full.name}\n     nodes: ${nodes.join(', ')}`);
    }
  }
})().catch(e => console.log('ERR', e.message));
