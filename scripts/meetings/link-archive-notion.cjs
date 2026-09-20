#!/usr/bin/env node
/**
 * link-archive-notion — point each un-archived Notion Meetings row at the copy of the
 * meeting that ALREADY exists in 11_Zoom Recordings/02_Zoom Archive, instead of
 * uploading a second copy of the same recording into 03_Meeting Recordings.
 *
 * Why this replaces the upload sweep: the 07:15 Zoom Archive Sweep already drains
 * EVERY recording file of EVERY meeting into the archive and records the Drive folder
 * id and per-file Drive id in manifest.jsonl. The old 08:00 job then re-downloaded the
 * best MP4 from Zoom and uploaded it a second time, so the same video was paid for and
 * stored twice, and rows fell out of Zoom's retention window before the batch reached
 * them. Reading the manifest costs no bytes, no Zoom call, and no Drive call — and it
 * keeps working for meetings that have already aged out of Zoom cloud entirely.
 *
 * Notion is written exactly as before, so nothing downstream has to change:
 *   Recording        -> https://drive.google.com/drive/folders/{per-meeting folder id}
 *   Recording File ID-> Drive file id of the face-view MP4 (active_speaker preferred)
 *   Video Archived   -> true
 *
 * Only `verified` manifest rows count (Drive byte count matched Zoom's), the same bar
 * meeting-clip-fetch.cjs uses before it will read a file.
 *
 * Run:
 *   node scripts/meetings/link-archive-notion.cjs              # link everything linkable, 60d
 *   node scripts/meetings/link-archive-notion.cjs --days 400   # widen to the whole drain
 *   node scripts/meetings/link-archive-notion.cjs --dry        # report only, write nothing
 */
const fs = require('fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DATA_SOURCE_ID = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const NH = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const MANIFEST = path.join(ROOT, 'projects/briefs/atp-google-migration/zoom-drain/manifest.jsonl');

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const DRY = flag('--dry');
const DAYS = Number(val('--days')) || 60;
const die = (m) => { console.error('\nFAILED:', m); process.exit(1); };

// ── manifest ──────────────────────────────────────────────────────────────────
// uuid -> verified entries for that meeting
function loadManifest() {
  if (!fs.existsSync(MANIFEST)) die(`no manifest at ${MANIFEST} — run the Zoom Archive Sweep first.`);
  const byUuid = new Map();
  for (const line of fs.readFileSync(MANIFEST, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (!e.uuid || !e.verified || !e.folder) continue;
      if (!byUuid.has(e.uuid)) byUuid.set(e.uuid, []);
      byUuid.get(e.uuid).push(e);
    } catch {}
  }
  return byUuid;
}

// Same preference order as meeting-clip-fetch.cjs: the clip lane wants faces, not the
// screenshare, so whatever is linked here is the file it will actually want later.
function pickFace(entries) {
  const mp4s = entries.filter((e) => /\.mp4$/i.test(e.name || ''));
  for (const t of ['active_speaker', 'gallery_view', 'shared_screen_with_speaker_view']) {
    const hit = mp4s.find((e) => e.type === t);
    if (hit) return hit;
  }
  return mp4s[0] || null;
}

// ── Notion ────────────────────────────────────────────────────────────────────
const rt = (s) => [{ text: { content: String(s || '').slice(0, 1900) } }];

async function unarchivedRows(days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const filter = { and: [
    { property: 'Date', date: { on_or_after: cutoff } },
    { property: 'Video Archived', checkbox: { equals: false } },
  ] };
  const rows = [];
  let cursor;
  do {
    const body = { filter, sorts: [{ property: 'Date', direction: 'descending' }], page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) die(`Notion query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    for (const p of j.results || []) {
      rows.push({
        id: p.id,
        url: p.url,
        uuid: ((p.properties['Source'] && p.properties['Source'].rich_text) || []).map((t) => t.plain_text).join('').trim(),
        title: ((p.properties['Name'] && p.properties['Name'].title) || []).map((t) => t.plain_text).join(''),
        date: (p.properties['Date'] && p.properties['Date'].date && p.properties['Date'].date.start) || '',
      });
    }
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows.filter((x) => x.uuid);
}

async function linkRow(pageId, folderUrl, fileId) {
  const props = {
    'Recording': { url: folderUrl },
    'Recording File ID': { rich_text: rt(fileId) },
    'Video Archived': { checkbox: true },
  };
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: 'PATCH', headers: NH, body: JSON.stringify({ properties: props }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Notion update ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (!NOTION) die('NOTION_API_TOKEN missing in .env');
  const byUuid = loadManifest();
  console.log(`Manifest: ${byUuid.size} meeting(s) with verified files in the Drive archive.`);

  const rows = await unarchivedRows(DAYS);
  console.log(`Notion: ${rows.length} row(s) with Video Archived = false in the last ${DAYS} days.\n`);

  let linked = 0, noEntry = 0, noMp4 = 0, failed = 0;
  for (const row of rows) {
    const entries = byUuid.get(row.uuid);
    if (!entries) {
      // Not drained yet (or never recorded). The sweep runs at 07:15 daily, so a row
      // logged today is normally linked on tomorrow's pass — not an error.
      console.log(`- ${row.date} ${row.title} — not in the archive manifest yet, leaving unticked`);
      noEntry++;
      continue;
    }
    const face = pickFace(entries);
    if (!face) {
      console.log(`- ${row.date} ${row.title} — archived but audio-only (${[...new Set(entries.map((e) => e.type))].join(', ')}), leaving unticked`);
      noMp4++;
      continue;
    }
    const folderUrl = `https://drive.google.com/drive/folders/${face.folder}`;
    if (DRY) { console.log(`  [DRY] ${row.date} ${row.title} -> ${face.type} ${face.drive_id}`); linked++; continue; }
    try {
      await linkRow(row.id, folderUrl, face.drive_id);
      console.log(`+ ${row.date} ${row.title} -> ${face.type}  ${folderUrl}`);
      linked++;
    } catch (e) {
      console.log(`! ${row.date} ${row.title}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nLink pass${DRY ? ' [DRY]' : ''}: ${linked} linked, ${noEntry} awaiting drain, ${noMp4} audio-only, ${failed} failed.`);
  console.log('No bytes were moved — every row points at the copy the Zoom Archive Sweep already made.');
})().catch((e) => die(e.stack || e.message));
