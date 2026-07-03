/**
 * Builds + deploys "07 Podcast - YouTube URL Writeback".
 *
 * Closes the launch gap: P06 schedules the condensed video to YouTube via Zernio,
 * but Zernio only assigns the live YouTube URL when it actually publishes on the
 * release date. Nothing wrote that URL back, so P08's email gate (needs
 * `Full Episode YouTube`) could never clear. This workflow polls Zernio for posts
 * we've scheduled and, once a post is published, writes its YouTube watch URL to
 * `Full Episode YouTube` — which then releases the P08 guest email.
 *
 * Every 30 min: Notion getAll -> Gate (Zernio Post ID set + Full Episode YouTube
 * empty) -> GET zernio /posts/{id} -> if youtube platform published, write the
 * platformPostUrl to Notion.
 *
 * Run:
 *   node scripts/podcast/n8n-build-yt-writeback.cjs            # create + activate
 *   node scripts/podcast/n8n-build-yt-writeback.cjs --update <id>
 *   node scripts/podcast/n8n-build-yt-writeback.cjs --test <id>   # fire the test webhook
 */
const fs = require('fs');
const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(`${ROOT}/.env`, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const TEST_PATH = 'podcast-yt-writeback-test-7f3a';
const PROJECT = 'Dmp86aYd0evZH0Dr';
const DB_ID = 'f41e4c92-a7fa-49c5-85d9-a38bae65e24e';
const NOTION_CRED = { notionApi: { id: '4THrcEXnSXOjgtGq', name: 'Notion account' } };
const ZERNIO_CRED = { httpHeaderAuth: { id: '3lVlRePEL7iySnjM', name: 'Zernio Bearer' } };
const YT_ACCOUNT = '69f2ea5c985e734bf3dcfa2f';

async function api(ep, method = 'GET', body) {
  const res = await fetch(`${BASE}${ep}`, {
    method, headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${String(t).slice(0, 500)}`);
  try { return JSON.parse(t); } catch { return t; }
}

const GATE = `
// Pick episodes that have a scheduled Zernio post but no YouTube URL written yet.
const text = (p) => (p && p.rich_text && p.rich_text.map(t => t.plain_text).join('')) || '';
const out = [];
for (const item of $input.all()) {
  const p = item.json.properties || {};
  const postId = text(p['Zernio YT Post ID']);
  const ytUrl = (p['Full Episode YouTube'] && p['Full Episode YouTube'].url) || '';
  if (!postId || ytUrl) continue;
  const ep = String((p['Episode Number'] && p['Episode Number'].number) || '');
  out.push({ json: { pageId: item.json.id, postId, ep } });
}
return out;
`.trim();

const FIND_URL = `
// Index-aligned with Gate (httpRequest preserves order, continues on error).
const gate = $('Gate').all();
const inp = $input.all();
const out = [];
for (let i = 0; i < inp.length; i++) {
  const j = inp[i].json || {};
  const post = j.post || j.data || j;
  const platforms = post.platforms || [];
  const yt = platforms.find(pl =>
    (pl.platform || '').toLowerCase() === 'youtube' ||
    (((pl.accountId && pl.accountId._id) || pl.accountId) === '${YT_ACCOUNT}'));
  const published = yt && /publish|live|complete|posted|success/i.test(yt.status || '');
  const url = published ? (yt.platformPostUrl || yt.url || yt.link || '') : '';
  if (url && gate[i]) out.push({ json: { pageId: gate[i].json.pageId, ytUrl: url, ep: gate[i].json.ep } });
}
return out;
`.trim();

function workflow() {
  const nodes = [
    { id: 'sched', name: 'Every 30 min', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, -120],
      parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } } },
    { id: 'test', name: 'Test Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 100],
      parameters: { httpMethod: 'POST', path: TEST_PATH, responseMode: 'lastNode', options: {} }, webhookId: TEST_PATH },
    { id: 'find', name: 'Find Episodes', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [260, 0],
      parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, value: DB_ID, mode: 'id' }, returnAll: true, simple: false, options: {} },
      credentials: NOTION_CRED },
    { id: 'gate', name: 'Gate', type: 'n8n-nodes-base.code', typeVersion: 2, position: [500, 0],
      parameters: { jsCode: GATE } },
    { id: 'zget', name: 'Get Zernio Post', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [740, 0],
      parameters: { method: 'GET', url: '=https://zernio.com/api/v1/posts/{{ $json.postId }}',
        authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: {} },
      credentials: ZERNIO_CRED, onError: 'continueRegularOutput' },
    { id: 'findurl', name: 'Find YT URL', type: 'n8n-nodes-base.code', typeVersion: 2, position: [980, 0],
      parameters: { jsCode: FIND_URL } },
    { id: 'write', name: 'Write YT URL', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [1220, 0],
      parameters: { resource: 'databasePage', operation: 'update',
        pageId: { __rl: true, value: '={{ $json.pageId }}', mode: 'id' },
        propertiesUi: { propertyValues: [{ key: 'Full Episode YouTube|url', urlValue: '={{ $json.ytUrl }}' }] },
        options: {} },
      credentials: NOTION_CRED },
  ];
  const connections = {
    'Every 30 min': { main: [[{ node: 'Find Episodes', type: 'main', index: 0 }]] },
    'Test Webhook': { main: [[{ node: 'Find Episodes', type: 'main', index: 0 }]] },
    'Find Episodes': { main: [[{ node: 'Gate', type: 'main', index: 0 }]] },
    'Gate': { main: [[{ node: 'Get Zernio Post', type: 'main', index: 0 }]] },
    'Get Zernio Post': { main: [[{ node: 'Find YT URL', type: 'main', index: 0 }]] },
    'Find YT URL': { main: [[{ node: 'Write YT URL', type: 'main', index: 0 }]] },
  };
  return { name: '07 Podcast - YouTube URL Writeback', nodes, connections, settings: { executionOrder: 'v1' } };
}

(async () => {
  const argv = process.argv.slice(2);
  const ti = argv.indexOf('--test'), ui = argv.indexOf('--update');
  if (ti !== -1) {
    const r = await fetch(`${WEBHOOK_BASE}/${TEST_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    console.log(`POST test -> ${r.status}\n${(await r.text()).slice(0, 1500)}`); return;
  }
  const wf = workflow();
  let id;
  if (ui !== -1) { id = argv[ui + 1]; await api(`/workflows/${id}`, 'PUT', wf); console.log(`Updated ${id}`); }
  else {
    const created = await api('/workflows', 'POST', wf); id = created.id; console.log(`Created ${id}  "${created.name}"`);
    try { await api(`/workflows/${id}/transfer`, 'PUT', { destinationProjectId: PROJECT }); } catch {}
  }
  try { await api(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); } catch (e) { console.log('Activate failed:', e.message); }
  console.log(`Test: node scripts/podcast/n8n-build-yt-writeback.cjs --test ${id}`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
