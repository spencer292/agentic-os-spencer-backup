/**
 * meeting-video-archive — rescue a meeting's Zoom recording into Google Drive and
 * link it from the Notion Meetings row, so we can come back and clip from it later.
 *
 * Per meeting: pick the best single MP4 (shared_screen_with_speaker_view ->
 * active_speaker -> gallery_view) + the audio-only M4A, stream each Zoom -> Drive
 * via a RESUMABLE upload (Zoom MP4s are ~0.5-1.3 GB — too big to base64 through a
 * Code node), into a month subfolder of the private "Meeting Recordings" folder on
 * the Elevate 360 shared drive, then write the Drive link + tick "Video Archived"
 * on the meeting's Notion row (idempotent on the Zoom UUID).
 *
 * Drive has no local OAuth here — the *authenticated* steps (folder find/create,
 * resumable-session init) route through a throwaway n8n workflow using the
 * "Google Docs account 4" credential (Drive scope). The big byte PUT goes straight
 * from this machine to Google's pre-signed session URI (no auth needed there).
 *
 * Run:
 *   node scripts/meetings/archive-video.cjs --init-notion             # add the 3 Notion props (one-time)
 *   node scripts/meetings/archive-video.cjs --uuid "<zoomUuid>"       # archive one meeting
 *   node scripts/meetings/archive-video.cjs --query "THRIVE review"   # find by topic, archive one
 *   node scripts/meetings/archive-video.cjs --uuid "<u>" --audio-only # just the M4A (fast test)
 *   node scripts/meetings/archive-video.cjs --uuid "<u>" --dry        # plan only, no upload/Notion
 */
const fs = require('fs');
const os = require('os');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');

const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };                 // CI (GitHub Actions) injects the secrets as env vars
try {                                            // local: overlay .env if present (takes precedence)
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env (CI) — rely on process.env */ }
const ZACCT = env.ZOOM_ACCOUNT_ID, ZID = env.ZOOM_CLIENT_ID, ZSECRET = env.ZOOM_CLIENT_SECRET;
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const NKEY = env.N8N_API_KEY;

const N8N = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const N8N_PROJECT = 'Dmp86aYd0evZH0Dr';
const DOCS_CRED = { googleDocsOAuth2Api: { id: 'MP5lsnBo4QJCHbdZ', name: 'Google Docs account 4' } };
const ELEVATE_DRIVE = '0AKfRjuIGt6z3Uk9PVA';
const ROOT_FOLDER = '1kCXNW2rDhQy_EPYjZ5Jvcfh8qL-4K36v'; // "Meeting Recordings" on Elevate 360
const DATA_SOURCE_ID = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const NOTION_DB_ID = '1f5bf43f-7b08-4570-a15b-77717208d152';
const NH = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const DRY = flag('--dry');
const AUDIO_ONLY = flag('--audio-only');
const die = (m) => { console.error('\nFAILED:', m); process.exit(1); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const slugify = (s) => (s || 'meeting').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const MB = (b) => (b / 1048576).toFixed(0);

// ── Zoom ──────────────────────────────────────────────────────────────────────
async function zoomToken() {
  const basic = Buffer.from(`${ZID}:${ZSECRET}`).toString('base64');
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZACCT}`, { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
  const j = await r.json();
  if (!r.ok) die(`Zoom token ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}
const ymd = (d) => d.toISOString().slice(0, 10);

// The S2S app token only has list scope (/users/me/recordings), not the per-meeting
// recordings endpoint — so we find a recording by scanning the user's list windows.
async function scanRecordings(token, months) {
  const now = new Date();
  const seen = new Map();
  for (let i = 0; i < months; i++) {
    const to = new Date(now); to.setDate(to.getDate() - i * 30);
    const from = new Date(to); from.setDate(from.getDate() - 30);
    const r = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=300&from=${ymd(from)}&to=${ymd(to)}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    for (const m of j.meetings || []) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
  }
  return seen;
}

async function recordingByUuid(token, uuid, months) {
  const seen = await scanRecordings(token, months);
  const m = seen.get(uuid);
  if (!m) die(`uuid ${uuid} not found in /users/me/recordings over ${months} months (older than the scan window?).`);
  return m;
}

async function findByQuery(token, query, months) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const seen = await scanRecordings(token, months);
  const scored = [...seen.values()].map(m => ({ m, hits: terms.filter(t => (m.topic || '').toLowerCase().includes(t)).length }))
    .filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits || new Date(b.m.start_time) - new Date(a.m.start_time));
  if (!scored.length) die(`No recording matched "${query}" in ${months} months.`);
  return scored[0].m;
}

function pickFiles(meeting) {
  const files = meeting.recording_files || [];
  const mp4 = files.find(f => f.recording_type === 'shared_screen_with_speaker_view' && (f.file_type || '').toUpperCase() === 'MP4')
    || files.find(f => f.recording_type === 'active_speaker' && (f.file_type || '').toUpperCase() === 'MP4')
    || files.find(f => f.recording_type === 'gallery_view' && (f.file_type || '').toUpperCase() === 'MP4')
    || files.find(f => (f.file_type || '').toUpperCase() === 'MP4');
  const audio = files.find(f => (f.file_type || '').toUpperCase() === 'M4A' || f.recording_type === 'audio_only');
  return { mp4, audio };
}

// ── n8n-credentialed Drive call (throwaway workflow) ──────────────────────────
async function n8nHttp({ method, url, jsonBody, headers, fullResponse }) {
  const hookPath = `zz-mva-${process.pid}-${Date.now().toString(36)}`;
  const httpParams = {
    method, url,
    authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDocsOAuth2Api',
    options: fullResponse ? { response: { response: { fullResponse: true, neverError: true } } } : {},
  };
  if (headers) { httpParams.sendHeaders = true; httpParams.headerParameters = { parameters: headers }; }
  if (jsonBody !== undefined) { httpParams.sendBody = true; httpParams.specifyBody = 'json'; httpParams.jsonBody = typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody); }
  const wf = {
    name: `ZZ TEMP - MVA ${hookPath}`, settings: { executionOrder: 'v1' },
    nodes: [
      { id: 'wh', name: 'Hook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0], parameters: { httpMethod: 'GET', path: hookPath, responseMode: 'lastNode' } },
      { id: 'call', name: 'Call', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [220, 0], parameters: httpParams, credentials: DOCS_CRED },
    ],
    connections: { Hook: { main: [[{ node: 'Call', type: 'main', index: 0 }]] } },
  };
  const HJ = { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json' };
  let id;
  try {
    const cr = await fetch(`${N8N}/workflows`, { method: 'POST', headers: HJ, body: JSON.stringify(wf) });
    const cj = await cr.json();
    if (!cr.ok) throw new Error(`n8n create ${cr.status}: ${JSON.stringify(cj).slice(0, 200)}`);
    id = cj.id;
    await fetch(`${N8N}/workflows/${id}/transfer`, { method: 'PUT', headers: HJ, body: JSON.stringify({ destinationProjectId: N8N_PROJECT }) });
    await fetch(`${N8N}/workflows/${id}/activate`, { method: 'POST', headers: HJ });
    let out = '';
    for (let i = 0; i < 20; i++) {
      await sleep(1500);
      try { const run = await fetch(`${WEBHOOK_BASE}/${hookPath}`); out = await run.text(); if (run.ok && out) break; } catch {}
    }
    try { return JSON.parse(out); } catch { return out; }
  } finally {
    if (id) await fetch(`${N8N}/workflows/${id}`, { method: 'DELETE', headers: HJ });
  }
}

async function findOrCreateMonthFolder(yyyymm) {
  const q = `'${ROOT_FOLDER}' in parents and name='${yyyymm}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${ELEVATE_DRIVE}&fields=files(id,name)`;
  const found = await n8nHttp({ method: 'GET', url: searchUrl });
  if (found && found.files && found.files.length) return found.files[0].id;
  const created = await n8nHttp({ method: 'POST', url: 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name', jsonBody: { name: yyyymm, mimeType: 'application/vnd.google-apps.folder', parents: [ROOT_FOLDER] } });
  if (!created || !created.id) throw new Error(`month folder create failed: ${JSON.stringify(created).slice(0, 200)}`);
  return created.id;
}

async function driveFindInFolder(folderId, name) {
  const q = `'${folderId}' in parents and name='${name}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${ELEVATE_DRIVE}&fields=files(id,name,size,webViewLink)`;
  const r = await n8nHttp({ method: 'GET', url });
  return r && r.files && r.files[0] || null;
}

// ── resumable upload: init session via n8n cred, PUT bytes locally ────────────
async function uploadResumable(zoomToken, file, name, folderId) {
  const size = Number(file.file_size) || 0;
  const mime = (file.file_type || '').toUpperCase() === 'M4A' ? 'audio/mp4' : 'video/mp4';
  // idempotency: if a file with this name is already in the folder, reuse it (no re-upload)
  if (!flag('--force')) {
    const existing = await driveFindInFolder(folderId, name);
    if (existing) { console.log(`   already in Drive: ${name} (skip)`); return { id: existing.id, webViewLink: existing.webViewLink || `https://drive.google.com/file/d/${existing.id}/view`, bytes: Number(existing.size) || 0, skipped: true }; }
  }
  // 1) init the resumable session (authenticated) — capture the Location header
  const initUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink,size';
  const init = await n8nHttp({
    method: 'POST', url: initUrl, fullResponse: true,
    headers: [
      { name: 'X-Upload-Content-Type', value: mime },
      { name: 'X-Upload-Content-Length', value: String(size) },
    ],
    jsonBody: { name, parents: [folderId] },
  });
  const sess = init && init.headers && (init.headers.location || init.headers.Location);
  if (!sess) throw new Error(`resumable init: no session URI. status=${init && init.statusCode} body=${JSON.stringify(init && init.body).slice(0, 300)}`);

  // 2) download Zoom -> temp, then PUT temp -> session URI (exact Content-Length from disk)
  const tmp = path.join(os.tmpdir(), `mva-${Date.now().toString(36)}-${name}`);
  const dl = await fetch(file.download_url, { headers: { Authorization: `Bearer ${zoomToken}` } });
  if (!dl.ok || !dl.body) throw new Error(`Zoom download ${dl.status} for ${name}`);
  await pipeline(Readable.fromWeb(dl.body), fs.createWriteStream(tmp));
  const bytes = fs.statSync(tmp).size;
  console.log(`   downloaded ${name}: ${MB(bytes)}MB -> PUT to Drive…`);

  const put = await fetch(sess, { method: 'PUT', headers: { 'Content-Type': mime, 'Content-Length': String(bytes) }, body: fs.createReadStream(tmp), duplex: 'half' });
  const ptxt = await put.text();
  fs.unlink(tmp, () => {});
  if (!put.ok) throw new Error(`Drive PUT ${put.status}: ${ptxt.slice(0, 300)}`);
  let pj; try { pj = JSON.parse(ptxt); } catch { pj = {}; }
  return { id: pj.id, webViewLink: pj.webViewLink || (pj.id ? `https://drive.google.com/file/d/${pj.id}/view` : null), bytes };
}

// ── Notion ────────────────────────────────────────────────────────────────────
const rt = (s) => [{ text: { content: String(s || '').slice(0, 1900) } }];
async function notionRow(uuid) {
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: 'POST', headers: NH, body: JSON.stringify({ filter: { property: 'Source', rich_text: { contains: uuid } }, page_size: 1 }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Notion query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return (j.results || [])[0] || null;
}
async function initNotion() {
  const body = { properties: { 'Recording': { url: {} }, 'Recording File ID': { rich_text: {} }, 'Video Archived': { checkbox: {} } } };
  for (const [ep, label] of [[`data_sources/${DATA_SOURCE_ID}`, 'data_source'], [`databases/${NOTION_DB_ID}`, 'database']]) {
    const r = await fetch(`https://api.notion.com/v1/${ep}`, { method: 'PATCH', headers: NH, body: JSON.stringify(body) });
    const j = await r.json();
    if (r.ok) { console.log(`Notion props ensured via ${label}: Recording (url), Recording File ID (text), Video Archived (checkbox).`); return; }
    console.log(`   (${label} patch ${r.status}: ${JSON.stringify(j).slice(0, 160)})`);
  }
  die('Could not add Notion properties on either endpoint.');
}
async function notionUpdate(pageId, folderUrl, fileId) {
  const props = {
    'Recording': { url: folderUrl },
    'Recording File ID': { rich_text: rt(fileId) },
    'Video Archived': { checkbox: true },
  };
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: 'PATCH', headers: NH, body: JSON.stringify({ properties: props }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Notion update ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
}

// ── archive one meeting (folder -> uploads -> Notion link) ────────────────────
async function archiveOne(token, meeting) {
  const date = (meeting.start_time || '').slice(0, 10);
  const yyyymm = date.slice(0, 7);
  const { mp4, audio } = pickFiles(meeting);
  console.log(`\nMeeting: "${meeting.topic}"  ${date}  uuid=${meeting.uuid}`);
  console.log(`  MP4: ${mp4 ? `${mp4.recording_type} ${MB(mp4.file_size)}MB` : '—'}   Audio: ${audio ? `${MB(audio.file_size)}MB` : '—'}`);
  if (!mp4 && !audio) { console.log('  (no MP4/audio — skipping)'); return { skipped: true }; }
  if (DRY) { console.log(`  [DRY] would archive to Meeting Recordings/${yyyymm}/ and link Notion.`); return { dry: true }; }

  const folderId = await findOrCreateMonthFolder(yyyymm);
  const base = `${date}_${slugify(meeting.topic)}`;
  let primary = null;
  if (mp4 && !AUDIO_ONLY) primary = await uploadResumable(token, mp4, `${base}.mp4`, folderId);
  const audioUp = audio ? await uploadResumable(token, audio, `${base}.m4a`, folderId) : null;
  if (!primary && audioUp) primary = audioUp;
  if (primary) console.log(`  ✓ Drive: ${primary.webViewLink}`);

  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  const row = await notionRow(meeting.uuid);
  if (!row) { console.log('  (no Notion row for this uuid — uploaded, nothing to link)'); return { uploaded: true, linked: false }; }
  await notionUpdate(row.id, folderUrl, primary ? primary.id : '');
  console.log(`  ✓ Notion linked: ${row.url}`);
  return { uploaded: true, linked: true };
}

// ── sweep: archive the newest un-archived Notion rows within a date window ─────
async function sweep(token, days, batch) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const filter = { and: [
    { property: 'Date', date: { on_or_after: cutoff } },
    { property: 'Video Archived', checkbox: { equals: false } },
  ] };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: 'POST', headers: NH, body: JSON.stringify({ filter, sorts: [{ property: 'Date', direction: 'descending' }], page_size: 100 }) });
  const j = await r.json();
  if (!r.ok) die(`Notion sweep query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const rows = (j.results || []).map(p => ({
    uuid: ((p.properties['Source'] && p.properties['Source'].rich_text) || []).map(t => t.plain_text).join('').trim(),
    title: (p.properties['Name'].title || []).map(t => t.plain_text).join(''),
    date: p.properties['Date'] && p.properties['Date'].date && p.properties['Date'].date.start || '',
  })).filter(x => x.uuid);
  console.log(`Sweep: ${rows.length} un-archived meeting(s) since ${cutoff}; processing newest ${Math.min(batch, rows.length)}.`);
  const seen = await scanRecordings(token, Math.ceil(days / 30) + 1);
  let done = 0, missing = 0, failed = 0;
  for (const row of rows.slice(0, batch)) {
    const meeting = seen.get(row.uuid);
    if (!meeting) { console.log(`\n• ${row.date} ${row.title} — not in Zoom window (expired/older) — skip`); missing++; continue; }
    try { await archiveOne(token, meeting); done++; }
    catch (e) { console.log(`  ! ${row.title}: ${e.message}`); failed++; }
  }
  console.log(`\nSweep: ${done} archived, ${missing} missing-from-Zoom, ${failed} failed. Idempotent — re-run to continue the backlog.`);
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (flag('--init-notion')) return initNotion();
  if (!ZACCT || !ZID || !ZSECRET) die('Zoom creds missing in .env');
  const token = await zoomToken();
  const months = Number(val('--months')) || 3;

  if (flag('--sweep')) {
    const days = Number(val('--days')) || 60;
    const batch = Number(val('--batch')) || 3;
    return sweep(token, days, batch);
  }

  const uuid = val('--uuid');
  let meeting;
  if (uuid) meeting = await recordingByUuid(token, uuid, months);
  else if (val('--query')) meeting = await findByQuery(token, val('--query'), months);
  else die('pass --uuid "<zoomUuid>", --query "<terms>", --sweep, or --init-notion.');
  await archiveOne(token, meeting);
})().catch(e => die(e.stack || e.message));
