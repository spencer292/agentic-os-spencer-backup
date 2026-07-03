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
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const base = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, 'Content-Type': 'application/json' };
const PROJECT = 'Dmp86aYd0evZH0Dr';
const DOCS_CRED = { googleDocsOAuth2Api: { id: 'MP5lsnBo4QJCHbdZ', name: 'Google Docs account 4' } };

const METHOD = (process.argv[2] || 'GET').toUpperCase();
const URL = process.argv[3];
const BODY = process.argv[4]; // optional JSON string
if (!URL) { console.log('usage: drive-via-n8n.cjs <METHOD> "<url>" [jsonBody]'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const path = `zz-drive-${process.pid}-${Date.now().toString(36)}`;

const httpParams = {
  method: METHOD, url: URL,
  authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDocsOAuth2Api',
  options: {},
};
if (BODY) { httpParams.sendBody = true; httpParams.specifyBody = 'json'; httpParams.jsonBody = BODY; }

const wf = {
  name: `ZZ TEMP - Drive Call ${path}`,
  settings: { executionOrder: 'v1' },
  nodes: [
    { id: 'wh', name: 'Hook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
      parameters: { httpMethod: 'GET', path, responseMode: 'lastNode' } },
    { id: 'call', name: 'Drive', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [220, 0],
      parameters: httpParams, credentials: DOCS_CRED },
  ],
  connections: { 'Hook': { main: [[{ node: 'Drive', type: 'main', index: 0 }]] } },
};

(async () => {
  let id;
  try {
    const r = await fetch(`${base}/workflows`, { method: 'POST', headers: H, body: JSON.stringify(wf) });
    const j = await r.json();
    if (!r.ok) { console.log('create failed', r.status, JSON.stringify(j).slice(0, 300)); return; }
    id = j.id;
    await fetch(`${base}/workflows/${id}/transfer`, { method: 'PUT', headers: H, body: JSON.stringify({ destinationProjectId: PROJECT }) });
    await fetch(`${base}/workflows/${id}/activate`, { method: 'POST', headers: H });
    let out = '';
    for (let i = 0; i < 6; i++) {
      await sleep(1500);
      const run = await fetch(`${WEBHOOK_BASE}/${path}`);
      out = await run.text();
      if (run.ok) break;
      if (i === 5) console.log('webhook status', run.status);
    }
    try { console.log(JSON.stringify(JSON.parse(out), null, 1)); }
    catch { console.log(out.slice(0, 1200)); }
  } finally {
    if (id) await fetch(`${base}/workflows/${id}`, { method: 'DELETE', headers: H });
  }
})();
