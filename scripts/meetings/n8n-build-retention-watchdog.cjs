/**
 * Builds + deploys "Zoom Retention Watchdog" — the machine-independent safety net that
 * guards Zoom's native 30-day auto-delete retention.
 *
 * The daily "Zoom Archive Sweep" cron copies Zoom recordings to the Elevate 360 shared
 * drive, but it only runs when Roy's machine is up. This workflow lives in n8n cloud and
 * checks the *result* rather than the process, so a dead laptop cannot hide a data loss.
 *
 * Daily 08:30 (after the 07:15 sweep) it:
 *   1. lists Zoom cloud recordings aged 24-32 days — the window about to be deleted;
 *   2. reads manifest.jsonl from the Zoom Archive folder on Drive (published by the sweep);
 *   3. emails Roy if any recording file in that window is not a verified manifest entry;
 *   4. ALSO emails if manifest.jsonl is missing or hasn't moved in 3+ days — that is the
 *      silent-stall signal that the sweep (or the machine) has died;
 *   5. sends nothing at all when everything checks out. Silence means safe.
 *
 * Note on testing: n8n's public API has no "run this workflow" endpoint, and production
 * webhook URLs only answer while a workflow is active. So the reproducible sequence is
 * create (inactive) -> activate -> --test -> verify. The schedule only fires at 08:30, so
 * activating to test does not cause an unattended run.
 *
 * Run:
 *   node scripts/meetings/n8n-build-retention-watchdog.cjs              # create, INACTIVE
 *   node scripts/meetings/n8n-build-retention-watchdog.cjs --update <id>
 *   node scripts/meetings/n8n-build-retention-watchdog.cjs --activate <id>
 *   node scripts/meetings/n8n-build-retention-watchdog.cjs --deactivate <id>
 *   node scripts/meetings/n8n-build-retention-watchdog.cjs --test <id>  # fire the test webhook
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY;
const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';

const TEST_PATH = 'zoom-retention-watchdog-test';
const ZOOM_ACCOUNT = 'M3QuSAlkQwClv5CkvueJ3Q';
const ZOOM_BASIC = { httpBasicAuth: { id: 'hhLJX0ZOjbCDyRQv', name: 'Zoom Aaa' } };
const DOCS_CRED = { googleDocsOAuth2Api: { id: 'MP5lsnBo4QJCHbdZ', name: 'Google Docs account 4' } };
const GMAIL_CRED = { gmailOAuth2: { id: 'wa0yZ2ZcsSUmWqpG', name: 'Gmail account' } };

const ZOOM_USER = 'roy@allthepower.co.uk';
const ALERT_TO = 'roy@allthepower.co.uk';
const ELEVATE_DRIVE = '0AKfRjuIGt6z3Uk9PVA';
// The archive folder on Elevate 360, now at 11_Zoom Recordings/02_Zoom Archive.
// Pinned by id on purpose — never resolve this folder by name. A name lookup would
// miss it after any rename and report the manifest as MISSING, i.e. a false alarm
// that looks exactly like real data loss. The id survives moves and renames.
const ARCHIVE_FOLDER = '1qhvsNogrqHXXlToU9bmZa2LXJvZK4MG-';
// Zoom retention deletes at 30 days. Checking 24-32 days old gives roughly a week of
// warning before the oldest of them goes, and overlaps enough that a skipped day is caught.
const WINDOW_YOUNG_DAYS = 24;
const WINDOW_OLD_DAYS = 32;
const STALE_DAYS = 3;

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

const MANIFEST_QUERY = `'${ARCHIVE_FOLDER}' in parents and name='manifest.jsonl' and trashed=false`;
const FIND_MANIFEST_URL = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(MANIFEST_QUERY)}`
  + `&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${ELEVATE_DRIVE}`
  + '&fields=files(id,name,size,modifiedTime)';

// Lists every Zoom cloud recording in the danger window. Zoom's list endpoint is paged,
// so walk next_page_token even though an 8-day window rarely exceeds one page.
const LIST_AGING = `
const token = $input.first().json.access_token;
const pad = (n) => (n < 10 ? "0" : "") + n;
const ymd = (d) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
const DAY = 86400000;
const now = Date.now();
const to = new Date(now - ${WINDOW_YOUNG_DAYS} * DAY);
const from = new Date(now - ${WINDOW_OLD_DAYS} * DAY);
const base = "https://api.zoom.us/v2/users/" + encodeURIComponent("${ZOOM_USER}") + "/recordings?page_size=300&from=" + ymd(from) + "&to=" + ymd(to);
const seen = new Map();
let pt = "";
do {
  const url = base + (pt ? "&next_page_token=" + pt : "");
  const resp = await this.helpers.httpRequest({ method: "GET", url, headers: { Authorization: "Bearer " + token }, json: true });
  for (const m of resp.meetings || []) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
  pt = resp.next_page_token || "";
} while (pt);
const aging = [];
let fileCount = 0;
for (const m of seen.values()) {
  // Must mirror zoom-drain.cjs's filter exactly. A file the drain skips but the
  // watchdog counts would raise an alert that no amount of re-running can clear.
  const files = (m.recording_files || []).filter((f) => f.status === "completed" && f.download_url && (f.file_size || 0) > 0);
  if (!files.length) continue;
  fileCount += files.length;
  aging.push({
    uuid: m.uuid,
    topic: m.topic || "(no topic)",
    date: (m.start_time || "").slice(0, 10),
    files: files.map((f) => ({ id: f.id, type: f.recording_type || f.file_type || "file", size: f.file_size })),
  });
}
aging.sort((a, b) => (a.date < b.date ? -1 : 1));
return [{ json: { window: { from: ymd(from), to: ymd(to) }, meetings: aging.length, files: fileCount, aging } }];
`.trim();

// Cross-checks the Zoom list against the manifest and writes the alert email body.
// Two independent failure modes are reported: recordings genuinely missing from the
// archive, and the guard itself being broken/stale (which hides the first kind).
const AUDIT = `
const DAY = 86400000;
// POSTing {"forceAlert":true} to the test webhook proves the email path end to end
// without waiting for a real gap. Absent on scheduled runs, hence the guard.
let forced = false;
try { forced = (($("Manual Test").first().json || {}).body || {}).forceAlert === true; } catch (e) {}
const listed = (($("Find Manifest").first().json || {}).files) || [];
const aging = $("List Aging Recordings").first().json;
const problems = [];
const verified = new Set();
let manifestInfo = null;

if (!listed.length) {
  problems.push("manifest.jsonl is MISSING from the Zoom Archive folder on Drive - the archive cannot be verified at all.");
} else {
  manifestInfo = listed[0];
  const ageDays = Math.floor((Date.now() - new Date(manifestInfo.modifiedTime).getTime()) / DAY);
  manifestInfo.ageDays = ageDays;
  if (ageDays >= ${STALE_DAYS}) {
    problems.push("manifest.jsonl has not been updated for " + ageDays + " days (last modified " + manifestInfo.modifiedTime + "). The daily Zoom Archive Sweep has stalled - the cron host is probably off, so new recordings are NOT reaching Drive.");
  }
  const item = $("Fetch Manifest").first().json;
  const raw = typeof item === "string" ? item : (item.data || item.body || "");
  if (!raw || typeof raw !== "string") {
    problems.push("manifest.jsonl could not be read from Drive (empty or unreadable response).");
  } else {
    for (const line of raw.split(/\\r?\\n/)) {
      if (!line.trim()) continue;
      try { const e = JSON.parse(line); if (e.zoom_file_id && e.verified) verified.add(e.zoom_file_id); } catch (err) {}
    }
    if (!verified.size) problems.push("manifest.jsonl parsed to ZERO verified entries - it is corrupt, truncated, or not the file we expect.");
  }
}

// Only meaningful once the manifest actually loaded; otherwise every file would look
// unarchived and the email would be noise on top of the real problem above.
const unprotected = [];
if (verified.size) {
  for (const m of aging.aging || []) {
    const missing = (m.files || []).filter((f) => !verified.has(f.id));
    if (missing.length) unprotected.push({ date: m.date, topic: m.topic, uuid: m.uuid, missing });
  }
}

let missingFiles = 0;
for (const u of unprotected) missingFiles += u.missing.length;

const lines = [];
lines.push("Zoom retention watchdog - " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC");
lines.push("");
lines.push("Window checked: recordings aged ${WINDOW_YOUNG_DAYS}-${WINDOW_OLD_DAYS} days (" + aging.window.from + " to " + aging.window.to + ") - the ones 30-day retention is about to delete.");
lines.push("In Zoom: " + aging.meetings + " meeting(s), " + aging.files + " recording file(s).");
if (manifestInfo) {
  lines.push("Drive manifest: " + verified.size + " verified entries, last updated " + manifestInfo.modifiedTime + " (" + manifestInfo.ageDays + " day(s) ago).");
} else {
  lines.push("Drive manifest: NOT FOUND.");
}
lines.push("");

if (missingFiles) {
  lines.push("*** " + missingFiles + " recording file(s) across " + unprotected.length + " meeting(s) are NOT in the Drive archive and are about to age out of Zoom: ***");
  lines.push("");
  for (const u of unprotected) {
    lines.push("  " + u.date + "  " + u.topic);
    for (const f of u.missing) lines.push("      - " + f.type + "  " + Math.round((f.size || 0) / 1048576) + " MB  (zoom file id " + f.id + ")");
    lines.push("      uuid: " + u.uuid);
    lines.push("");
  }
}
if (problems.length) {
  lines.push("Problems with the guard itself:");
  for (const p of problems) lines.push("  - " + p);
  lines.push("");
}
lines.push("Fix - on the cron host, run:");
lines.push("  node projects/briefs/atp-google-migration/zoom-drain/zoom-drain.cjs --months 2 --publish-manifest");
lines.push("");
lines.push("Then this watchdog goes quiet again on its next run. Nothing is ever deleted from Zoom by these jobs.");

const alert = forced || missingFiles > 0 || problems.length > 0;
let subject = "Zoom retention watchdog: all clear";
if (missingFiles) subject = "ALERT: " + missingFiles + " Zoom recording file(s) aging out UNARCHIVED";
else if (problems.length) subject = "ALERT: Zoom archive guard problem - " + problems[0].slice(0, 60);
if (forced) {
  subject = "[TEST] " + subject;
  lines.unshift("(This is a forced test of the alert path. The findings above are real; the email was triggered manually.)", "");
}

return [{ json: { alert, subject, body: lines.join("\\n"), forced, missingFiles, meetingsAffected: unprotected.length, problems: problems.length } }];
`.trim();

function workflow() {
  const nodes = [
    { id: 'sched', name: 'Daily 08:30', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, -120],
      parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 8 * * *' }] } } },
    { id: 'test', name: 'Manual Test', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 100],
      parameters: { httpMethod: 'POST', path: TEST_PATH, responseMode: 'lastNode', options: {} }, webhookId: TEST_PATH },
    { id: 'ztoken', name: 'Zoom Token', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [240, 0],
      parameters: { method: 'POST', url: 'https://zoom.us/oauth/token',
        authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
        sendQuery: true, queryParameters: { parameters: [{ name: 'grant_type', value: 'account_credentials' }, { name: 'account_id', value: ZOOM_ACCOUNT }] },
        options: {} }, credentials: ZOOM_BASIC },
    { id: 'list', name: 'List Aging Recordings', type: 'n8n-nodes-base.code', typeVersion: 2, position: [470, 0],
      parameters: { jsCode: LIST_AGING } },
    { id: 'findman', name: 'Find Manifest', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [700, 0],
      parameters: { method: 'GET', url: FIND_MANIFEST_URL,
        authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDocsOAuth2Api',
        options: { response: { response: { neverError: true } } } },
      credentials: DOCS_CRED, onError: 'continueRegularOutput' },
    { id: 'fetchman', name: 'Fetch Manifest', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [930, 0],
      parameters: { method: 'GET',
        // guarded so a missing manifest 404s here instead of blowing up expression resolution
        url: '={{ ($json.files && $json.files.length) ? "https://www.googleapis.com/drive/v3/files/" + $json.files[0].id + "?alt=media&supportsAllDrives=true" : "https://www.googleapis.com/drive/v3/files/MISSING?alt=media" }}',
        authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDocsOAuth2Api',
        options: { response: { response: { responseFormat: 'text', outputPropertyName: 'data', neverError: true } } } },
      credentials: DOCS_CRED, onError: 'continueRegularOutput' },
    { id: 'audit', name: 'Audit vs Manifest', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1160, 0],
      parameters: { jsCode: AUDIT } },
    { id: 'gate', name: 'Alert Needed?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [1390, 0],
      parameters: { conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ id: 'alert', leftValue: '={{ $json.alert }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      }, options: {} } },
    { id: 'mail', name: 'Email Roy', type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1620, -80],
      parameters: { sendTo: ALERT_TO, subject: '={{ $json.subject }}', emailType: 'text', message: '={{ $json.body }}', options: {} },
      credentials: GMAIL_CRED },
    // Terminates the all-clear branch so silence is visibly deliberate on the canvas,
    // and so the test webhook has something to return instead of a bare 500.
    { id: 'clear', name: 'All Clear (no email)', type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [1620, 120], parameters: {} },
  ];
  const connections = {
    'Daily 08:30': { main: [[{ node: 'Zoom Token', type: 'main', index: 0 }]] },
    'Manual Test': { main: [[{ node: 'Zoom Token', type: 'main', index: 0 }]] },
    'Zoom Token': { main: [[{ node: 'List Aging Recordings', type: 'main', index: 0 }]] },
    'List Aging Recordings': { main: [[{ node: 'Find Manifest', type: 'main', index: 0 }]] },
    'Find Manifest': { main: [[{ node: 'Fetch Manifest', type: 'main', index: 0 }]] },
    'Fetch Manifest': { main: [[{ node: 'Audit vs Manifest', type: 'main', index: 0 }]] },
    'Audit vs Manifest': { main: [[{ node: 'Alert Needed?', type: 'main', index: 0 }]] },
    'Alert Needed?': { main: [[{ node: 'Email Roy', type: 'main', index: 0 }], [{ node: 'All Clear (no email)', type: 'main', index: 0 }]] },
  };
  return { name: 'Zoom Retention Watchdog', nodes, connections, settings: { executionOrder: 'v1', timezone: 'Europe/London' } };
}

(async () => {
  const argv = process.argv.slice(2);
  const at = (k) => { const i = argv.indexOf(k); return i !== -1 ? argv[i + 1] : undefined; };

  const st = at('--status');
  if (st) {
    const w = await api(`/workflows/${st}`);
    console.log(`name:     ${w.name}`);
    console.log(`active:   ${w.active}`);
    console.log(`timezone: ${w.settings && w.settings.timezone}`);
    console.log(`nodes:    ${(w.nodes || []).map((n) => n.name).join(' -> ')}`);
    return;
  }

  const act = at('--activate');
  if (act) { await api(`/workflows/${act}/activate`, 'POST'); console.log(`Activated ${act}`); return; }
  const deact = at('--deactivate');
  if (deact) { await api(`/workflows/${deact}/deactivate`, 'POST'); console.log(`Deactivated ${deact}`); return; }

  if (argv.includes('--test') || argv.includes('--test-alert')) {
    const force = argv.includes('--test-alert');
    console.log(`POST ${WEBHOOK_BASE}/${TEST_PATH}${force ? '  (forcing the alert email)' : ''}`);
    const r = await fetch(`${WEBHOOK_BASE}/${TEST_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ forceAlert: force }) });
    const t = await r.text();
    console.log(`-> ${r.status}\n${t.slice(0, 4000)}`);
    return;
  }

  const wf = workflow();
  const upd = at('--update');
  if (upd) { await api(`/workflows/${upd}`, 'PUT', wf); console.log(`Updated workflow ${upd}`); return; }

  const created = await api('/workflows', 'POST', wf);
  console.log(`Created workflow: ${created.id}  "${created.name}"  (INACTIVE)`);
  console.log(`Next: --activate ${created.id}   then --test ${created.id}`);
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
