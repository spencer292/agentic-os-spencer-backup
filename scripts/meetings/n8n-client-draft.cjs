/**
 * Reusable "Client Email Draft" n8n workflow + driver.
 *
 * Purpose: turn an already-written client email (subject + HTML body) into a
 * Gmail DRAFT in Roy's mailbox via the n8n Gmail credential — so client-facing
 * meeting follow-ups are reviewed by Roy before they ever send. Never sends.
 *
 * This is the building block for the "reviewed client draft" upgrade to the
 * Meetings - Extractor workflow: same Gmail draft node, same review-before-send
 * guarantee. Used standalone here to create one-off client drafts (e.g. David).
 *
 * Run:
 *   node scripts/meetings/n8n-client-draft.cjs --deploy              # create/update + activate
 *   node scripts/meetings/n8n-client-draft.cjs --draft <payload.json> # POST {to,subject,html}
 *   node scripts/meetings/n8n-client-draft.cjs --list                 # show matching workflows
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const WEBHOOK_PATH = 'client-email-draft-7f3a';
const WF_NAME = 'Client Email Draft';
const CRED_GMAIL = { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } };

async function api(ep, method = 'GET', body) {
  const res = await fetch(`${BASE}${ep}`, {
    method,
    headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${String(t).slice(0, 600)}`);
  return j;
}

// Normalise the POSTed body: webhook v2 nests JSON under .body
const INPUT_CODE = `
const b = $input.first().json.body || $input.first().json;
return [{ json: { to: b.to || '', subject: b.subject || '(no subject)', html: b.html || b.body || '' } }];
`.trim();

function workflow() {
  const nodes = [
    { id: 'webhook', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
      parameters: { httpMethod: 'POST', path: WEBHOOK_PATH, responseMode: 'lastNode', options: {} }, webhookId: WEBHOOK_PATH },
    { id: 'input', name: 'Input', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0],
      parameters: { jsCode: INPUT_CODE } },
    { id: 'draft', name: 'Gmail Draft', type: 'n8n-nodes-base.gmail', typeVersion: 2.2, position: [440, 0],
      parameters: { resource: 'draft', operation: 'create',
        subject: '={{ $json.subject }}', emailType: 'html', message: '={{ $json.html }}',
        options: { sendTo: '={{ $json.to }}' } }, credentials: CRED_GMAIL },
  ];
  const connections = {
    Webhook: { main: [[{ node: 'Input', type: 'main', index: 0 }]] },
    Input: { main: [[{ node: 'Gmail Draft', type: 'main', index: 0 }]] },
  };
  return { name: WF_NAME, nodes, connections, settings: { executionOrder: 'v1' } };
}

async function findByName() {
  const j = await api('/workflows?limit=200');
  return (j.data || []).find(w => w.name === WF_NAME) || null;
}

(async () => {
  const argv = process.argv.slice(2);

  if (argv.includes('--list')) {
    const j = await api('/workflows?limit=200');
    for (const w of (j.data || [])) if (/meeting|extractor|client|draft|email/i.test(w.name))
      console.log(` - ${w.id} | ${w.active ? 'ON ' : 'off'} | ${w.name}`);
    return;
  }

  if (argv.includes('--deploy')) {
    const existing = await findByName();
    let id;
    if (existing) { await api(`/workflows/${existing.id}`, 'PUT', workflow()); id = existing.id; console.log(`Updated ${id}`); }
    else { const c = await api('/workflows', 'POST', workflow()); id = c.id; console.log(`Created ${id}`); }
    try { await api(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); }
    catch (e) { console.log('Activate failed:', e.message); }
    console.log(`Webhook: ${WEBHOOK_BASE}/${WEBHOOK_PATH}`);
    return;
  }

  const di = argv.indexOf('--draft');
  if (di !== -1) {
    const payload = JSON.parse(fs.readFileSync(argv[di + 1], 'utf8'));
    console.log(`POST draft -> to:"${payload.to}" subject:"${payload.subject}" (${(payload.html || '').length} chars html)`);
    const r = await fetch(`${WEBHOOK_BASE}/${WEBHOOK_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const t = await r.text();
    console.log(`-> ${r.status}\n${t.slice(0, 800)}`);
    return;
  }

  console.log('Usage: --deploy | --draft <payload.json> | --list');
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
