/**
 * Builds + deploys "Meetings - Backfill" — the paced driver that mines the
 * historical Zoom archive, NEWEST-FIRST, capture-only (NO email).
 *
 * Each run:
 *   1. Pull the set of already-captured Zoom UUIDs from the Notion Meetings DB
 *      (paged) so the frontier advances day by day.
 *   2. Walk ~MONTHS of Zoom cloud recordings, drop podcasts + no-transcript +
 *      already-captured + anything newer than FRESH_DAYS (the Live pull owns and
 *      emails those), sort newest-first.
 *   3. Take the newest BATCH (default 24), fetch each VTT, call the Extractor
 *      with live=false (capture-only — no Gmail draft).
 *   4. Self-stops: when nothing un-captured remains the Code node returns the
 *      meta item only, the IF routes it to Idle, and no Extractor call is made.
 *
 * Idempotency is belt-and-braces: the driver skips captured UUIDs to advance the
 * frontier, AND the Extractor re-checks Notion before spending Opus — so a re-run
 * (or an overlapping window) never double-charges.
 *
 * Security: no secret literal lives in a Code node. The Notion token rides in a
 * Set node ("Cfg") as node data — the same way the Zoom token flows into the
 * Code node — matching the Extractor's "token in node config, not in jsCode"
 * posture. (Cleaner long-term: share the DB with the n8n Notion credential and
 * switch to credentialed Notion nodes; tracked as a follow-up.)
 *
 * Triggers: a daily Schedule (02:00, off-peak, before the 06:00 Live pull) for
 * production + a Webhook for manual testing (responds immediately; inspect the
 * run with scripts/meetings/n8n-exec.cjs).
 *
 * Run:
 *   node scripts/meetings/n8n-build-backfill.cjs                 # create + activate
 *   node scripts/meetings/n8n-build-backfill.cjs --update <id>
 *   node scripts/meetings/n8n-build-backfill.cjs --test [batch] [dry]
 *       e.g. --test 3 dry   -> select newest 3 uncaptured + fetch VTTs, NO Opus/Notion
 *            --test 1        -> real end-to-end capture of ONE meeting
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
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN; // integration that owns the Meetings DB
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const EXTRACTOR_WEBHOOK = `${WEBHOOK_BASE}/meetings-extractor-7f3a`;
const TEST_PATH = 'meetings-backfill-test-7f3a';
const ZOOM_ACCOUNT = 'M3QuSAlkQwClv5CkvueJ3Q';
const ZOOM_BASIC = { httpBasicAuth: { id: 'hhLJX0ZOjbCDyRQv', name: 'Zoom Aaa' } };
const DATA_SOURCE_ID = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const NOTION_VER = '2025-09-03';
const MONTHS = 13;            // ~390 days back — covers archive to ~late May 2025
const DEFAULT_BATCH = 24;
const FRESH_DAYS = 3;         // leave the last 3 days to the Live pull — it owns fresh meetings AND emails them.
                             // Without this the 02:00 backfill captures yesterday's meeting first (capture-only, no email),
                             // so the 06:00 Live pull skips it as a dup and the summary email never fires.
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

// ── Plan & Fetch (Code node) ──────────────────────────────────────────────────
// Zoom token arrives as input data; Notion token + batch/dry arrive via $('Cfg').
const PLAN_FETCH = `
const NL = String.fromCharCode(10);
const notionAuth = $('Cfg').first().json.nt;                 // 'Bearer xxx'
const BATCH = Number($('Cfg').first().json.batch) || ${DEFAULT_BATCH};
const DRY = String($('Cfg').first().json.dry) === 'true';
const token = $input.first().json.access_token;              // Zoom
const DS = '${DATA_SOURCE_ID}';
const POD = new RegExp('${PODCAST_PATTERN}', 'i');

// 1) already-captured UUIDs from Notion (paged) — advances the frontier
const captured = new Set();
let cursor = null;
do {
  const body = { page_size: 100 };
  if (cursor) body.start_cursor = cursor;
  const j = await this.helpers.httpRequest({
    method: 'POST', url: 'https://api.notion.com/v1/data_sources/' + DS + '/query',
    headers: { Authorization: notionAuth, 'Notion-Version': '${NOTION_VER}', 'Content-Type': 'application/json' },
    body, json: true,
  });
  for (const p of j.results || []) {
    const src = ((p.properties && p.properties.Source && p.properties.Source.rich_text) || []).map(t => t.plain_text).join('');
    if (src) captured.add(src.trim());
  }
  cursor = j.has_more ? j.next_cursor : null;
} while (cursor);

// 2) walk the Zoom archive, newest-first windows
const pad = n => (n < 10 ? '0' : '') + n;
const ymd = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
const now = new Date();
const seen = new Map();
for (let i = 0; i < ${MONTHS}; i++) {
  const to = new Date(now); to.setUTCDate(to.getUTCDate() - i * 30);
  const from = new Date(to); from.setUTCDate(from.getUTCDate() - 30);
  const url = 'https://api.zoom.us/v2/users/me/recordings?page_size=300&from=' + ymd(from) + '&to=' + ymd(to);
  const resp = await this.helpers.httpRequest({ method: 'GET', url, headers: { Authorization: 'Bearer ' + token }, json: true });
  for (const m of resp.meetings || []) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
}
const all = [...seen.values()];

// 3) filter -> non-podcast, has transcript, not captured -> newest-first
const hasT = m => (m.recording_files || []).some(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT' || (f.recording_type || '') === 'audio_transcript' || (f.file_type || '').toUpperCase() === 'CC');
const freshCutoff = now.getTime() - ${FRESH_DAYS} * 24 * 60 * 60 * 1000;  // skip the last ${FRESH_DAYS} days — Live pull's territory
const candidates = all
  .filter(m => !POD.test(m.topic || '') && hasT(m) && !captured.has((m.uuid || '').trim()) && new Date(m.start_time).getTime() < freshCutoff)
  .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
const batch = candidates.slice(0, BATCH);

// 4) fetch VTTs for the batch
const vttToText = (vtt) => {
  const out = [];
  for (let line of String(vtt).split(/\\r?\\n/)) {
    line = line.trim();
    if (!line || line === 'WEBVTT' || /^[0-9]+$/.test(line) || line.indexOf('-->') !== -1) continue;
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join(NL);
};
const items = [];
let noText = 0;
for (const m of batch) {
  const files = m.recording_files || [];
  const t = files.find(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT') || files.find(f => (f.recording_type || '') === 'audio_transcript') || files.find(f => (f.file_type || '').toUpperCase() === 'CC');
  if (!t || !t.download_url) { noText++; continue; }
  let vtt;
  try { vtt = await this.helpers.httpRequest({ method: 'GET', url: t.download_url + '?access_token=' + token }); } catch (e) { noText++; continue; }
  const transcript = vttToText(vtt);
  if (!transcript || transcript.length < 50) { noText++; continue; }
  const meta = { totalCandidates: candidates.length, captured: captured.size, picked: batch.length, noText };
  items.push({ json: { uuid: m.uuid, title: m.topic, date: (m.start_time || '').slice(0, 10), host: 'me', transcript, dry: DRY, _meta: meta } });
}
if (!items.length) {
  const done = candidates.length === 0;
  return [{ json: { transcript: '', dry: DRY, _meta: { remaining: candidates.length, captured: captured.size, picked: 0, noText, note: done ? 'archive exhausted — backfill complete' : 'batch fetched 0 transcripts' } } }];
}
return items;
`.trim();

function workflow() {
  const nodes = [
    { id: 'sched', name: 'Daily 02:00', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, -120],
      parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 2 * * *' }] } } },
    { id: 'test', name: 'Test Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 120],
      parameters: { httpMethod: 'POST', path: TEST_PATH, responseMode: 'onReceived', options: {} }, webhookId: TEST_PATH },
    { id: 'cfg', name: 'Cfg', type: 'n8n-nodes-base.set', typeVersion: 3.4, position: [240, 0],
      parameters: { assignments: { assignments: [
        { id: 'a1', name: 'nt', type: 'string', value: `Bearer ${NOTION}` },
        { id: 'a2', name: 'batch', type: 'string', value: `={{ ($json.body && $json.body.batch) ? $json.body.batch : '${DEFAULT_BATCH}' }}` },
        { id: 'a3', name: 'dry', type: 'string', value: '={{ ($json.body && $json.body.dry) ? \'true\' : \'false\' }}' },
      ] }, options: {} } },
    { id: 'ztoken', name: 'Zoom Token', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [480, 0],
      parameters: { method: 'POST', url: 'https://zoom.us/oauth/token',
        authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
        sendQuery: true, queryParameters: { parameters: [{ name: 'grant_type', value: 'account_credentials' }, { name: 'account_id', value: ZOOM_ACCOUNT }] },
        options: {} }, credentials: ZOOM_BASIC },
    { id: 'plan', name: 'Plan & Fetch', type: 'n8n-nodes-base.code', typeVersion: 2, position: [720, 0],
      parameters: { jsCode: PLAN_FETCH } },
    { id: 'ifrun', name: 'Has Transcript?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [960, 0],
      parameters: { conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
        conditions: [
          { leftValue: '={{ $json.transcript }}', rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
          { leftValue: '={{ $json.dry }}', rightValue: false, operator: { type: 'boolean', operation: 'false', singleValue: true } },
        ] } } },
    { id: 'call', name: 'Call Extractor', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1200, -100],
      parameters: { method: 'POST', url: EXTRACTOR_WEBHOOK,
        sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify({ uuid: $json.uuid, title: $json.title, date: $json.date, host: $json.host, transcript: $json.transcript, live: false }) }}',
        options: { timeout: 200000 } }, onError: 'continueRegularOutput' },
    { id: 'idle', name: 'Idle (skip/exhausted)', type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [1200, 120], parameters: {} },
  ];
  const connections = {
    'Daily 02:00': { main: [[{ node: 'Cfg', type: 'main', index: 0 }]] },
    'Test Webhook': { main: [[{ node: 'Cfg', type: 'main', index: 0 }]] },
    'Cfg': { main: [[{ node: 'Zoom Token', type: 'main', index: 0 }]] },
    'Zoom Token': { main: [[{ node: 'Plan & Fetch', type: 'main', index: 0 }]] },
    'Plan & Fetch': { main: [[{ node: 'Has Transcript?', type: 'main', index: 0 }]] },
    'Has Transcript?': { main: [[{ node: 'Call Extractor', type: 'main', index: 0 }], [{ node: 'Idle (skip/exhausted)', type: 'main', index: 0 }]] },
  };
  return { name: 'Meetings - Backfill', nodes, connections, settings: { executionOrder: 'v1' } };
}

(async () => {
  const argv = process.argv.slice(2);
  const ti = argv.indexOf('--test');
  const ui = argv.indexOf('--update');

  if (ti !== -1) {
    const batch = argv[ti + 1] && !argv[ti + 1].startsWith('--') ? argv[ti + 1] : undefined;
    const dry = argv.slice(ti + 1).includes('dry');
    const payload = {};
    if (batch && batch !== 'dry') payload.batch = batch;
    if (dry) payload.dry = true;
    console.log(`POST ${WEBHOOK_BASE}/${TEST_PATH}  body=${JSON.stringify(payload)}`);
    const r = await fetch(`${WEBHOOK_BASE}/${TEST_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const t = await r.text();
    console.log(`-> ${r.status}\n${t.slice(0, 800)}`);
    console.log(`\nInspect:  node scripts/meetings/n8n-exec.cjs <backfillId> 1`);
    return;
  }

  const wf = workflow();
  let id;
  if (ui !== -1) { id = argv[ui + 1]; await api(`/workflows/${id}`, 'PUT', wf); console.log(`Updated workflow ${id}`); }
  else { const created = await api('/workflows', 'POST', wf); id = created.id; console.log(`Created workflow: ${id}  "${created.name}"`); }
  try { await api(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); } catch (e) { console.log('Activate failed:', e.message); }
  console.log(`Test webhook: ${WEBHOOK_BASE}/${TEST_PATH}`);
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
