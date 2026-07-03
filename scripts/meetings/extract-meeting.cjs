/**
 * zoom-meeting-intelligence — the extractor (prototype, local).
 *
 * Zoom S2S OAuth → find a recording by topic → pull its VTT transcript →
 * Anthropic extraction (summary + decisions + actions, owner-attributed) →
 * upsert a Notion "Meetings" row (idempotent on the Zoom recording UUID) →
 * write a review-ready summary-email draft to disk.
 *
 * Notion is reached via the DIRECT REST API (NOTION_API_TOKEN) — not the MCP.
 *
 * Run:
 *   node scripts/meetings/extract-meeting.cjs "Thrive Coaching Patrick Boghossian"
 *   node scripts/meetings/extract-meeting.cjs "<topic terms>" --months 24 --dry
 *
 * Flags:
 *   --months N   how many ~30-day windows back to search (default 18)
 *   --dry        do everything EXCEPT writing to Notion (still prints extract + draft)
 *   --model ID   Anthropic model (default claude-sonnet-4-6)
 */
const fs = require('fs');
const path = require('node:path');

// ── env ──────────────────────────────────────────────────────────────────────
const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const ZACCT = env.ZOOM_ACCOUNT_ID, ZID = env.ZOOM_CLIENT_ID, ZSECRET = env.ZOOM_CLIENT_SECRET;
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const ANTHROPIC = env.ANTHROPIC_API_KEY || env.ANTHROPIC_KEY;
const DATA_SOURCE_ID = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const NH = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const MONTHS = (() => { const i = args.indexOf('--months'); return i !== -1 ? Number(args[i + 1]) : 18; })();
const MODEL = (() => { const i = args.indexOf('--model'); return i !== -1 ? args[i + 1] : 'claude-sonnet-4-6'; })();
const QUERY = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--months' && args[args.indexOf(a) - 1] !== '--model')
  || 'Thrive Coaching Patrick Boghossian';
const FALLBACK_USERS = ['me', 'roy@allthepower.co.uk'];

const die = (m) => { console.error('\nFAILED:', m); process.exit(1); };

// ── Zoom ─────────────────────────────────────────────────────────────────────
async function zoomToken() {
  const basic = Buffer.from(`${ZID}:${ZSECRET}`).toString('base64');
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZACCT}`, {
    method: 'POST', headers: { Authorization: `Basic ${basic}` },
  });
  const j = await r.json();
  if (!r.ok) die(`Zoom token ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.access_token;
}

const ymd = (d) => d.toISOString().slice(0, 10);

async function listUsers(token) {
  const r = await fetch('https://api.zoom.us/v2/users?page_size=300&status=active', { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { console.log(`   listUsers ${r.status}: ${(await r.text()).slice(0, 200)}`); return null; }
  const j = await r.json();
  const emails = (j.users || []).map(u => u.email || u.id);
  console.log(`   users: ${emails.join(', ')}`);
  return emails;
}

async function recordingsFor(token, user, from, to) {
  const url = `https://api.zoom.us/v2/users/${encodeURIComponent(user)}/recordings?from=${from}&to=${to}&page_size=300`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    if (!recordingsFor._warned) { recordingsFor._warned = {}; }
    if (!recordingsFor._warned[user]) { recordingsFor._warned[user] = 1; console.log(`   recordings(${user}) ${r.status}: ${(await r.text()).slice(0, 140)}`); }
    return [];
  }
  const j = await r.json();
  if ((j.meetings || []).length) console.log(`   ${user} ${from}..${to}: ${j.meetings.length} recording(s)`);
  return j.meetings || [];
}

async function findRecording(token) {
  const terms = QUERY.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  let users = await listUsers(token);
  if (!users || !users.length) { console.log('   (user list unavailable — using fallback)'); users = FALLBACK_USERS; }
  console.log(`Searching ${users.length} user(s) over ~${MONTHS} months for: ${QUERY}`);

  const seen = new Map(); // uuid -> meeting
  const now = new Date();
  for (const user of users) {
    for (let i = 0; i < MONTHS; i++) {
      const to = new Date(now); to.setDate(to.getDate() - i * 30);
      const from = new Date(to); from.setDate(from.getDate() - 30);
      const meetings = await recordingsFor(token, user, ymd(from), ymd(to));
      for (const m of meetings) if (!seen.has(m.uuid)) seen.set(m.uuid, { ...m, _host: user });
    }
  }
  const all = [...seen.values()];
  console.log(`  scanned ${all.length} recording(s) total.`);
  const scored = all.map(m => {
    const topic = (m.topic || '').toLowerCase();
    const hits = terms.filter(t => topic.includes(t.replace(/boghossi.*/, 'boghossi'))).length;
    return { m, hits };
  }).filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits || new Date(b.m.start_time) - new Date(a.m.start_time));

  if (!scored.length) {
    console.log('\n  No topic match. Recent recordings seen:');
    for (const m of all.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)).slice(0, 15))
      console.log(`    ${m.start_time?.slice(0, 10)}  ${m.topic}`);
    die(`No recording matched "${QUERY}". Widen with --months or adjust terms.`);
  }
  console.log(`\n  Matches:`);
  for (const s of scored.slice(0, 6)) console.log(`    [${s.hits}] ${s.m.start_time?.slice(0, 10)}  ${s.m.topic}`);
  return scored[0].m;
}

async function fetchTranscript(token, meeting) {
  const files = meeting.recording_files || [];
  const pick = files.find(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT')
    || files.find(f => (f.recording_type || '') === 'audio_transcript')
    || files.find(f => (f.file_type || '').toUpperCase() === 'CC');
  if (!pick) return { text: null, files };
  let r = await fetch(pick.download_url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) r = await fetch(`${pick.download_url}?access_token=${token}`);
  if (!r.ok) die(`transcript download ${r.status}`);
  return { text: vttToText(await r.text()), files };
}

function vttToText(vtt) {
  const out = [];
  for (let line of vtt.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line === 'WEBVTT' || /^\d+$/.test(line) || line.includes('-->')) continue;
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join('\n');
}

// ── Anthropic ────────────────────────────────────────────────────────────────
const EXTRACT_SYSTEM = fs.readFileSync(path.join(ROOT, 'projects/briefs/zoom-meeting-intelligence/prompts/extract-meeting.md'), 'utf8');

async function extract(transcript, meta) {
  const user = `Meeting metadata:\n- Title: ${meta.title}\n- Date: ${meta.date}\n- Host: ${meta.host}\n\nTranscript (speaker-labelled VTT, cleaned):\n\n${transcript}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: EXTRACT_SYSTEM, messages: [{ role: 'user', content: user }] }),
  });
  const j = await r.json();
  if (!r.ok) die(`Anthropic ${r.status}: ${JSON.stringify(j).slice(0, 400)}`);
  let txt = (j.content || []).map(c => c.text || '').join('').trim();
  txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(txt); }
  catch (e) { die(`Could not parse extraction JSON: ${e.message}\n--- raw ---\n${txt.slice(0, 800)}`); }
}

// ── Notion ───────────────────────────────────────────────────────────────────
const chunk = (s, n = 1900) => { const o = []; s = s || ''; for (let i = 0; i < s.length; i += n) o.push(s.slice(i, i + n)); return o.length ? o : ['']; };
const rt = (s) => chunk(s).map(c => ({ text: { content: c } }));
const bullets = (arr) => (arr || []).map(x => ({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt(String(x)) } }));
const h2 = (t) => ({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: t } }] } });
const para = (t) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: rt(t) } });

const fmtRoy = (a) => `${a.action}${a.due ? ` (due ${a.due})` : ''}${a.context ? ` — ${a.context}` : ''}`;
const fmtOther = (a) => `${a.owner}: ${a.action}${a.due ? ` (due ${a.due})` : ''}${a.context ? ` — ${a.context}` : ''}`;
const joinB = (arr, f) => (arr || []).map(x => `• ${f(x)}`).join('\n');

async function notionExisting(uuid) {
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, {
    method: 'POST', headers: NH,
    body: JSON.stringify({ filter: { property: 'Source', rich_text: { contains: uuid } }, page_size: 1 }),
  });
  const j = await r.json();
  if (!r.ok) die(`Notion query ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return (j.results || [])[0] || null;
}

async function notionCreate(ex, meta) {
  const props = {
    'Name': { title: rt(ex.title || meta.title) },
    'Date': { date: { start: ex.date || meta.date } },
    'Attendees': { rich_text: rt((ex.attendees || []).join(', ')) },
    'Summary': { rich_text: rt(ex.summary || '') },
    'Decisions': { rich_text: rt(joinB(ex.decisions, String) || '—') },
    'Action Items (Roy)': { rich_text: rt(joinB(ex.actions_roy, fmtRoy) || '—') },
    'Action Items (Others)': { rich_text: rt(joinB(ex.actions_others, fmtOther) || '—') },
    'Open Questions': { rich_text: rt(joinB(ex.open_questions, String) || '—') },
    'Source': { rich_text: rt(meta.uuid) },
    'Status': { select: { name: 'New' } },
  };
  const children = [
    h2('Summary'), para(ex.summary || ''),
    h2('Action Items — Roy'), ...bullets((ex.actions_roy || []).map(fmtRoy)),
    h2('Action Items — Others'), ...bullets((ex.actions_others || []).map(fmtOther)),
    h2('Decisions'), ...bullets(ex.decisions),
    h2('Open Questions'), ...bullets(ex.open_questions),
    h2('Full transcript'),
    ...chunk(meta.transcript, 1900).slice(0, 70).map(para),
  ].slice(0, 95);

  for (const parent of [{ type: 'data_source_id', data_source_id: DATA_SOURCE_ID }, { type: 'database_id', database_id: '1f5bf43f-7b08-4570-a15b-77717208d152' }]) {
    const r = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers: NH, body: JSON.stringify({ parent, properties: props, children }) });
    const j = await r.json();
    if (r.ok) return j.url;
    console.log(`   (page create via ${Object.keys(parent)[1]} failed ${r.status}: ${JSON.stringify(j).slice(0, 200)})`);
  }
  die('Notion page create failed on both parent shapes.');
}

// ── email draft ──────────────────────────────────────────────────────────────
function emailDraft(ex, meta) {
  const lines = [];
  lines.push(`Subject: Meeting actions — ${ex.title || meta.title} (${ex.date || meta.date})`, '');
  lines.push(ex.summary || '', '');
  if ((ex.actions_roy || []).length) { lines.push('YOUR ACTIONS:'); for (const a of ex.actions_roy) lines.push(`  • ${fmtRoy(a)}`); lines.push(''); }
  if ((ex.actions_others || []).length) { lines.push('OTHERS:'); for (const a of ex.actions_others) lines.push(`  • ${fmtOther(a)}`); lines.push(''); }
  if ((ex.decisions || []).length) { lines.push('DECISIONS:'); for (const d of ex.decisions) lines.push(`  • ${d}`); lines.push(''); }
  if ((ex.open_questions || []).length) { lines.push('OPEN QUESTIONS:'); for (const q of ex.open_questions) lines.push(`  • ${q}`); lines.push(''); }
  return lines.join('\n');
}

// ── modes ────────────────────────────────────────────────────────────────────
const outDir = path.join(ROOT, 'projects/briefs/zoom-meeting-intelligence/samples');
const slugify = (s) => (s || 'meeting').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const MODE_TONLY = args.includes('--transcript-only');
const FE = args.indexOf('--from-extract'); // --from-extract <bundle.json> <extract.json>

async function writeOutputs(ex, meta) {
  if (!NOTION) die('NOTION_API_TOKEN missing in .env');
  const draft = emailDraft(ex, meta);
  fs.mkdirSync(outDir, { recursive: true });
  const draftPath = path.join(outDir, `${meta.date}_${slugify(meta.title)}.email.txt`);
  fs.writeFileSync(draftPath, draft);
  console.log('\n──── EMAIL DRAFT (saved) ───────────────────────\n' + draft.slice(0, 1800));
  console.log(`\n  saved: ${draftPath}`);
  if (DRY) { console.log('\n[DRY] Notion write skipped.'); return; }
  const existing = await notionExisting(meta.uuid);
  if (existing) { console.log(`\nAlready in Notion (idempotent skip): ${existing.url}`); return; }
  const url = await notionCreate(ex, meta);
  console.log(`\n✓ Notion row created: ${url}`);
}

(async () => {
  // ── from-extract: write a (Claude-produced) extraction into Notion + draft ──
  if (FE !== -1) {
    const bundle = JSON.parse(fs.readFileSync(args[FE + 1], 'utf8'));
    const ex = JSON.parse(fs.readFileSync(args[FE + 2], 'utf8'));
    const meta = { ...bundle.meta, transcript: bundle.transcript };
    console.log(`from-extract → "${meta.title}" ${meta.date} (uuid ${meta.uuid})`);
    return writeOutputs(ex, meta);
  }

  if (!ZACCT || !ZID || !ZSECRET) die('Zoom S2S creds missing in .env');

  if (args.includes('--scan')) {
    const si = args.indexOf('--scan');
    const months = Number(args[si + 1]) || 24;
    const tk = await zoomToken();
    let users = await listUsers(tk);
    if (!users || !users.length) users = ['me'];
    const seen = new Map();
    const now = new Date();
    const yd = d => d.toISOString().slice(0, 10);
    for (const user of users) {
      for (let i = 0; i < months; i++) {
        const to = new Date(now); to.setDate(to.getDate() - i * 30);
        const from = new Date(to); from.setDate(from.getDate() - 30);
        const ms = await recordingsFor(tk, user, yd(from), yd(to));
        for (const m of ms) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
      }
    }
    const all = [...seen.values()];
    const POD = /power movers|podcast|thinking outside/i;
    const hasT = m => (m.recording_files || []).some(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT' || (f.recording_type || '') === 'audio_transcript' || (f.file_type || '').toUpperCase() === 'CC');
    // already-captured uuids in the Notion Meetings DB
    const captured = new Set();
    let cursor;
    do {
      const body = { page_size: 100 }; if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
      const j = await r.json();
      for (const p of j.results || []) { const s = (p.properties['Source'] && p.properties['Source'].rich_text || []).map(t => t.plain_text).join(''); if (s) captured.add(s); }
      cursor = j.has_more ? j.next_cursor : null;
    } while (cursor);
    let podcast = 0, notrans = 0, done = 0; const todo = [];
    for (const m of all) {
      if (POD.test(m.topic || '')) { podcast++; continue; }
      if (!hasT(m)) { notrans++; continue; }
      if (captured.has(m.uuid)) { done++; continue; }
      todo.push(m);
    }
    todo.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    console.log(`\n──── ARCHIVE SCAN (${months} months) ────`);
    console.log(`  total recordings   : ${all.length}`);
    console.log(`  podcasts (excluded): ${podcast}`);
    console.log(`  no transcript      : ${notrans}`);
    console.log(`  already captured   : ${done}`);
    console.log(`  TO BACKFILL        : ${todo.length}`);
    console.log(`\n  Oldest to backfill : ${todo.length ? (todo[todo.length - 1].start_time || '').slice(0, 10) : '-'}`);
    console.log(`  Newest to backfill : ${todo.length ? (todo[0].start_time || '').slice(0, 10) : '-'}`);
    console.log(`\n  Sample (newest 12):`);
    for (const m of todo.slice(0, 12)) console.log(`    ${(m.start_time || '').slice(0, 10)}  ${m.topic}`);
    return;
  }

  if (args.includes('--list')) {
    const li = args.indexOf('--list');
    const days = Number(args[li + 1]) || 2;
    const tk = await zoomToken();
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const yd = d => d.toISOString().slice(0, 10);
    const ms = await recordingsFor(tk, 'me', yd(from), yd(now));
    const POD = /power movers|podcast|thinking outside/i;
    console.log(`Last ${days} day(s) (${yd(from)}..${yd(now)}): ${ms.length} recording(s)`);
    for (const m of ms) {
      const files = m.recording_files || [];
      const hasT = files.some(f => (f.file_type || '').toUpperCase() === 'TRANSCRIPT' || (f.recording_type || '') === 'audio_transcript' || (f.file_type || '').toUpperCase() === 'CC');
      console.log('  ' + (m.start_time || '').slice(0, 10) + (POD.test(m.topic || '') ? ' [PODCAST→skip]' : '              ') + (hasT ? ' [VTT]   ' : ' [no-vtt]') + '  ' + m.topic);
    }
    return;
  }

  const token = await zoomToken();
  const meeting = await findRecording(token);
  const meta = { title: meeting.topic, date: (meeting.start_time || '').slice(0, 10), host: meeting._host, uuid: meeting.uuid };
  console.log(`\nChosen: "${meta.title}"  ${meta.date}  host=${meta.host}\n  uuid=${meta.uuid}`);

  const { text: transcript, files } = await fetchTranscript(token, meeting);
  if (!transcript) { console.log('  Recording files:', files.map(f => f.file_type).join(', ')); die('No transcript (VTT/TRANSCRIPT/CC) on this recording — alert path.'); }
  console.log(`  Transcript: ${transcript.length} chars, ${transcript.split('\n').length} lines.`);

  // ── transcript-only: dump a bundle for Claude to extract from, then stop ──
  if (MODE_TONLY) {
    fs.mkdirSync(outDir, { recursive: true });
    const bundlePath = path.join(outDir, `${meta.date}_${slugify(meta.title)}.bundle.json`);
    fs.writeFileSync(bundlePath, JSON.stringify({ meta, transcript }, null, 2));
    const txtPath = path.join(outDir, `${meta.date}_${slugify(meta.title)}.transcript.txt`);
    fs.writeFileSync(txtPath, transcript);
    console.log(`\n  bundle : ${bundlePath}\n  text   : ${txtPath}`);
    return;
  }

  // ── full programmatic path (needs a local ANTHROPIC_API_KEY) ──
  if (!ANTHROPIC) die('ANTHROPIC_API_KEY missing in .env — use --transcript-only (Claude extracts) or add the key.');
  console.log(`  Extracting with ${MODEL}…`);
  const ex = await extract(transcript, meta);
  meta.transcript = transcript;
  console.log('\n──── EXTRACTION ────────────────────────────────\n' + JSON.stringify(ex, null, 2).slice(0, 2500));
  return writeOutputs(ex, meta);
})().catch(e => die(e.stack || e.message));
