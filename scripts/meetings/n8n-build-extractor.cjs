/**
 * Builds + deploys the "Meetings - Extractor" n8n workflow via the n8n public API.
 * House pattern: construct the workflow JSON, POST /workflows to create (or PUT to
 * update), then activate. Webhook-triggered for testing; swaps to executeWorkflowTrigger
 * once the Live/Backfill drivers are built.
 *
 * v2: meeting-type aware extraction (Opus 4.8) → rich Notion mapping (type, lead,
 * topics, marketing snippets, lessons) + summary email to Roy. Idempotent on UUID.
 *
 * Email delivery: EMAIL_MODE='send' delivers the summary straight to Roy's inbox
 * (testing). Flip to 'draft' when we start emailing clients — it then creates a
 * review-draft instead of sending. Either way it only fires on the live path.
 *
 * Run:
 *   node scripts/meetings/n8n-build-extractor.cjs            # create + activate
 *   node scripts/meetings/n8n-build-extractor.cjs --update <id>
 *   node scripts/meetings/n8n-build-extractor.cjs --test <id> <bundle.json> [--live]
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
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN; // the integration that owns the Meetings DB
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';

const CRED = {
  anthropic: { anthropicApi: { id: 'kDb4i7yT2s5QhpHF', name: 'Anthropic account' } },
  gmail: { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } },
};
const DATA_SOURCE_ID = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const NOTION_VER = '2025-09-03';
const WEBHOOK_PATH = 'meetings-extractor-7f3a';
// Email delivery mode for the summary. 'send' = deliver straight to Roy (testing,
// internal only — no client recipients). 'draft' = create a review-draft instead,
// for when we start emailing clients. Recipient stays Roy until that switch.
const EMAIL_MODE = 'send';                       // 'send' | 'draft'
const EMAIL_TO = 'roy@allthepower.co.uk';
const EMAIL_NODE_NAME = EMAIL_MODE === 'draft' ? 'Email Draft' : 'Email Roy';
const EXTRACT_SYSTEM = fs.readFileSync(path.join(ROOT, 'projects/briefs/zoom-meeting-intelligence/prompts/extract-meeting.md'), 'utf8');

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

// ── node code (backslash-free: newlines via String.fromCharCode(10)) ──────────
const INPUT_CODE = `
const b = $input.first().json.body || $input.first().json;
return [{ json: { uuid: b.uuid, title: b.title, date: b.date, host: b.host || 'me', transcript: b.transcript, live: b.live === true || b.live === 'true' } }];
`.trim();

const PARSE_CODE = `
const raw = $input.first().json.output ?? $input.first().json.text ?? '';
let txt = (typeof raw === 'string' ? raw : JSON.stringify(raw));
const a = txt.indexOf('{'), z = txt.lastIndexOf('}');
const ex = JSON.parse(txt.slice(a, z + 1));
return [{ json: { ex, input: $('Input').first().json } }];
`.trim();

const BUILD_CODE = `
const ex = $('Parse Extraction').first().json.ex, input = $('Parse Extraction').first().json.input;
const DS = '${DATA_SOURCE_ID}';
const NL = String.fromCharCode(10);
const chunk = (s, n) => { n = n || 1900; s = String(s == null ? '' : s); const o = []; for (let i = 0; i < s.length; i += n) o.push(s.slice(i, i + n)); return o.length ? o : ['']; };
const rt = s => chunk(s).map(c => ({ text: { content: c } }));
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Other';
const fmtRoy = a => a.action + (a.due ? ' (due ' + a.due + ')' : '') + (a.context ? ' — ' + a.context : '');
const fmtOther = a => a.owner + ': ' + a.action + (a.due ? ' (due ' + a.due + ')' : '') + (a.context ? ' — ' + a.context : '');
const fmtSnip = s => s.snippet + (s.format ? ' [' + s.format + ']' : '') + (s.why_it_lands ? ' — ' + s.why_it_lands : '') + (s.verbatim ? ' | "' + s.verbatim + '"' : '');
const fmtLes = l => l.lesson + (l.use_for ? ' -> ' + l.use_for : '') + (l.context ? ' (from: ' + l.context + ')' : '');
const fmtObj = o => o.objection + (o.underlying_fear ? ' -> ' + o.underlying_fear : '');
const joinB = (arr, f) => (arr || []).map(x => '• ' + f(x)).join(NL);
const h2 = t => ({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: t } }] } });
const para = t => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: rt(t) } });
const bl = arr => (arr || []).map(x => ({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt(String(x)) } }));
const part = ex.participants || [];
const lead = part.filter(p => p.is_lead)[0] || part[0] || null;
const leadStr = lead ? (lead.name + (lead.role ? ' — ' + lead.role : '') + (lead.company ? ', ' + lead.company : '') + (lead.relationship ? ' (' + lead.relationship + ')' : '')) : '';
const names = part.map(p => p.name).filter(Boolean).join(', ');
const topics = (ex.topics || []).slice(0, 25).map(t => ({ name: String(t).replace(/,/g, ' ').slice(0, 100) }));
const co = ex.coaching || {}, di = ex.discovery_intel || {};
const props = {
  'Name': { title: rt(ex.title || input.title) },
  'Date': { date: { start: ex.date || input.date } },
  'Meeting Type': { select: { name: cap(ex.meeting_type || 'other') } },
  'Lead': { rich_text: rt(leadStr) },
  'Attendees': { rich_text: rt(names) },
  'Topics': { multi_select: topics },
  'One-line': { rich_text: rt(ex.one_line || '') },
  'Summary': { rich_text: rt(ex.summary || '') },
  'Decisions': { rich_text: rt(joinB(ex.decisions, String) || '—') },
  'Action Items (Roy)': { rich_text: rt(joinB(ex.actions_roy, fmtRoy) || '—') },
  'Action Items (Others)': { rich_text: rt(joinB(ex.actions_others, fmtOther) || '—') },
  'Marketing Snippets': { rich_text: rt(joinB(ex.marketing_snippets, fmtSnip) || '—') },
  'Lessons': { rich_text: rt(joinB(ex.lessons, fmtLes) || '—') },
  'Open Questions': { rich_text: rt(joinB(ex.open_questions, String) || '—') },
  'Source': { rich_text: rt(input.uuid) },
  'Status': { select: { name: 'New' } },
};
let children = [h2('Summary'), para(ex.summary || '')];
if (ex.meeting_type === 'coaching') {
  children.push(h2('Coaching'));
  if (co.focus) children.push(para('Focus: ' + co.focus));
  if (co.progress_since_last) children.push(para('Progress: ' + co.progress_since_last));
  if ((co.breakthroughs || []).length) { children.push(para('Breakthroughs:')); children = children.concat(bl(co.breakthroughs)); }
  if ((co.homework || []).length) { children.push(para('Homework:')); children = children.concat(bl(co.homework)); }
  if ((co.watch_for || []).length) { children.push(para('Watch for:')); children = children.concat(bl(co.watch_for)); }
}
if (ex.meeting_type === 'discovery') {
  children.push(h2('Discovery intel'));
  if (di.trapped_assessment) children.push(para(di.trapped_assessment));
  if ((di.pains_stated || []).length) { children.push(para('Pains (stated):')); children = children.concat(bl(di.pains_stated)); }
  if ((di.objections || []).length) { children.push(para('Objections:')); children = children.concat(bl((di.objections || []).map(fmtObj))); }
  if (di.readiness && di.readiness.stage) children.push(para('Readiness: ' + di.readiness.stage));
  if (di.comms_style && di.comms_style.profile) children.push(para('Comms: ' + di.comms_style.profile + (di.comms_style.how_to_adapt ? ' — ' + di.comms_style.how_to_adapt : '')));
}
children.push(h2('Actions — Roy')); children = children.concat(bl((ex.actions_roy || []).map(fmtRoy)));
children.push(h2('Actions — Others')); children = children.concat(bl((ex.actions_others || []).map(fmtOther)));
if ((ex.decisions || []).length) { children.push(h2('Decisions')); children = children.concat(bl(ex.decisions)); }
if ((ex.marketing_snippets || []).length) { children.push(h2('Marketing snippets')); children = children.concat(bl((ex.marketing_snippets || []).map(fmtSnip))); }
if ((ex.lessons || []).length) { children.push(h2('Lessons')); children = children.concat(bl((ex.lessons || []).map(fmtLes))); }
if ((ex.notable_quotes || []).length) { children.push(h2('Notable quotes')); children = children.concat(bl(ex.notable_quotes)); }
if ((ex.open_questions || []).length) { children.push(h2('Open questions')); children = children.concat(bl(ex.open_questions)); }
if ((ex.topics || []).length) { children.push(h2('Topics')); children.push(para((ex.topics || []).join(', '))); }
children.push(h2('Full transcript')); children = children.concat(chunk(input.transcript, 1900).slice(0, 45).map(para));
children = children.slice(0, 95);
const L = [];
L.push(ex.one_line || ex.summary || '');
L.push('');
if ((ex.actions_roy || []).length) { L.push('YOUR ACTIONS:'); (ex.actions_roy || []).forEach(a => L.push('  • ' + fmtRoy(a))); L.push(''); }
if ((ex.actions_others || []).length) { L.push('THEIR ACTIONS:'); (ex.actions_others || []).forEach(a => L.push('  • ' + fmtOther(a))); L.push(''); }
if ((co.watch_for || []).length) { L.push('WATCH FOR:'); (co.watch_for || []).forEach(w => L.push('  • ' + w)); L.push(''); }
if ((ex.marketing_snippets || []).length) { L.push('MARKETING SNIPPETS:'); (ex.marketing_snippets || []).slice(0, 4).forEach(s => L.push('  • ' + fmtSnip(s))); L.push(''); }
if ((ex.lessons || []).length) { L.push('LESSONS:'); (ex.lessons || []).slice(0, 4).forEach(l => L.push('  • ' + fmtLes(l))); }
return [{ json: { pageBody: { parent: { type: 'data_source_id', data_source_id: DS }, properties: props, children: children }, emailSubject: 'Meeting — ' + (ex.title || input.title) + ' (' + (ex.date || input.date) + ')', emailText: L.join(NL) } }];
`.trim();

const AGENT_TEXT = `=${EXTRACT_SYSTEM}\n\nMeeting metadata:\n- Title: {{ $('Input').first().json.title }}\n- Date: {{ $('Input').first().json.date }}\n- Host: {{ $('Input').first().json.host }}\n\nTranscript (speaker-labelled, cleaned):\n\n{{ $('Input').first().json.transcript }}\n\nReturn ONLY the JSON object described in the schema — start with { and end with }.`;

// ── workflow definition ──────────────────────────────────────────────────────
function workflow() {
  const notionHeaders = { parameters: [{ name: 'Authorization', value: `Bearer ${NOTION}` }, { name: 'Notion-Version', value: NOTION_VER }] };
  const nodes = [
    { id: 'webhook', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0],
      parameters: { httpMethod: 'POST', path: WEBHOOK_PATH, responseMode: 'lastNode', options: {} }, webhookId: WEBHOOK_PATH },
    { id: 'input', name: 'Input', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0],
      parameters: { jsCode: INPUT_CODE } },
    { id: 'model', name: 'Anthropic Chat Model', type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', typeVersion: 1.3, position: [300, 220],
      parameters: { model: { __rl: true, value: 'claude-opus-4-8', mode: 'list', cachedResultName: 'Claude Opus 4.8' }, options: { maxTokensToSample: 8000 } },
      credentials: CRED.anthropic },
    { id: 'agent', name: 'Extract', type: '@n8n/n8n-nodes-langchain.agent', typeVersion: 2.2, position: [460, 0],
      parameters: { promptType: 'define', text: AGENT_TEXT, options: {} } },
    { id: 'parse', name: 'Parse Extraction', type: 'n8n-nodes-base.code', typeVersion: 2, position: [680, 0],
      parameters: { jsCode: PARSE_CODE } },
    { id: 'nquery', name: 'Notion Query', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [900, 0],
      parameters: { method: 'POST', url: `https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`,
        sendHeaders: true, headerParameters: notionHeaders,
        sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: "={{ JSON.stringify({ filter: { property: 'Source', rich_text: { contains: $('Input').first().json.uuid } }, page_size: 1 }) }}",
        options: {} } },
    { id: 'ifnew', name: 'Is New?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1120, 0],
      parameters: { conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
        conditions: [{ leftValue: '={{ $json.results.length }}', rightValue: 0, operator: { type: 'number', operation: 'equals' } }] } } },
    { id: 'build', name: 'Build Page', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1340, -100],
      parameters: { jsCode: BUILD_CODE } },
    { id: 'ncreate', name: 'Notion Create', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1560, -100],
      parameters: { method: 'POST', url: 'https://api.notion.com/v1/pages',
        sendHeaders: true, headerParameters: notionHeaders,
        sendBody: true, contentType: 'raw', rawContentType: 'application/json',
        body: '={{ JSON.stringify($json.pageBody) }}', options: {} } },
    { id: 'iflive', name: 'Is Live?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1780, -100],
      parameters: { conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
        conditions: [{ leftValue: "={{ $('Input').first().json.live }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] } } },
    (EMAIL_MODE === 'draft'
      ? { id: 'email', name: EMAIL_NODE_NAME, type: 'n8n-nodes-base.gmail', typeVersion: 2.2, position: [2000, -200],
          parameters: { resource: 'draft', operation: 'create',
            subject: "={{ $('Build Page').first().json.emailSubject }}",
            emailType: 'text', message: "={{ $('Build Page').first().json.emailText }}",
            options: { sendTo: EMAIL_TO } }, credentials: CRED.gmail }
      : { id: 'email', name: EMAIL_NODE_NAME, type: 'n8n-nodes-base.gmail', typeVersion: 2.2, position: [2000, -200],
          parameters: { resource: 'message', operation: 'send', sendTo: EMAIL_TO,
            subject: "={{ $('Build Page').first().json.emailSubject }}",
            emailType: 'text', message: "={{ $('Build Page').first().json.emailText }}",
            options: { appendAttribution: false } }, credentials: CRED.gmail }),
    { id: 'skip', name: 'Skipped', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1340, 140],
      parameters: { jsCode: "return [{ json: { status: 'skipped — already in Notion', uuid: $('Input').first().json.uuid } }];" } },
  ];

  const connections = {
    Webhook: { main: [[{ node: 'Input', type: 'main', index: 0 }]] },
    Input: { main: [[{ node: 'Notion Query', type: 'main', index: 0 }]] },
    'Notion Query': { main: [[{ node: 'Is New?', type: 'main', index: 0 }]] },
    'Is New?': { main: [[{ node: 'Extract', type: 'main', index: 0 }], [{ node: 'Skipped', type: 'main', index: 0 }]] },
    'Anthropic Chat Model': { ai_languageModel: [[{ node: 'Extract', type: 'ai_languageModel', index: 0 }]] },
    Extract: { main: [[{ node: 'Parse Extraction', type: 'main', index: 0 }]] },
    'Parse Extraction': { main: [[{ node: 'Build Page', type: 'main', index: 0 }]] },
    'Build Page': { main: [[{ node: 'Notion Create', type: 'main', index: 0 }]] },
    'Notion Create': { main: [[{ node: 'Is Live?', type: 'main', index: 0 }]] },
    'Is Live?': { main: [[{ node: EMAIL_NODE_NAME, type: 'main', index: 0 }], []] },
  };

  return { name: 'Meetings - Extractor', nodes, connections, settings: { executionOrder: 'v1' } };
}

(async () => {
  const argv = process.argv.slice(2);
  const ti = argv.indexOf('--test');
  const ui = argv.indexOf('--update');

  if (ti !== -1) {
    const id = argv[ti + 1];
    const bundle = JSON.parse(fs.readFileSync(argv[ti + 2], 'utf8'));
    const live = argv.includes('--live');
    const payload = { uuid: bundle.meta.uuid, title: bundle.meta.title, date: bundle.meta.date, host: bundle.meta.host, transcript: bundle.transcript, live };
    console.log(`POST ${WEBHOOK_BASE}/${WEBHOOK_PATH}  (live=${live}, ${payload.transcript.length} chars)`);
    const r = await fetch(`${WEBHOOK_BASE}/${WEBHOOK_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const t = await r.text();
    console.log(`-> ${r.status}\n${t.slice(0, 1500)}`);
    return;
  }

  const wf = workflow();
  let id;
  if (ui !== -1) {
    id = argv[ui + 1];
    await api(`/workflows/${id}`, 'PUT', wf);
    console.log(`Updated workflow ${id}`);
  } else {
    const created = await api('/workflows', 'POST', wf);
    id = created.id;
    console.log(`Created workflow: ${id}  "${created.name}"`);
  }
  try { await api(`/workflows/${id}/activate`, 'POST'); console.log('Activated.'); }
  catch (e) { console.log('Activate failed:', e.message); }
  console.log(`Webhook: ${WEBHOOK_BASE}/${WEBHOOK_PATH}`);
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
