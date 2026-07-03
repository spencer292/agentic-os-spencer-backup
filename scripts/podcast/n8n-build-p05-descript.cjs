#!/usr/bin/env node
/**
 * Builds + deploys "05 Podcast - Descript Ingest & Export" via the n8n public API.
 *
 * Moves the Zoom -> Descript (import -> filler-removal -> publish) -> cleaned-audio
 * export OFF the local ingest-daemon.cjs and INTO n8n, so it is visible to the
 * estate's monitoring (P90 error handler) and is not a fragile local SPOF.
 *
 * Design (validated 2026-06-25 by the callback linchpin probe — Descript DOES POST
 * to callback_url, echoes the query string, and the payload mirrors the job object):
 *   ONE workflow, FOUR entry points, callback-driven so no single execution ever
 *   approaches n8n Cloud's ~40-min timeout:
 *     A) START   (Execute-Workflow trigger from P01): resolve ep/guest from Notion,
 *        download the audio-only file from Zoom (Bearer), 3-step upload to Descript,
 *        fire the import job with callback_url -> import-done webhook.
 *     B) IMPORT-DONE webhook: on success, fire the filler-removal (agent) job with
 *        callback_url -> filler-done webhook.
 *     C) FILLER-DONE webhook: fire the publish (Audio) job with callback_url ->
 *        publish-done webhook.
 *     D) PUBLISH-DONE webhook: download the cleaned m4a from result.download_url and
 *        upload it to Drive 00_Cleaned Exports as "{ep}_{Guest}.mp3" -> P02's Drive
 *        Trigger picks it up (transcribe -> Captivate -> content engine).
 *
 * AUDIO ONLY by design — video render stays on a machine (n8n can't render/hold big
 * media). Episode + stage are correlated purely via echoed callback_url query params
 * (?stage=&ep=&guest=); no external store. Failures throw -> P90 error handler.
 *
 * Deploys INACTIVE. Activation + P01 wiring + cutover are deliberately NOT done here
 * (outward-facing; gated). See the runbook printed at the end.
 *
 * Run:
 *   node scripts/podcast/n8n-build-p05-descript.cjs            # create (inactive)
 *   node scripts/podcast/n8n-build-p05-descript.cjs --update <id>
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const SIDECAR = path.join(os.tmpdir(), 'p05-descript.json');

// ── live estate constants (audited 2026-06-25) ───────────────────────────────
const CRED = {
  descript: { httpHeaderAuth: { id: 'F8IbL3UG6q4xedml', name: 'Descript API' } },
  drive: { googleDriveOAuth2Api: { id: 'AgHTJFji1sTSqnPV', name: 'Google Drive account 2' } },
  gmail: { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } },
};
const NOTION_DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9'; // Podcast Episodes hub (data source)
const NOTION_VER = '2025-09-03';
const CLEANED_FOLDER = '1OQKK02yAJ0BQ0CU-e3U2_cVd3_GicBB3'; // 00_Cleaned Exports (New System) — P02 watches this
const SHARED_DRIVE = '0AKfRjuIGt6z3Uk9PVA'; // Elevate 360 shared drive
const P90 = '7P8rKQ3agA3rXTzk'; // 90 Podcast - Error Handler
const EMAIL_TO = 'roy@allthepower.co.uk';

// unguessable callback paths (no signature on Descript callbacks, so paths are the gate)
const IMPORT_PATH = 'p05-import-9b3f1a7c';
const FILLER_PATH = 'p05-filler-6c2e84d0';
const PUBLISH_PATH = 'p05-publish-4d7a0519';
const IMPORT_CB = `${WEBHOOK_BASE}/${IMPORT_PATH}`;
const FILLER_CB = `${WEBHOOK_BASE}/${FILLER_PATH}`;
const PUBLISH_CB = `${WEBHOOK_BASE}/${PUBLISH_PATH}`;

const FILLER_PROMPT = 'Remove all filler words (um, uh, er, you know, like as filler, sort of, kind of) from the transcript across all speakers, keeping natural speech flow.';

async function api(ep, method = 'GET', body) {
  const res = await fetch(`${BASE}${ep}`, {
    method,
    headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${String(t).slice(0, 500)}`);
  return j;
}

// ── code-node bodies ─────────────────────────────────────────────────────────
const RESOLVE_CODE = `
// Match the Zoom topic to a Podcast Episodes row -> {ep, guest}; pick the audio-only file.
const rows = ($('Notion Query').first().json.results) || [];
const start = $('Start').first().json;
const topic = start.topic || '';
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const t = norm(topic);
const txt = p => (((p && (p.rich_text || p.title)) || []).map(x => x.plain_text).join(''));
let match = null;
for (const p of rows) {
  const pr = p.properties || {};
  const first = txt(pr['Guest First Name']);
  const last = txt(pr['Guest Last Name']);
  const ep = pr['Episode Number'] && pr['Episode Number'].number;
  if (!first || !last || ep == null) continue;
  if (t.includes(norm(first)) && t.includes(norm(last))) { match = { ep, first, last }; break; }
}
const files = start.files || [];
const audio = files.find(f => f.type === 'audio_only') || null;
if (!match) throw new Error('P05: no Notion episode/guest match for Zoom topic "' + topic + '"');
if (!audio) throw new Error('P05: no audio_only file in Zoom payload for "' + topic + '"');
return [{ json: {
  ep: match.ep,
  guestFull: match.first + ' ' + match.last,
  topic,
  audioUrl: audio.download_url,
  download_token: start.download_token,
} }];
`.trim();

const PREP_IMPORT_CODE = `
// Build the Descript import body using the ACTUAL downloaded byte size, carry the binary through.
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
const size = buf.length;
const r = $('Resolve Episode').first().json;
const mediaKey = 'audio.m4a';
const cb = '${IMPORT_CB}?stage=import&ep=' + encodeURIComponent(r.ep) + '&guest=' + encodeURIComponent(r.guestFull);
const importBody = {
  project_name: r.ep + ' - ' + r.guestFull,
  add_media: { [mediaKey]: { content_type: 'audio/mp4', file_size: size } },
  add_compositions: [{ name: 'Episode Edit', clips: [{ media: mediaKey }] }],
  callback_url: cb,
};
return [{ json: { importBody, mediaKey, ep: r.ep, guestFull: r.guestFull }, binary: $input.first().binary }];
`.trim();

// Generic callback guard+next-job builder. stage = 'import'|'filler'.
function callbackPrep(stage) {
  const nextCb = stage === 'import' ? FILLER_CB : PUBLISH_CB;
  const nextStage = stage === 'import' ? 'filler' : 'publish';
  return `
const b = $input.first().json.body || {};
const q = $input.first().json.query || {};
const status = b.result && b.result.status;
if (b.job_state !== 'stopped' || status !== 'success') {
  throw new Error('P05 ${stage}-done: Descript job not successful (state=' + b.job_state + ', status=' + status + ') for ep ' + q.ep);
}
const project_id = b.project_id;
const ep = q.ep; const guest = q.guest;
const cb = '${nextCb}?stage=${nextStage}&ep=' + encodeURIComponent(ep) + '&guest=' + encodeURIComponent(guest);
${stage === 'import'
  ? "const nextBody = { project_id, prompt: " + JSON.stringify(FILLER_PROMPT) + ", callback_url: cb };"
  : "const nextBody = { project_id, media_type: 'Audio', access_level: 'private', callback_url: cb };"}
return [{ json: { nextBody, ep, guest, project_id } }];
`.trim();
}

const PUBLISH_PARSE_CODE = `
// Publish finished: get the cleaned-audio download URL + compose the P02 filename.
const b = $input.first().json.body || {};
const q = $input.first().json.query || {};
const status = b.result && b.result.status;
const url = b.result && (b.result.download_url || b.result.downloadUrl);
if (b.job_state !== 'stopped' || status !== 'success' || !url) {
  throw new Error('P05 publish-done: bad publish result (state=' + b.job_state + ', status=' + status + ', url=' + !!url + ') for ep ' + q.ep);
}
const filename = q.ep + '_' + (q.guest || '').trim() + '.mp3';
return [{ json: { downloadUrl: url, filename, ep: q.ep, guest: q.guest, project_id: b.project_id } }];
`.trim();

// ── workflow definition ──────────────────────────────────────────────────────
function workflow() {
  const descriptHeaderAuth = { authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth' };
  const nodes = [
    // ===== Entry A: START (from P01 via Execute Workflow) =====
    { id: 'start', name: 'Start', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1, position: [0, 0],
      parameters: {} },
    { id: 'nquery', name: 'Notion Query', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [220, 0],
      parameters: { method: 'POST', url: `https://api.notion.com/v1/data_sources/${NOTION_DS}/query`,
        sendHeaders: true, headerParameters: { parameters: [{ name: 'Authorization', value: `Bearer ${NOTION}` }, { name: 'Notion-Version', value: NOTION_VER }] },
        sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: JSON.stringify({ sorts: [{ property: 'Episode Number', direction: 'descending' }], page_size: 100 }),
        options: {} } },
    { id: 'resolve', name: 'Resolve Episode', type: 'n8n-nodes-base.code', typeVersion: 2, position: [440, 0],
      parameters: { jsCode: RESOLVE_CODE } },
    { id: 'dlzoom', name: 'Download Zoom Audio', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [660, 0],
      parameters: { method: 'GET', url: '={{ $json.audioUrl }}',
        sendHeaders: true, headerParameters: { parameters: [{ name: 'Authorization', value: '={{ "Bearer " + $json.download_token }}' }] },
        options: { response: { response: { responseFormat: 'file' } } } } },
    { id: 'prepimp', name: 'Prep Import Body', type: 'n8n-nodes-base.code', typeVersion: 2, position: [880, 0],
      parameters: { jsCode: PREP_IMPORT_CODE } },
    { id: 'dimport', name: 'Descript Create Import', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1100, -80],
      parameters: { method: 'POST', url: 'https://descriptapi.com/v1/jobs/import/project_media',
        ...descriptHeaderAuth, sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify($json.importBody) }}', options: {} }, credentials: CRED.descript },
    { id: 'merge', name: 'Merge Binary', type: 'n8n-nodes-base.merge', typeVersion: 3, position: [1320, 0],
      parameters: { mode: 'combine', combineBy: 'combineByPosition', options: {} } },
    { id: 'upload', name: 'Descript Upload Bytes', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1540, 0],
      parameters: { method: 'PUT', url: "={{ $json.upload_urls['audio.m4a'].upload_url }}",
        sendHeaders: true, headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/octet-stream' }] },
        sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data', options: {} } },

    // ===== Entry B: IMPORT-DONE -> fire filler =====
    { id: 'whimport', name: 'WH Import Done', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 320],
      parameters: { httpMethod: 'POST', path: IMPORT_PATH, responseMode: 'onReceived', options: {} }, webhookId: IMPORT_PATH },
    { id: 'prepfiller', name: 'Prep Filler', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 320],
      parameters: { jsCode: callbackPrep('import') } },
    { id: 'dfiller', name: 'Descript Start Filler', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [480, 320],
      parameters: { method: 'POST', url: 'https://descriptapi.com/v1/jobs/agent',
        ...descriptHeaderAuth, sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify($json.nextBody) }}', options: {} }, credentials: CRED.descript },

    // ===== Entry C: FILLER-DONE -> fire publish =====
    { id: 'whfiller', name: 'WH Filler Done', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 520],
      parameters: { httpMethod: 'POST', path: FILLER_PATH, responseMode: 'onReceived', options: {} }, webhookId: FILLER_PATH },
    { id: 'preppub', name: 'Prep Publish', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 520],
      parameters: { jsCode: callbackPrep('filler') } },
    { id: 'dpublish', name: 'Descript Start Publish', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [480, 520],
      parameters: { method: 'POST', url: 'https://descriptapi.com/v1/jobs/publish',
        ...descriptHeaderAuth, sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify($json.nextBody) }}', options: {} }, credentials: CRED.descript },

    // ===== Entry D: PUBLISH-DONE -> download cleaned audio -> Drive (P02 picks up) =====
    { id: 'whpublish', name: 'WH Publish Done', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 720],
      parameters: { httpMethod: 'POST', path: PUBLISH_PATH, responseMode: 'onReceived', options: {} }, webhookId: PUBLISH_PATH },
    { id: 'pubparse', name: 'Publish Parse', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 720],
      parameters: { jsCode: PUBLISH_PARSE_CODE } },
    { id: 'dlclean', name: 'Download Cleaned Audio', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [480, 720],
      parameters: { method: 'GET', url: '={{ $json.downloadUrl }}',
        options: { response: { response: { responseFormat: 'file' } } } } },
    { id: 'drive', name: 'Upload to Cleaned Exports', type: 'n8n-nodes-base.googleDrive', typeVersion: 3, position: [720, 720],
      parameters: { name: "={{ $('Publish Parse').first().json.filename }}",
        driveId: { __rl: true, value: SHARED_DRIVE, mode: 'id' },
        folderId: { __rl: true, value: CLEANED_FOLDER, mode: 'id' },
        options: {} }, credentials: CRED.drive },
    { id: 'notify', name: 'Notify Roy', type: 'n8n-nodes-base.gmail', typeVersion: 2.2, position: [960, 720],
      parameters: { resource: 'message', operation: 'send', sendTo: EMAIL_TO,
        subject: "={{ 'P05 cleaned export uploaded: ' + $('Publish Parse').first().json.filename }}",
        emailType: 'text',
        message: "={{ 'Cleaned audio for Ep ' + $('Publish Parse').first().json.ep + ' (' + $('Publish Parse').first().json.guest + ') is in 00_Cleaned Exports. P02 will transcribe + publish.' }}",
        options: { appendAttribution: false } }, credentials: CRED.gmail },
  ];

  const connections = {
    // Entry A
    Start: { main: [[{ node: 'Notion Query', type: 'main', index: 0 }]] },
    'Notion Query': { main: [[{ node: 'Resolve Episode', type: 'main', index: 0 }]] },
    'Resolve Episode': { main: [[{ node: 'Download Zoom Audio', type: 'main', index: 0 }]] },
    'Download Zoom Audio': { main: [[{ node: 'Prep Import Body', type: 'main', index: 0 }]] },
    // fan-out: Prep -> Import (json) AND Prep -> Merge input 1 (binary)
    'Prep Import Body': { main: [[{ node: 'Descript Create Import', type: 'main', index: 0 }, { node: 'Merge Binary', type: 'main', index: 1 }]] },
    'Descript Create Import': { main: [[{ node: 'Merge Binary', type: 'main', index: 0 }]] },
    'Merge Binary': { main: [[{ node: 'Descript Upload Bytes', type: 'main', index: 0 }]] },
    // Entry B
    'WH Import Done': { main: [[{ node: 'Prep Filler', type: 'main', index: 0 }]] },
    'Prep Filler': { main: [[{ node: 'Descript Start Filler', type: 'main', index: 0 }]] },
    // Entry C
    'WH Filler Done': { main: [[{ node: 'Prep Publish', type: 'main', index: 0 }]] },
    'Prep Publish': { main: [[{ node: 'Descript Start Publish', type: 'main', index: 0 }]] },
    // Entry D
    'WH Publish Done': { main: [[{ node: 'Publish Parse', type: 'main', index: 0 }]] },
    'Publish Parse': { main: [[{ node: 'Download Cleaned Audio', type: 'main', index: 0 }]] },
    'Download Cleaned Audio': { main: [[{ node: 'Upload to Cleaned Exports', type: 'main', index: 0 }]] },
    'Upload to Cleaned Exports': { main: [[{ node: 'Notify Roy', type: 'main', index: 0 }]] },
  };

  return { name: '05 Podcast - Descript Ingest & Export', nodes, connections,
    settings: { executionOrder: 'v1', errorWorkflow: P90 } };
}

(async () => {
  if (!NKEY) throw new Error('N8N_API_KEY missing');
  if (!NOTION) throw new Error('NOTION_API_TOKEN missing');
  const argv = process.argv.slice(2);
  const ui = argv.indexOf('--update');
  const wf = workflow();
  let id;
  if (ui !== -1) { id = argv[ui + 1]; await api(`/workflows/${id}`, 'PUT', wf); console.log(`Updated workflow ${id}`); }
  else { const c = await api('/workflows', 'POST', wf); id = c.id; console.log(`Created workflow ${id}  "${c.name}"  (active=${c.active})`); }
  fs.writeFileSync(SIDECAR, JSON.stringify({ id, importCb: IMPORT_CB, fillerCb: FILLER_CB, publishCb: PUBLISH_CB }, null, 2));
  console.log('\nDeployed INACTIVE. Callback URLs (live only once activated):');
  console.log('  import-done : ' + IMPORT_CB);
  console.log('  filler-done : ' + FILLER_CB);
  console.log('  publish-done: ' + PUBLISH_CB);
  console.log('\nNot done here (gated / outward-facing): activate, wire P01, retire daemon + legacy monolith.');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
