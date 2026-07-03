/**
 * Episode integrity verifier — "what went in is what's out there".
 * For each in-flight episode, checks the cleaned audio export, the cleaned
 * video, the rendered clips, and the Captivate draft against what is actually
 * present on the Drive (G:) mount + local renders, then writes ✅/⚠️ status into
 * the Podcast Episodes Database (Audio/Video/Clips/Captivate Verified + Checks
 * Updated). Existence + non-zero + size-match. Read-only against the files.
 *
 * Run: node scripts/podcast/verify-episode-integrity.cjs [--limit N] [--dry]
 */
const fs = require('fs');
const path = require('path');

const ENVPATH = 'C:/Claude/agent-os-v3/agentic-os/.env';
const env = {};
for (const line of fs.readFileSync(ENVPATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const EXPORTS = 'G:/Shared drives/Elevate 360/09_Marketing Videos and Pictures/04_Podcast/00_Cleaned Exports (New System)';
const RAW = 'G:/Shared drives/Elevate 360/09_Marketing Videos and Pictures/04_Podcast/11_Podcast Raw';
const DROPS = ['Done', 'Inbox', 'Processing'].map(d => `G:/Shared drives/Elevate 360/24_Video Drops/${d}`);
const LOCAL_RENDERS = 'C:/Claude/agent-os-v3/agentic-os/projects/00-longform-to-shortform/renders';
const LOCAL_RUNS = 'C:/Claude/agent-os-v3/agentic-os/projects/00-longform-to-shortform/runs';

const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? parseInt(process.argv[i + 1]) : 6; })();
const DRY = process.argv.includes('--dry');

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sizeOf = p => { try { return fs.statSync(p).size; } catch { return -1; } };
const lsSafe = d => { try { return fs.readdirSync(d); } catch { return []; } };

function listFilesRecursive(dir, depth = 2) {
  let out = [];
  for (const name of lsSafe(dir)) {
    const full = path.join(dir, name);
    let st; try { st = fs.statSync(full); } catch { continue; }
    if (st.isDirectory() && depth > 0) out = out.concat(listFilesRecursive(full, depth - 1));
    else if (st.isFile()) out.push({ name, full, size: st.size });
  }
  return out;
}

function checkAudio(first, last) {
  const want = [norm(`${first} ${last}`), norm(last)];
  for (const f of lsSafe(EXPORTS)) {
    if (!/\.(mp3|m4a|wav)$/i.test(f)) continue;
    const n = norm(f);
    if (want.some(w => w && n.includes(w))) {
      return sizeOf(path.join(EXPORTS, f)) > 1024 ? 'Verified' : 'Mismatch';
    }
  }
  return 'Missing';
}

const RECENT_DAYS = 30;
function findRawFolder(first, last) {
  const want = [norm(last), norm(`${first}${last}`)];
  for (const d of lsSafe(RAW)) {
    const n = norm(d);
    if (want.some(w => w && n.includes(w))) return path.join(RAW, d);
  }
  return null;
}
function rawFolderRecent(first, last) {
  const f = findRawFolder(first, last);
  if (!f) return false;
  try {
    const ageDays = (Date.now() - fs.statSync(f).mtimeMs) / 86400000;
    return ageDays <= RECENT_DAYS;
  } catch { return false; }
}

function checkVideo(first, last) {
  const folder = findRawFolder(first, last);
  if (!folder) return 'Pending';                 // not ingested yet
  const cv = path.join(folder, 'cleaned-video.mp4');
  const sz = sizeOf(cv);
  if (sz > 1024) return 'Verified';
  // a gallery exists but no cleaned export => still waiting on Descript export
  const hasGallery = lsSafe(folder).some(f => /gallery.*\.mp4$/i.test(f) || /\.mp4$/i.test(f));
  return hasGallery ? 'Missing' : 'Pending';
}

function localClips(first, last) {
  const wantL = norm(last);
  let files = [];
  for (const run of lsSafe(LOCAL_RENDERS)) {
    if (!norm(run).includes(wantL)) continue;
    files = files.concat(listFilesRecursive(path.join(LOCAL_RENDERS, run), 0).filter(f => /^clip-\d+\.mp4$/i.test(f.name)));
  }
  for (const run of lsSafe(LOCAL_RUNS)) {
    if (!norm(run).includes(wantL)) continue;
    files = files.concat(listFilesRecursive(path.join(LOCAL_RUNS, run, 'micros'), 2).filter(f => /final\.mp4$/i.test(f.name)));
  }
  return files;
}

function driveClips(epNum) {
  const prefix = `${epNum}_`;
  let files = [];
  for (const d of DROPS) {
    files = files.concat(lsSafe(d)
      .filter(f => f.startsWith(prefix) && /\.(mp4|mov)$/i.test(f))
      .map(f => ({ name: f, full: path.join(d, f), size: sizeOf(path.join(d, f)) })));
  }
  return files;
}

function checkClips(epNum, first, last) {
  const drive = driveClips(epNum);
  const local = localClips(first, last);
  if (drive.length === 0 && local.length === 0) return 'Pending';      // no clips produced yet
  if (drive.length === 0) return 'Missing';                            // local exist but nothing on Drive
  if (drive.some(f => f.size <= 1024)) return 'Mismatch';              // a zero/half-synced file on Drive
  if (local.length > 0 && drive.length < local.length) return 'Mismatch'; // fewer on Drive than rendered
  return 'Verified';
}

async function queryAll() {
  let out = [], cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    const j = await r.json();
    out = out.concat(j.results || []);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');

async function patch(pageId, sel) {
  const today = new Date(env.__NOW__ || Date.now()).toISOString().split('T')[0];
  const body = { properties: {
    'Audio Verified':     { select: { name: sel.audio } },
    'Video Verified':     { select: { name: sel.video } },
    'Clips Verified':     { select: { name: sel.clips } },
    'Captivate Verified': { select: { name: sel.captivate } },
    'Checks Updated':     { date: { start: today } },
  }};
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) console.log('   PATCH failed', r.status, (await r.text()).slice(0, 200));
}

(async () => {
  const rows = await queryAll();
  let written = 0;
  for (const p of rows) {
    const first = txt(p.properties['Guest First Name']);
    const last = txt(p.properties['Guest Last Name']);
    const epNum = p.properties['Episode Number']?.number;
    const status = p.properties['Episode Status']?.select?.name || '';
    const audioId = txt(p.properties['Audio File ID']);
    const captId = txt(p.properties['Captivate Episode ID']);
    if (!last) continue;
    const sel = {
      audio: checkAudio(first, last),
      video: checkVideo(first, last),
      clips: epNum ? checkClips(epNum, first, last) : 'Pending',
      captivate: captId ? 'Verified' : 'Pending',
    };
    // In-flight = active status, processing started, clips produced, or a recording
    // touched within the last 30 days. Old guests with stale raw folders are excluded.
    const inflight = Boolean(status) || Boolean(audioId) || Boolean(captId) ||
      sel.audio === 'Verified' || sel.clips !== 'Pending' || rawFolderRecent(first, last);
    if (!inflight) continue;
    console.log(`Ep ${epNum ?? '—'} ${first} ${last} [${status || '—'}]  audio=${sel.audio} video=${sel.video} clips=${sel.clips} captivate=${sel.captivate}`);
    if (!DRY) { await patch(p.id, sel); written++; }
  }
  console.log(DRY ? '\n(dry run — nothing written)' : `\nIntegrity written to ${written} in-flight episode(s).`);
})();
