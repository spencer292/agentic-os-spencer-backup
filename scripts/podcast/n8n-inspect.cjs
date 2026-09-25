/**
 * Inspect an n8n workflow: trigger(s), gates (IF/Filter/Switch), Notion reads/writes.
 * Read-only. Usage: node scripts/podcast/n8n-inspect.cjs <workflowId>
 *
 * OUTPUT IS REDACTED (2026-08-12). This estate has ~133 credentials pasted directly
 * into node parameters — Bearer tokens in headers, API keys in URLs, secrets in Code
 * nodes. Printing a node's raw parameters therefore prints live credentials to the
 * terminal, into logs, and into any agent transcript. That happened: inspecting
 * `Chain Publisher` printed its hardcoded Notion token in full, and the token had to
 * be rotated. Anything this script prints now goes through scrub() first.
 * If you genuinely need a raw value, read it in the n8n UI — not through a tool whose
 * output gets captured.
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

// Keep in step with scripts/admin/n8n-export-estate.cjs.
const SECRET_PATTERNS = [
  /\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}/g,
  /\bntn_[A-Za-z0-9]{20,}/g,                       // Notion internal integration token
  /\bsecret_[A-Za-z0-9]{20,}/g,                    // Notion (legacy)
  /\bghp_[A-Za-z0-9]{20,}/g,
  /\bAIza[A-Za-z0-9_-]{20,}/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,
  /\bBearer\s+[A-Za-z0-9._-]{16,}/gi,
  /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,
  /\b[a-f0-9]{32,}\b/gi,
];
const NAMED_ASSIGNMENT =
  /((?:[A-Za-z_][A-Za-z0-9_]*)?(?:SECRET|TOKEN|API[_-]?KEY|APIKEY|PASSWORD|SIGNATURE|HMAC|AUTH|CREDENTIAL)[A-Za-z0-9_]*)(\s*[:=]\s*)(['"])([^'"\s]{8,})\3/gi;

function scrub(s) {
  let out = String(s);
  out = out.replace(NAMED_ASSIGNMENT, (m, n, sep, q, v) =>
    (/^=?\{\{|^\$/.test(v) ? m : `${n}${sep}${q}[REDACTED:${v.length}chars]${q}`));
  for (const re of SECRET_PATTERNS) out = out.replace(re, (m) => `[REDACTED:${m.length}chars]`);
  return out;
}
const say = (...a) => console.log(scrub(a.join(' ')));
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
    say(`${w.name} — connections\n`);
    for (const [from, outs] of Object.entries(w.connections || {})) {
      (outs.main || []).forEach((branch, bi) => {
        (branch || []).forEach((c) => console.log(`  ${from} [out${bi}] -> ${c.node} [in${c.index}]`));
      });
    }
    return;
  }
  if (detail) {
    for (const n of w.nodes) if (n.name.toLowerCase().includes(detail)) {
      say(`### ${n.name} (${n.type}) v${n.typeVersion}`);
      if (n.credentials) console.log('  credentials: ' + JSON.stringify(n.credentials));
      say(JSON.stringify(n.parameters, null, 1));
    }
    return;
  }
  say(`${w.name}  (active:${w.active}, ${w.nodes.length} nodes)\n`);
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
    say(`  (${t}) ${n.name}${extra}`);
  }
})().catch(e => console.log('ERR', e.message));
