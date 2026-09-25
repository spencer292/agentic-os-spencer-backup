/**
 * Build / update "91 Ops - n8n Estate Audit" (id lvbcw3D5As5hUHj7).
 *
 * WHY THIS WAS REBUILT (2026-08-11)
 * ---------------------------------
 * The audit was the thing that should have caught the throwaway-workflow leak
 * (see scripts/lib/n8n-temp-workflow.cjs). It missed it twice over:
 *
 *   1. It ran WEEKLY (Monday 08:00). The leak started mid-Monday, so the next
 *      look would have been six days later.
 *   2. "List Workflows" fetched `?limit=250` with NO pagination. Once 4,652 junk
 *      `ZZ TEMP` workflows existed, the entire 250-row sample was junk and the
 *      113 real workflows did not appear in the report at all. The audit did not
 *      just miss the leak — the leak made the audit blind to everything else.
 *
 * What changed:
 *   - daily, not weekly
 *   - the workflow list is fully paginated via the `cursor` query param
 *   - `ZZ TEMP` temps are counted and reported SEPARATELY, so they can never
 *     crowd real workflows out of the report
 *   - a hard alert (subject line + top-of-report banner) when temps exceed the
 *     threshold, i.e. when teardown is failing again
 *   - an on-demand webhook trigger so the audit can be run and verified without
 *     waiting for the schedule
 *
 * Usage:
 *   node scripts/admin/n8n-build-estate-audit.cjs            # update in place
 *   node scripts/admin/n8n-build-estate-audit.cjs --dry      # print, change nothing
 */
'use strict';

const fs = require('fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* rely on process.env */ }

const N8N = 'https://allthepower.app.n8n.cloud/api/v1';
const WF_ID = 'lvbcw3D5As5hUHj7';
const API_CRED = { httpHeaderAuth: { id: 'kqatkI5gm1d09S6E', name: 'n8n API (header)' } };
const GMAIL_CRED = { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } };
const ERROR_WF = '7P8rKQ3agA3rXTzk';
const RUN_NOW_PATH = 'ops-estate-audit-run-9f2c71ab';

/** Temps above this on a routine daily look mean teardown is broken again. */
const TEMP_ALERT_THRESHOLD = 25;

/** How far back "runs in sample" must reach before calling a workflow idle. */
const EXEC_WINDOW_DAYS = 7;

// Executions are far more numerous than workflows; cap the pages so the audit stays
// cheap, then trim by time in the Code node and report the window actually covered.
const execPagination = {
  pagination: {
    pagination: {
      paginationMode: 'updateAParameterInEachRequest',
      parameters: {
        parameters: [{ type: 'qs', name: 'cursor', value: '={{ $response.body.nextCursor }}' }],
      },
      paginationCompleteWhen: 'other',
      completeExpression: '={{ !$response.body.nextCursor }}',
      limitPagesFetched: true,
      maxRequestsPerPage: 20,
    },
  },
};

// Paginate the n8n API by following `nextCursor` until it is absent.
const cursorPagination = {
  pagination: {
    pagination: {
      paginationMode: 'updateAParameterInEachRequest',
      parameters: {
        parameters: [{ type: 'qs', name: 'cursor', value: '={{ $response.body.nextCursor }}' }],
      },
      paginationCompleteWhen: 'other',
      completeExpression: '={{ !$response.body.nextCursor }}',
      limitPagesFetched: true,
      maxRequestsPerPage: 100,
    },
  },
};

const auditCode = `
// Estate audit. Rebuilt 2026-08-11 — see scripts/admin/n8n-build-estate-audit.cjs.
// The workflow list is PAGINATED, so this node receives one item per page and must
// flatten them. Reading only .item.json.data would silently see the first page only,
// which is the exact failure that let 4,652 junk workflows hide the real estate.
const TEMP_PREFIX = 'ZZ TEMP';
const THRESHOLD = ${TEMP_ALERT_THRESHOLD};

const pages = $('List Workflows').all();
let wfs = [];
for (const p of pages) wfs = wfs.concat(p.json.data || []);

// Dedupe by execution id. "List Workflows" emits one item PER PAGE, so without
// executeOnce the executions node would run once per page and the same execution
// would be counted N times — which is how an early build reported "544 runs" from a
// 250-execution sample. executeOnce is set on the node; this is the belt-and-braces.
const WINDOW_DAYS = ${EXEC_WINDOW_DAYS};
const execPages = $('Recent Executions').all();
const seenExec = new Set();
const allExecs = [];
for (const p of execPages) {
  for (const e of (p.json.data || [])) {
    if (seenExec.has(e.id)) continue;
    seenExec.add(e.id);
    allExecs.push(e);
  }
}
// Trim to a TIME window. "No runs in sample" is only meaningful if the sample
// actually reaches back far enough; state the window so the reader can judge it.
const cutoff = Date.now() - WINDOW_DAYS * 86400000;
const stamp = (e) => new Date(e.startedAt || e.createdAt || 0).getTime();
const execs = allExecs.filter(e => stamp(e) >= cutoff);
// Ignore unparseable/zero timestamps — one bad row would otherwise drag the
// "reaching back" figure to the epoch and claim coverage the fetch never had.
const validStamps = allExecs.map(stamp).filter(t => t > 864e5);
const oldestFetched = validStamps.length ? Math.min(...validStamps) : Date.now();
const coversWindow = oldestFetched <= cutoff;

const temps = wfs.filter(w => String(w.name || '').startsWith(TEMP_PREFIX));
const real  = wfs.filter(w => !String(w.name || '').startsWith(TEMP_PREFIX));

const byWf = {};
for (const e of execs) (byWf[e.workflowId] = byWf[e.workflowId] || []).push(e);
const when = (e) => e.startedAt || e.createdAt || '';
const fmt = (iso) => (iso || '').slice(0, 16).replace('T', ' ');

const lines = [];
const alerting = temps.length > THRESHOLD;

if (alerting) {
  lines.push('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  lines.push('!! ' + temps.length + ' throwaway "' + TEMP_PREFIX + '" workflows on the instance.');
  lines.push('!! Threshold is ' + THRESHOLD + '. Teardown is FAILING — temp workflows are leaking.');
  lines.push('!!');
  lines.push('!! Diagnose : node scripts/lib/n8n-temp-workflow.cjs doctor');
  lines.push('!! Clean up : node scripts/lib/n8n-temp-workflow.cjs sweep --apply');
  lines.push('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  lines.push('');
}

// Oldest temps first — the age of the oldest is how long the leak has been running.
if (temps.length) {
  const sorted = temps.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  lines.push('=== 0. THROWAWAY TEMP WORKFLOWS (' + temps.length + ') ===');
  lines.push('Oldest: ' + fmt(sorted[0].createdAt) + '  ·  newest: ' + fmt(sorted[sorted.length - 1].createdAt));
  const byTag = {};
  for (const w of temps) {
    const m = String(w.name).match(/zz-([a-z]+)-/);
    const tag = m ? m[1] : 'other';
    byTag[tag] = (byTag[tag] || 0) + 1;
  }
  for (const [t, n] of Object.entries(byTag).sort((a, b) => b[1] - a[1])) {
    lines.push('  ' + n + '  from zz-' + t + '-*');
  }
  lines.push('');
}

const active = real.filter(w => w.active).sort((a, b) => a.name.localeCompare(b.name));
const inactive = real.filter(w => !w.active);

lines.push('=== 1. ACTIVE WORKFLOWS (' + active.length + ') — last execution in sample ===');
const neverRan = [];
for (const w of active) {
  const ex = (byWf[w.id] || []).slice().sort((a, b) => new Date(when(b)) - new Date(when(a)));
  if (ex.length) {
    lines.push('- ' + w.name + ' — last run ' + fmt(when(ex[0])) + ' (' + (ex[0].status || 'unknown') + ', ' + ex.length + ' run' + (ex.length === 1 ? '' : 's') + ' in sample)');
  } else {
    lines.push('- ' + w.name + ' — NO RUNS IN SAMPLE');
    neverRan.push(w.name);
  }
}

lines.push('');
lines.push('=== 2. ACTIVE BUT NO RUNS IN SAMPLE (' + neverRan.length + ') ===');
if (neverRan.length) for (const n of neverRan) lines.push('- ' + n);
else lines.push('(none — every active workflow ran recently)');

lines.push('');
const stale = inactive.slice().sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
lines.push('=== 3. INACTIVE WORKFLOWS (' + inactive.length + ') — stale candidates, 15 oldest by updatedAt ===');
for (const w of stale.slice(0, 15)) lines.push('- ' + w.name + ' (updated ' + String(w.updatedAt || 'unknown').slice(0, 10) + ')');
if (!inactive.length) lines.push('(none)');

lines.push('');
const errs = execs.filter(e => e.status === 'error' || e.status === 'failed' || e.status === 'crashed');
const errByWf = {};
for (const e of errs) {
  const name = (wfs.find(w => w.id === e.workflowId) || {}).name || ('workflow ' + e.workflowId);
  errByWf[name] = (errByWf[name] || 0) + 1;
}
lines.push('=== 4. ERROR EXECUTIONS IN SAMPLE (' + errs.length + ') ===');
const errEntries = Object.entries(errByWf).sort((a, b) => b[1] - a[1]);
if (errEntries.length) for (const pair of errEntries) lines.push('- ' + pair[0] + ': ' + pair[1] + ' error' + (pair[1] === 1 ? '' : 's'));
else lines.push('(none — clean sample)');

lines.push('');
lines.push('TOTALS: ' + wfs.length + ' workflows on the instance = '
  + real.length + ' real (' + active.length + ' active / ' + inactive.length + ' inactive) + '
  + temps.length + ' throwaway temps.');
const days = ((Date.now() - oldestFetched) / 86400000).toFixed(1);
lines.push(execs.length + ' executions in the last ' + WINDOW_DAYS + 'd (fetched ' + allExecs.length
  + ' rows reaching back ' + days + 'd) · ' + pages.length + ' workflow page(s) · ' + errs.length + ' errors.');
if (!coversWindow) {
  lines.push('NOTE: the execution fetch did not reach back a full ' + WINDOW_DAYS + ' days, so "NO RUNS IN'
    + ' SAMPLE" above means "no runs in the last ' + days + 'd" — raise maxRequestsPerPage before treating'
    + ' any of those as abandoned.');
}

const subject = (alerting ? '🚨 n8n estate audit — ' + temps.length + ' leaked temp workflows' : '📊 n8n daily estate audit')
  + ' (' + real.length + ' real, ' + active.length + ' active)';

return [{ json: { report: lines.join('\\n'), subject, tempCount: temps.length, alerting } }];
`.trim();

const nodes = [
  {
    id: 'sticky',
    name: 'About',
    type: 'n8n-nodes-base.stickyNote',
    typeVersion: 1,
    position: [-760, -260],
    parameters: {
      width: 620,
      height: 260,
      content: [
        '## 91 Ops — n8n Estate Audit (daily 08:00)',
        '',
        'Emails Roy a daily picture of the estate: active workflows and when they last ran,',
        'workflows that have gone quiet, stale inactive ones, and recent errors.',
        '',
        '**Leak guard.** Counts throwaway `ZZ TEMP` workflows separately and shouts if they',
        `exceed ${TEMP_ALERT_THRESHOLD}. That number going up means a script is failing to tear its temp`,
        'workflows down — the failure that put 4,652 junk workflows on this instance in Aug 2026.',
        '',
        'The workflow list is **paginated** — do not revert it to a single `?limit=250` call,',
        'or junk workflows will hide the real estate again.',
        '',
        'Rebuild with: `node scripts/admin/n8n-build-estate-audit.cjs`',
      ].join('\n'),
    },
  },
  {
    id: 'sched',
    name: 'Daily 08:00',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position: [-700, 0],
    parameters: { rule: { interval: [{ field: 'days', triggerAtHour: 8 }] } },
  },
  {
    id: 'runnow',
    name: 'Run Now',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [-700, 180],
    // No `webhookId`: n8n expects a UUID there, and setting a plain string stops the
    // webhook registering (silent 404 on the production URL). Omitting it lets n8n
    // assign its own — the same shape the temp-workflow helper uses successfully.
    parameters: { httpMethod: 'GET', path: RUN_NOW_PATH, responseMode: 'lastNode' },
  },
  {
    id: 'listwf',
    name: 'List Workflows',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [-480, 0],
    parameters: {
      url: `${N8N}/workflows?limit=250`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: cursorPagination,
    },
    credentials: API_CRED,
  },
  {
    id: 'listex',
    name: 'Recent Executions',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [-260, 0],
    // The paginated workflow list emits one item per page; without this the node would
    // re-fetch the same executions once per page and inflate every run count.
    executeOnce: true,
    parameters: {
      // Paginated, NOT a single 250-row page. A row limit is not a time window:
      // the high-frequency workflows (routers firing every 15 min) crowd rare ones
      // out within hours, so a rare-but-healthy workflow reads as "no runs" and
      // looks abandoned. That flaw made the first version of this audit report 22
      // idle active workflows when the real number was 3. The Code node trims to
      // EXEC_WINDOW_DAYS and states the window it actually covered.
      url: `${N8N}/executions?limit=250`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: execPagination,
    },
    credentials: API_CRED,
  },
  {
    id: 'report',
    name: 'Build Audit Report',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-40, 0],
    parameters: { jsCode: auditCode },
  },
  {
    id: 'email',
    name: 'Email Audit',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: [180, 0],
    parameters: {
      sendTo: 'roy@allthepower.co.uk',
      subject: '={{ $json.subject }}',
      emailType: 'text',
      message: '={{ $json.report }}',
      options: {},
    },
    credentials: GMAIL_CRED,
  },
];

const connections = {
  'Daily 08:00': { main: [[{ node: 'List Workflows', type: 'main', index: 0 }]] },
  'Run Now': { main: [[{ node: 'List Workflows', type: 'main', index: 0 }]] },
  'List Workflows': { main: [[{ node: 'Recent Executions', type: 'main', index: 0 }]] },
  'Recent Executions': { main: [[{ node: 'Build Audit Report', type: 'main', index: 0 }]] },
  'Build Audit Report': { main: [[{ node: 'Email Audit', type: 'main', index: 0 }]] },
};

const wf = {
  name: '91 Ops - n8n Estate Audit',
  settings: { executionOrder: 'v1', errorWorkflow: ERROR_WF },
  nodes,
  connections,
};

(async () => {
  if (process.argv.includes('--dry')) {
    console.log(JSON.stringify(wf, null, 2));
    console.log(`\n[dry] would PUT ${wf.nodes.length} nodes to ${WF_ID}`);
    return;
  }
  const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, 'Content-Type': 'application/json' };
  const r = await fetch(`${N8N}/workflows/${WF_ID}`, { method: 'PUT', headers: H, body: JSON.stringify(wf) });
  const t = await r.text();
  if (!r.ok) { console.error(`PUT failed ${r.status}: ${t.slice(0, 500)}`); process.exit(1); }
  console.log(`Updated ${WF_ID} — ${wf.nodes.length} nodes, daily 08:00, paginated, temp-leak alert at ${TEMP_ALERT_THRESHOLD}.`);

  const a = await fetch(`${N8N}/workflows/${WF_ID}/activate`, { method: 'POST', headers: H });
  console.log(`Activate: ${a.status}`);
  console.log(`Run on demand: https://allthepower.app.n8n.cloud/webhook/${RUN_NOW_PATH}`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
