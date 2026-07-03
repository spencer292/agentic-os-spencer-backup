/**
 * Inspect an n8n workflow: trigger(s), gates (IF/Filter/Switch), Notion reads/writes.
 * Read-only. Usage: node scripts/podcast/n8n-inspect.cjs <workflowId>
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const base = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY };
const id = process.argv[2];
const detail = (process.argv[3] || '').toLowerCase();
if (!id) { console.log('usage: n8n-inspect.cjs <workflowId> [nodeNameSubstr]'); process.exit(1); }

(async () => {
  const r = await fetch(`${base}/workflows/${id}`, { headers: H });
  const w = await r.json();
  if (!r.ok) { console.log('FAIL', r.status, JSON.stringify(w).slice(0, 200)); return; }
  if (detail === 'conns') {
    console.log(`${w.name} — connections\n`);
    for (const [from, outs] of Object.entries(w.connections || {})) {
      (outs.main || []).forEach((branch, bi) => {
        (branch || []).forEach((c) => console.log(`  ${from} [out${bi}] -> ${c.node} [in${c.index}]`));
      });
    }
    return;
  }
  if (detail) {
    for (const n of w.nodes) if (n.name.toLowerCase().includes(detail)) {
      console.log(`### ${n.name} (${n.type}) v${n.typeVersion}`);
      if (n.credentials) console.log('  credentials: ' + JSON.stringify(n.credentials));
      console.log(JSON.stringify(n.parameters, null, 1));
    }
    return;
  }
  console.log(`${w.name}  (active:${w.active}, ${w.nodes.length} nodes)\n`);
  for (const n of w.nodes) {
    const t = n.type.replace('n8n-nodes-base.', '');
    let extra = '';
    if (/scheduleTrigger|cron|interval/i.test(t)) {
      const rule = JSON.stringify(n.parameters?.rule || n.parameters || {});
      extra = ' [TRIGGER] ' + rule.slice(0, 160);
    }
    if (/webhook/i.test(t)) extra = ' [WEBHOOK ' + (n.parameters?.path || '') + ']';
    if (/^if|^filter|switch/i.test(t)) extra = ' [GATE] ' + JSON.stringify(n.parameters?.conditions || n.parameters || {}).slice(0, 320);
    const params = JSON.stringify(n.parameters || {});
    if (/notion/i.test(n.type) || /api\.notion/i.test(params)) {
      const op = (n.parameters?.operation || '') + '/' + (n.parameters?.resource || '');
      extra += ' [NOTION ' + op + ']';
    }
    if (/youtube|getlate|zernio/i.test(params)) extra += ' [PUBLISH]';
    console.log(`  (${t}) ${n.name}${extra}`);
  }
})().catch(e => console.log('ERR', e.message));
