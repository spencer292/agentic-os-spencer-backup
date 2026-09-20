/**
 * 09 Podcast - Approve by Reply — reply "approved" to the "Content ready for review"
 * email and the episode flips to Ready to Publish automatically (2026-07-05, Roy request).
 *
 * Flow: Gmail Trigger (5-min poll, subject-filtered) -> Approval Gate (reply only,
 * from Roy, contains "approve/approved") -> Find Episodes (Notion) -> Match Episode
 * (guest from subject + status must be Content Review; throws to P90 if no match)
 * -> Flip to Ready to Publish -> confirmation email to Roy + Laura.
 *
 * Notes: edits to the 4 docs must be made BEFORE replying "approved" — P04 parses the
 * show-notes doc as soon as it runs. Original notifications never match (replies only).
 *
 * node scripts/podcast/n8n-build-approval-reply.cjs              # create + transfer + activate
 * node scripts/podcast/n8n-build-approval-reply.cjs --update <id> # update in place
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const base = 'https://allthepower.app.n8n.cloud/api/v1';
const PROJECT = 'Dmp86aYd0evZH0Dr';
const P90 = '7P8rKQ3agA3rXTzk';
const GMAIL_CRED = { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } };
const NOTION_CRED = { notionApi: { id: '4THrcEXnSXOjgtGq', name: 'Notion account' } };
const EPISODES_DB = 'f41e4c92-a7fa-49c5-85d9-a38bae65e24e';

async function api(path, method = 'GET', body) {
  const r = await fetch(base + path, {
    method, headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

const APPROVAL_GATE = `// Only genuine approval replies from Roy (never the original notification).
// Hardened 2026-07-06 (Codex review): quoted-text guard + episode number parsed from the subject.
const out = [];
for (const item of $input.all()) {
  const j = item.json;
  const subject = j.Subject || j.subject || '';
  const from = String(j.From || j.from || '').toLowerCase();
  let snippet = String(j.snippet || '');
  if (!/^\\s*re:/i.test(subject)) continue;
  if (!/roy@allthepower\\.co\\.uk|roy@atpbos\\.com/.test(from)) continue;
  // The review email's own callout contains the word "approved", and Gmail snippets can
  // bleed into quoted text — only the fresh reply text near the top counts.
  const q = snippet.search(/\\bOn .{5,80}wrote:/i);
  if (q >= 0) snippet = snippet.slice(0, q);
  if (!/\\bapproved?\\b/i.test(snippet.slice(0, 80))) continue;
  const m = subject.match(/content ready for review:\\s*(.+)$/i);
  if (!m) continue;
  const em = m[1].match(/^ep\\s*(\\d+)\\b/i);
  const epNum = em ? Number(em[1]) : null;
  const guest = m[1].replace(/^ep\\s*\\d+\\s*[—–-]\\s*/i, '').split(':')[0].trim();
  out.push({ json: { guest, epNum, subject } });
}
return out;`;

const MATCH_EPISODE = `// Resolve the approval to EXACTLY ONE episode in Content Review (2026-07-06: prefer the
// episode number parsed from the subject; ambiguous guest-name matches fail loudly).
const g0 = $('Approval Gate').first().json;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const g = norm(g0.guest);
const text = (p) => (p && p.rich_text && p.rich_text[0] && p.rich_text[0].plain_text) || '';
const candidates = [];
for (const item of $input.all()) {
  const p = item.json.properties || {};
  const status = (p['Episode Status'] && p['Episode Status'].select && p['Episode Status'].select.name) || '';
  if (status !== 'Content Review') continue;
  const ep = p['Episode Number'] && p['Episode Number'].number;
  if (g0.epNum != null) {
    if (ep === g0.epNum) candidates.push({ item, ep, p });
    continue;
  }
  const first = text(p['Guest First Name']);
  const last = text(p['Guest Last Name']);
  if (!first || !last) continue;
  if (g.includes(norm(first)) && g.includes(norm(last))) candidates.push({ item, ep, p });
}
if (!candidates.length) throw new Error('Approval reply for "' + (g0.epNum != null ? 'Ep ' + g0.epNum : g0.guest) + '" matched no episode in Content Review — nothing was flipped.');
if (candidates.length > 1) throw new Error('Approval reply for "' + g0.guest + '" is ambiguous (' + candidates.length + ' episodes in Content Review) — nothing was flipped. Approve in Notion or include the episode number.');
const c = candidates[0];
const cf = text(c.p['Guest First Name']);
const cl = text(c.p['Guest Last Name']);
return [{ json: { pageId: c.item.json.id, ep: c.ep, guest: (cf + ' ' + cl).trim() } }];`;

function workflow() {
  const nodes = [
    { id: 'trigger', name: 'Reply Received', type: 'n8n-nodes-base.gmailTrigger', typeVersion: 1.2, position: [0, 0],
      parameters: {
        pollTimes: { item: [{ mode: 'everyX', value: 5, unit: 'minutes' }] },
        event: 'messageReceived',
        simple: true,
        filters: { q: 'subject:"Content ready for review"' },
        options: {},
      }, credentials: GMAIL_CRED },
    { id: 'gate', name: 'Approval Gate', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 0],
      parameters: { jsCode: APPROVAL_GATE } },
    { id: 'find', name: 'Find Episodes', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [480, 0],
      parameters: { resource: 'databasePage', operation: 'getAll',
        databaseId: { __rl: true, value: EPISODES_DB, mode: 'id' }, returnAll: true, simple: false, options: {} },
      credentials: NOTION_CRED },
    { id: 'match', name: 'Match Episode', type: 'n8n-nodes-base.code', typeVersion: 2, position: [720, 0],
      parameters: { jsCode: MATCH_EPISODE } },
    { id: 'flip', name: 'Flip to Ready to Publish', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [960, 0],
      parameters: { resource: 'databasePage', operation: 'update',
        pageId: { __rl: true, value: "={{ $json.pageId }}", mode: 'id' },
        propertiesUi: { propertyValues: [{ key: 'Episode Status|select', selectValue: 'Ready to Publish' }] }, options: {} },
      credentials: NOTION_CRED },
    { id: 'confirm', name: 'Confirm to Roy + Laura', type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1200, 0],
      parameters: {
        sendTo: 'roy@allthepower.co.uk',
        subject: "=✅ Approved by reply: Ep {{ $('Match Episode').item.json.ep }} {{ $('Match Episode').item.json.guest }} → Ready to Publish",
        emailType: 'text',
        message: "=Your email reply approved Ep {{ $('Match Episode').item.json.ep }} ({{ $('Match Episode').item.json.guest }}).\n\nStatus flipped to Ready to Publish — the Captivate draft will be created within ~15 minutes and you'll both get the 'Captivate draft created' email.\n\nReminder: doc edits only count if made before replying 'approved' — the publish steps parse the docs as they run.",
        options: { ccList: 'laura@atpbos.com' },
      }, credentials: GMAIL_CRED },
  ];
  const connections = {
    'Reply Received': { main: [[{ node: 'Approval Gate', type: 'main', index: 0 }]] },
    'Approval Gate': { main: [[{ node: 'Find Episodes', type: 'main', index: 0 }]] },
    'Find Episodes': { main: [[{ node: 'Match Episode', type: 'main', index: 0 }]] },
    'Match Episode': { main: [[{ node: 'Flip to Ready to Publish', type: 'main', index: 0 }]] },
    'Flip to Ready to Publish': { main: [[{ node: 'Confirm to Roy + Laura', type: 'main', index: 0 }]] },
  };
  return { name: '09 Podcast - Approve by Reply', nodes, connections,
    settings: { executionOrder: 'v1', errorWorkflow: P90 } };
}

(async () => {
  if (!NKEY) throw new Error('N8N_API_KEY missing');
  const argv = process.argv.slice(2);
  const ui = argv.indexOf('--update');
  const wf = workflow();
  let id;
  if (ui !== -1) {
    id = argv[ui + 1];
    await api(`/workflows/${id}`, 'PUT', wf);
    console.log(`Updated workflow ${id}`);
  } else {
    const c = await api('/workflows', 'POST', wf); id = c.id;
    console.log(`Created workflow ${id} "${c.name}"`);
    await api(`/workflows/${id}/transfer`, 'PUT', { destinationProjectId: PROJECT }).catch(e => console.log('transfer:', e.message));
  }
  await api(`/workflows/${id}/activate`, 'POST');
  console.log(`ACTIVE. Reply "approved" to any "Content ready for review" email and the episode flips within ~5 minutes.`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
