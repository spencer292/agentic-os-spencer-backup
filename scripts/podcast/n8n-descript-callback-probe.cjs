#!/usr/bin/env node
/**
 * LINCHPIN PROOF for the P05 "Descript Ingest & Export" n8n migration.
 *
 * The whole P05 design is callback-driven: fire each Descript job with a
 * `callback_url` and let Descript's webhook chain the next short workflow
 * (so no single n8n execution ever approaches the ~40-min Cloud timeout).
 * That ONLY works if Descript actually POSTs to the callback_url. The API is
 * open beta with a known-issues page, so this script proves it end-to-end
 * against a real n8n webhook BEFORE we build P05.
 *
 * It is fully self-contained and touches NOTHING real:
 *   - deploys a tiny throwaway n8n webhook ("ZZ Probe - Descript Callback")
 *   - imports a 1-second SILENT clip into a throwaway Descript project
 *     ("CALLBACK PROBE - delete me") with callback_url -> the probe webhook
 *   - reads the n8n execution back to capture the exact callback payload shape
 *
 * Secrets are read from .env internally and never printed.
 *
 * Usage:
 *   node scripts/podcast/n8n-descript-callback-probe.cjs --deploy     # create+activate probe webhook
 *   node scripts/podcast/n8n-descript-callback-probe.cjs --fire       # fire a Descript import w/ callback
 *   node scripts/podcast/n8n-descript-callback-probe.cjs --inspect    # show Descript job state + captured callback
 *   node scripts/podcast/n8n-descript-callback-probe.cjs --teardown   # deactivate probe (reversible)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const DTOKEN = env.DESCRIPT_API_TOKEN;
const N8N_BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const DESCRIPT = 'https://descriptapi.com/v1';
const WEBHOOK_PATH = 'descript-callback-probe';
const WF_NAME = 'ZZ Probe - Descript Callback (temp)';
const SIDECAR = path.join(os.tmpdir(), 'descript-callback-probe.json');

const mask = (s) => (s ? s.slice(0, 4) + '…' + s.slice(-2) + ` (${s.length} chars)` : 'MISSING');
const loadSide = () => { try { return JSON.parse(fs.readFileSync(SIDECAR, 'utf8')); } catch { return {}; } };
const saveSide = (o) => fs.writeFileSync(SIDECAR, JSON.stringify(o, null, 2));

async function n8n(ep, method = 'GET', body) {
  const res = await fetch(`${N8N_BASE}${ep}`, {
    method,
    headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`n8n ${method} ${ep} -> ${res.status}: ${String(t).slice(0, 300)}`);
  return j;
}

async function descript(ep, method = 'GET', body) {
  const res = await fetch(`${DESCRIPT}${ep}`, {
    method,
    headers: { Authorization: `Bearer ${DTOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: res.ok, status: res.status, body: j };
}

// Probe workflow: Webhook (POST) -> Code "Capture" that echoes the full inbound
// payload (headers/query/body) so the n8n execution record holds exactly what
// Descript sent. responseMode 'lastNode' returns 200 once Capture runs.
function probeWorkflow() {
  const CAPTURE = [
    'const i = $input.first().json;',
    'return [{ json: { received_at: new Date().toISOString(), body: i.body ?? null, headers: i.headers ?? null, query: i.query ?? null, raw: i } }];',
  ].join('\n');
  const nodes = [
    { id: 'webhook', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
      parameters: { httpMethod: 'POST', path: WEBHOOK_PATH, responseMode: 'lastNode', options: {} }, webhookId: WEBHOOK_PATH },
    { id: 'capture', name: 'Capture', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 0],
      parameters: { jsCode: CAPTURE } },
  ];
  const connections = { Webhook: { main: [[{ node: 'Capture', type: 'main', index: 0 }]] } };
  return { name: WF_NAME, nodes, connections, settings: { executionOrder: 'v1' } };
}

async function findWorkflowByName(name) {
  const list = await n8n('/workflows?limit=250');
  return (list.data || []).find((w) => w.name === name) || null;
}

async function deploy() {
  if (!NKEY) throw new Error('N8N_API_KEY missing');
  const wf = probeWorkflow();
  const existing = await findWorkflowByName(WF_NAME);
  let id;
  if (existing) { await n8n(`/workflows/${existing.id}`, 'PUT', wf); id = existing.id; console.log(`Updated existing probe workflow ${id}`); }
  else { const c = await n8n('/workflows', 'POST', wf); id = c.id; console.log(`Created probe workflow ${id}`); }
  try { await n8n(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); }
  catch (e) { console.log('Activate failed:', e.message); }
  const url = `${WEBHOOK_BASE}/${WEBHOOK_PATH}`;
  const side = loadSide(); side.workflowId = id; side.callbackUrl = url; saveSide(side);
  console.log(`Probe callback URL: ${url}`);

  // sanity: hit it ourselves so we KNOW the webhook + capture path works before involving Descript
  const ping = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ probe_self_test: true, at: new Date().toISOString() }) });
  console.log(`Self-test POST -> ${ping.status} (expect 200; confirms the webhook is live)`);
}

function makeSilentClip() {
  const dir = os.tmpdir();
  const out = path.join(dir, 'descript-probe-silence.m4a');
  execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '1', '-c:a', 'aac', '-b:a', '64k', out], { stdio: 'ignore' });
  return out;
}

async function fire() {
  if (!DTOKEN) throw new Error('DESCRIPT_API_TOKEN missing from .env — cannot fire');
  const side = loadSide();
  const base = side.callbackUrl || `${WEBHOOK_BASE}/${WEBHOOK_PATH}`;
  // Optional query string to test whether Descript echoes callback_url query params
  const qi = process.argv.indexOf('--q');
  const q = qi !== -1 ? process.argv[qi + 1] : '';
  const callbackUrl = q ? `${base}?${q}` : base;
  console.log(`Descript token: ${mask(DTOKEN)}`);
  console.log(`callback_url:   ${callbackUrl}`);

  const clip = makeSilentClip();
  const size = fs.statSync(clip).size;
  const mediaKey = 'probe-silence.m4a';
  console.log(`Silent clip: ${clip} (${size} bytes)`);

  // 1) create import job WITH callback_url
  const importBody = {
    project_name: 'CALLBACK PROBE - delete me',
    add_media: { [mediaKey]: { content_type: 'audio/mp4', file_size: size } },
    add_compositions: [{ name: 'probe', clips: [{ media: mediaKey }] }],
    callback_url: callbackUrl,
  };
  const imp = await descript('/jobs/import/project_media', 'POST', importBody);
  console.log(`\nimport POST -> ${imp.status}`);
  if (!imp.ok) { console.log('import failed:', JSON.stringify(imp.body).slice(0, 400)); return; }
  const j = imp.body;
  const up = j.upload_urls && j.upload_urls[mediaKey];
  console.log(`  project_id=${j.project_id} job_id=${j.job_id} upload_url=${up ? 'yes' : 'NO'}`);

  // 2) upload the bytes so the import job can actually run -> completion -> callback
  if (up) {
    const put = await fetch(up.upload_url, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(clip) });
    console.log(`  upload PUT -> ${put.status}`);
  }
  side.fired_at = new Date().toISOString();
  side.project_id = j.project_id; side.import_job_id = j.job_id; side.project_url = j.project_url;
  saveSide(side);
  console.log(`\nFired. Descript should POST to the probe webhook when the import job stops.`);
  console.log(`Run --inspect in ~1-3 min to capture the callback payload.`);
}

async function inspect() {
  const side = loadSide();
  if (side.import_job_id && DTOKEN) {
    const job = await descript(`/jobs/${side.import_job_id}`);
    const jb = job.body || {};
    console.log(`Descript job ${side.import_job_id}: state=${jb.job_state || '?'} status=${(jb.result && jb.result.status) || '?'} (HTTP ${job.status})`);
  }
  if (!side.workflowId) { console.log('No probe workflowId in sidecar — run --deploy first.'); return; }
  const execs = await n8n(`/executions?workflowId=${side.workflowId}&includeData=true&limit=10`);
  const rows = execs.data || [];
  console.log(`\nProbe workflow executions: ${rows.length}`);
  for (const ex of rows) {
    let captured = null;
    try {
      const data = typeof ex.data === 'string' ? JSON.parse(ex.data) : ex.data;
      captured = data?.resultData?.runData?.Capture?.[0]?.data?.main?.[0]?.[0]?.json;
    } catch {}
    const body = captured && captured.body;
    const isSelf = body && body.probe_self_test;
    console.log(`\n--- exec ${ex.id} @ ${ex.startedAt} ${isSelf ? '(self-test)' : '(EXTERNAL CALLBACK)'} ---`);
    if (captured) console.log(JSON.stringify({ query: captured.query, body: captured.body, headers_keys: captured.headers ? Object.keys(captured.headers) : null }, null, 2).slice(0, 2200));
  }
  console.log(`\nIf you see an EXTERNAL CALLBACK exec carrying a Descript job_id/status -> linchpin PROVEN.`);
}

async function teardown() {
  const side = loadSide();
  if (!side.workflowId) { console.log('Nothing to tear down.'); return; }
  try { await n8n(`/workflows/${side.workflowId}/deactivate`, 'POST'); console.log(`Deactivated probe workflow ${side.workflowId} (reversible via --deploy).`); }
  catch (e) { console.log('Deactivate failed:', e.message); }
  if (side.project_url) console.log(`Throwaway Descript project to delete manually: ${side.project_url}`);
}

(async () => {
  const a = process.argv.slice(2);
  if (a.includes('--deploy')) return deploy();
  if (a.includes('--fire')) return fire();
  if (a.includes('--inspect')) return inspect();
  if (a.includes('--teardown')) return teardown();
  console.log('specify --deploy | --fire | --inspect | --teardown');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
