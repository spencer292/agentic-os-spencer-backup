/**
 * 92 Ops - LLM Usage Report — weekly Anthropic + OpenAI API usage/cost email (2026-07-06, Roy request).
 *
 * Pulls the org-wide Usage & Cost Admin APIs from both providers and emails a summary to
 * Roy + Laura every Monday 08:15 (right after P91's estate audit). Covers ALL org API usage —
 * the podcast content engine (P03) plus every other agent using the same org keys.
 *
 * Keys live in n8n Variables (created empty by this script; fill in n8n → Settings → Variables):
 *   ANTHROPIC_ADMIN_KEY  — Console → Settings → Admin API keys (sk-ant-admin01-..., org accounts only)
 *   OPENAI_ADMIN_KEY     — platform.openai.com/settings/organization/admin-keys
 * Until a key is set, that provider's section of the email shows setup instructions instead of failing.
 *
 * node scripts/admin/n8n-build-llm-usage-report.cjs              # create + transfer + activate
 * node scripts/admin/n8n-build-llm-usage-report.cjs --update <id> # update in place
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

async function api(path, method = 'GET', body) {
  const r = await fetch(base + path, {
    method, headers: { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

const PREP_CODE = `// Last 7 full days (UTC midnight to UTC midnight).
const end = new Date(); end.setUTCHours(0, 0, 0, 0);
const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
return [{ json: {
  startISO: start.toISOString().replace(/\\.\\d{3}Z$/, 'Z'),
  endISO: end.toISOString().replace(/\\.\\d{3}Z$/, 'Z'),
  startUnix: Math.floor(start.getTime() / 1000),
  endUnix: Math.floor(end.getTime() / 1000),
  rangeLabel: start.toISOString().slice(0, 10) + ' → ' + end.toISOString().slice(0, 10),
} }];`;

const SUMMARIZE_CODE = `// Build the report email from whichever provider calls succeeded.
const prep = $('Prep Range').first().json;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = n => Number(n || 0).toLocaleString('en-GB');

function grab(name) {
  try {
    const j = $(name).first().json;
    if (j && (j.error || j.message && j.status)) return { err: JSON.stringify(j).slice(0, 200) };
    return { data: j };
  } catch (e) { return { err: e.message }; }
}

const aUse = grab('Anthropic Usage');
const aCost = grab('Anthropic Cost');
const oUse = grab('OpenAI Usage');
const oCost = grab('OpenAI Cost');

const keyMissing = (v) => !$vars[v] || String($vars[v]).length < 10 || String($vars[v]).includes('REPLACE');
const rows = [];

// ---- Anthropic tokens by model ----
let aSection = '';
if (keyMissing('ANTHROPIC_ADMIN_KEY')) {
  aSection = '<em>Not configured yet — create an Admin API key in the Anthropic Console (Settings → Admin API keys, org accounts only) and paste it into n8n → Settings → Variables → ANTHROPIC_ADMIN_KEY.</em>';
} else if (aUse.err) {
  aSection = '<em>Usage fetch failed: ' + esc(aUse.err) + '</em>';
} else {
  const byModel = {};
  for (const bucket of (aUse.data.data || [])) {
    for (const r of (bucket.results || [])) {
      const model = r.model || 'all models';
      const t = byModel[model] = byModel[model] || { input: 0, cacheRead: 0, output: 0 };
      t.input += (r.uncached_input_tokens || 0) + (r.cache_creation_input_tokens || 0)
        + (r.cache_creation && (r.cache_creation.ephemeral_5m_input_tokens || 0) + (r.cache_creation.ephemeral_1h_input_tokens || 0) || 0);
      t.cacheRead += r.cache_read_input_tokens || 0;
      t.output += r.output_tokens || 0;
    }
  }
  const trs = Object.entries(byModel).map(([m, t]) =>
    '<tr><td style="padding:4px 12px 4px 0">' + esc(m) + '</td><td style="padding:4px 12px;text-align:right">' + fmt(t.input) + '</td><td style="padding:4px 12px;text-align:right">' + fmt(t.cacheRead) + '</td><td style="padding:4px 0 4px 12px;text-align:right">' + fmt(t.output) + '</td></tr>').join('');
  aSection = trs
    ? '<table style="border-collapse:collapse;font-size:13px"><tr style="color:#8a8a80;font-size:11px;text-transform:uppercase"><td>Model</td><td style="padding-left:12px;text-align:right">Input</td><td style="padding-left:12px;text-align:right">Cache read</td><td style="padding-left:12px;text-align:right">Output</td></tr>' + trs + '</table>'
    : '<em>No usage in this period.</em>';
  // cost
  if (!aCost.err) {
    let cents = 0;
    for (const bucket of (aCost.data.data || [])) for (const r of (bucket.results || [])) {
      const v = r.amount && (typeof r.amount === 'object' ? r.amount.value : r.amount);
      const n = parseFloat(v); if (!isNaN(n)) cents += n;
    }
    aSection += '<div style="padding-top:8px;font-size:14px"><strong>Cost: $' + (cents / 100).toFixed(2) + '</strong> (USD, 7 days)</div>';
  }
}

// ---- OpenAI ----
let oSection = '';
if (keyMissing('OPENAI_ADMIN_KEY')) {
  oSection = '<em>Not configured yet — create an Admin key at platform.openai.com/settings/organization/admin-keys and paste it into n8n → Settings → Variables → OPENAI_ADMIN_KEY.</em>';
} else if (oUse.err) {
  oSection = '<em>Usage fetch failed: ' + esc(oUse.err) + '</em>';
} else {
  let inTok = 0, outTok = 0;
  for (const bucket of (oUse.data.data || [])) for (const r of (bucket.results || [])) {
    inTok += r.input_tokens || 0; outTok += r.output_tokens || 0;
  }
  oSection = '<div style="font-size:13px">Input tokens: <strong>' + fmt(inTok) + '</strong> · Output tokens: <strong>' + fmt(outTok) + '</strong></div>';
  if (!oCost.err) {
    let usd = 0;
    for (const bucket of (oCost.data.data || [])) for (const r of (bucket.results || [])) {
      const v = r.amount && (typeof r.amount === 'object' ? r.amount.value : r.amount);
      const n = parseFloat(v); if (!isNaN(n)) usd += n;
    }
    oSection += '<div style="padding-top:8px;font-size:14px"><strong>Cost: $' + usd.toFixed(2) + '</strong> (USD, 7 days)</div>';
  }
}

const GREEN = '#5E5C2B', DARK = '#333538';
const section = (title, inner) =>
  '<div style="margin-top:20px"><div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + GREEN + ';padding-bottom:6px">' + title + '</div>' + inner + '</div>';
const html =
  '<div style="font-family:Montserrat,Segoe UI,Arial,sans-serif;max-width:640px">' +
  '<div style="background:' + DARK + ';color:#fff;padding:16px 22px;border-radius:10px 10px 0 0"><div style="font-size:16px;font-weight:700">LLM API usage report</div>' +
  '<div style="color:#c9c9bd;font-size:12px;padding-top:2px">' + esc(prep.rangeLabel) + ' · whole org (content engine + all other agents)</div></div>' +
  '<div style="border:1px solid #e2e2dc;border-top:none;border-radius:0 0 10px 10px;padding:6px 22px 20px">' +
  section('Anthropic (Claude)', aSection) +
  section('OpenAI', oSection) +
  '</div></div>';

return [{ json: { html, subject: '🧾 LLM API usage — ' + prep.rangeLabel } }];`;

function workflow() {
  const http = (id, name, x, urlExpr, headers) => ({
    id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [x, 0],
    parameters: {
      url: urlExpr, method: 'GET',
      sendHeaders: true,
      headerParameters: { parameters: headers },
      options: {},
    },
    onError: 'continueRegularOutput',
  });
  const nodes = [
    { id: 'trigger', name: 'Weekly Trigger', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 0],
      parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 8, triggerAtMinute: 15 }] } } },
    { id: 'prep', name: 'Prep Range', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0],
      parameters: { jsCode: PREP_CODE } },
    http('ause', 'Anthropic Usage', 440,
      "=https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at={{ $json.startISO }}&ending_at={{ $json.endISO }}&group_by[]=model&bucket_width=1d&limit=31",
      [{ name: 'anthropic-version', value: '2023-06-01' }, { name: 'x-api-key', value: '={{ $vars.ANTHROPIC_ADMIN_KEY }}' }]),
    http('acost', 'Anthropic Cost', 660,
      "=https://api.anthropic.com/v1/organizations/cost_report?starting_at={{ $('Prep Range').item.json.startISO }}&ending_at={{ $('Prep Range').item.json.endISO }}&limit=31",
      [{ name: 'anthropic-version', value: '2023-06-01' }, { name: 'x-api-key', value: '={{ $vars.ANTHROPIC_ADMIN_KEY }}' }]),
    http('ouse', 'OpenAI Usage', 880,
      "=https://api.openai.com/v1/organization/usage/completions?start_time={{ $('Prep Range').item.json.startUnix }}&end_time={{ $('Prep Range').item.json.endUnix }}&bucket_width=1d&limit=7",
      [{ name: 'Authorization', value: '=Bearer {{ $vars.OPENAI_ADMIN_KEY }}' }]),
    http('ocost', 'OpenAI Cost', 1100,
      "=https://api.openai.com/v1/organization/costs?start_time={{ $('Prep Range').item.json.startUnix }}&end_time={{ $('Prep Range').item.json.endUnix }}&limit=7",
      [{ name: 'Authorization', value: '=Bearer {{ $vars.OPENAI_ADMIN_KEY }}' }]),
    { id: 'sum', name: 'Summarize', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1320, 0],
      parameters: { jsCode: SUMMARIZE_CODE } },
    { id: 'mail', name: 'Email Report', type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1540, 0],
      parameters: { sendTo: 'roy@allthepower.co.uk', subject: '={{ $json.subject }}', emailType: 'html',
        message: '={{ $json.html }}', options: { ccList: 'laura@atpbos.com' } },
      credentials: GMAIL_CRED },
  ];
  const connections = {
    'Weekly Trigger': { main: [[{ node: 'Prep Range', type: 'main', index: 0 }]] },
    'Prep Range': { main: [[{ node: 'Anthropic Usage', type: 'main', index: 0 }]] },
    'Anthropic Usage': { main: [[{ node: 'Anthropic Cost', type: 'main', index: 0 }]] },
    'Anthropic Cost': { main: [[{ node: 'OpenAI Usage', type: 'main', index: 0 }]] },
    'OpenAI Usage': { main: [[{ node: 'OpenAI Cost', type: 'main', index: 0 }]] },
    'OpenAI Cost': { main: [[{ node: 'Summarize', type: 'main', index: 0 }]] },
    'Summarize': { main: [[{ node: 'Email Report', type: 'main', index: 0 }]] },
  };
  return { name: '92 Ops - LLM Usage Report', nodes, connections,
    settings: { executionOrder: 'v1', errorWorkflow: P90 } };
}

(async () => {
  if (!NKEY) throw new Error('N8N_API_KEY missing');
  // ensure the variables exist (empty placeholders; Roy fills them in the n8n UI)
  for (const key of ['ANTHROPIC_ADMIN_KEY', 'OPENAI_ADMIN_KEY']) {
    try { await api('/variables', 'POST', { key, value: 'REPLACE_ME' }); console.log(`variable created: ${key}`); }
    catch (e) { console.log(`variable ${key}: ${/already|exists|409/i.test(e.message) ? 'already exists' : e.message}`); }
  }
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
  console.log('ACTIVE. Runs Mondays 08:15. Fill ANTHROPIC_ADMIN_KEY + OPENAI_ADMIN_KEY in n8n → Settings → Variables.');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
