/**
 * Builds + deploys "Meetings - Live (Daily Pull)" — the driver that runs every
 * morning, lists the last LOOKBACK_DAYS of Zoom cloud recordings, drops podcast
 * recordings, fetches each VTT transcript, and calls the Extractor (live=true).
 * Idempotency lives in the Extractor (skips UUIDs already in Notion), so an
 * overlapping daily window is cheap.
 *
 * Triggers: a daily Schedule (06:00) for production + a Webhook for manual testing.
 *
 * Run:
 *   node scripts/meetings/n8n-build-live.cjs            # create + activate
 *   node scripts/meetings/n8n-build-live.cjs --update <id>
 *   node scripts/meetings/n8n-build-live.cjs --test <id>   # fire the test webhook
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
const EXTRACTOR_WEBHOOK = `${WEBHOOK_BASE}/meetings-extractor-7f3a`;
const TEST_PATH = 'meetings-live-test-7f3a';
const ZOOM_ACCOUNT = 'M3QuSAlkQwClv5CkvueJ3Q';
const ZOOM_BASIC = { httpBasicAuth: { id: 'hhLJX0ZOjbCDyRQv', name: 'Zoom Aaa' } };
const LOOKBACK_DAYS = 2;
const PODCAST_PATTERN = 'power movers|podcast|thinking outside';

async function api(ep, method = 'GET', body) {
  const res = await fetch(`${BASE}${ep}`, {
    method, headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${String(t).slice(0, 500)}`);
  return j;
}

const LIST_FETCH = `
const token = $input.first().json.access_token;
const NL = String.fromCharCode(10);
const pad = n => (n < 10 ? '0' : '') + n;
const ymd = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const now = new Date();
const from = new Date(now.getTime() - ${LOOKBACK_DAYS} * 24 * 60 * 60 * 1000);
const url = 'https://api.zoom.us/v2/users/me/recordings?page_size=300&from=' + ymd(from) + '&to=' + ymd(now);
const resp = await this.helpers.httpRequest({ method: 'GET', url, headers: { Authorization: 'Bearer ' + token }, json: true });
const meetings = resp.meetings || [];
const PODCAST = new RegExp('${PODCAST_PATTERN}', 'i');
const vttToText = (vtt) => {
  const out = [];
  const lines = String(vtt).split(/\\r?\\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'WEBVTT' || /^[0-9]+$/.test(line) || line.indexOf('-->') !== -1) continue;
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join(NL);
};
const items = [];
let skippedPodcast = 0, noTranscript = 0;
for (const m of meetings) {
  if (PODCAST.test(m.topic || '')) { skippedPodcast++; continue; }
  const files = m.recording_files || [];
  const t = files.find(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT') || files.find(f => (f.recording_type || '') === 'audio_transcript') || files.find(f => (f.file_type || '').toUpperCase() === 'CC');
  if (!t || !t.download_url) { noTranscript++; continue; }
  let vtt;
  try { vtt = await this.helpers.httpRequest({ method: 'GET', url: t.download_url + '?access_token=' + token }); } catch (e) { noTranscript++; continue; }
  const transcript = vttToText(vtt);
  if (!transcript || transcript.length < 50) { noTranscript++; continue; }
  items.push({ json: { uuid: m.uuid, title: m.topic, date: (m.start_time || '').slice(0, 10), host: 'me', transcript, _meta: { total: meetings.length, skippedPodcast, noTranscript } } });
}
if (!items.length) return [{ json: { _meta: { total: meetings.length, skippedPodcast, noTranscript, picked: 0 } } }];
return items;
`.trim();

function workflow() {
  const nodes = [
    { id: 'sched', name: 'Daily 06:00', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, -120],
      parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 6 * * *' }] } } },
    { id: 'test', name: 'Test Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 100],
      parameters: { httpMethod: 'POST', path: TEST_PATH, responseMode: 'lastNode', options: {} }, webhookId: TEST_PATH },
    { id: 'ztoken', name: 'Zoom Token', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [260, 0],
      parameters: { method: 'POST', url: 'https://zoom.us/oauth/token',
        authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
        sendQuery: true, queryParameters: { parameters: [{ name: 'grant_type', value: 'account_credentials' }, { name: 'account_id', value: ZOOM_ACCOUNT }] },
        options: {} }, credentials: ZOOM_BASIC },
    { id: 'list', name: 'List & Fetch', type: 'n8n-nodes-base.code', typeVersion: 2, position: [500, 0],
      parameters: { jsCode: LIST_FETCH } },
    { id: 'call', name: 'Call Extractor', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [740, 0],
      parameters: { method: 'POST', url: EXTRACTOR_WEBHOOK,
        sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify({ uuid: $json.uuid, title: $json.title, date: $json.date, host: $json.host, transcript: $json.transcript, live: true }) }}',
        options: { timeout: 200000 } }, onError: 'continueRegularOutput' },
  ];
  const connections = {
    'Daily 06:00': { main: [[{ node: 'Zoom Token', type: 'main', index: 0 }]] },
    'Test Webhook': { main: [[{ node: 'Zoom Token', type: 'main', index: 0 }]] },
    'Zoom Token': { main: [[{ node: 'List & Fetch', type: 'main', index: 0 }]] },
    'List & Fetch': { main: [[{ node: 'Call Extractor', type: 'main', index: 0 }]] },
  };
  return { name: 'Meetings - Live (Daily Pull)', nodes, connections, settings: { executionOrder: 'v1' } };
}

(async () => {
  const argv = process.argv.slice(2);
  const ti = argv.indexOf('--test');
  const ui = argv.indexOf('--update');

  if (ti !== -1) {
    console.log(`POST ${WEBHOOK_BASE}/${TEST_PATH}  (last ${LOOKBACK_DAYS} days)`);
    const r = await fetch(`${WEBHOOK_BASE}/${TEST_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const t = await r.text();
    console.log(`-> ${r.status}\n${t.slice(0, 1500)}`);
    return;
  }

  const wf = workflow();
  let id;
  if (ui !== -1) { id = argv[ui + 1]; await api(`/workflows/${id}`, 'PUT', wf); console.log(`Updated workflow ${id}`); }
  else { const created = await api('/workflows', 'POST', wf); id = created.id; console.log(`Created workflow: ${id}  "${created.name}"`); }
  try { await api(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); } catch (e) { console.log('Activate failed:', e.message); }
  console.log(`Test webhook: ${WEBHOOK_BASE}/${TEST_PATH}`);
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
