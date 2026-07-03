/**
 * Per-episode thumbnail driver (Power Movers Podcast).
 *
 * Resolves everything the layered renderer needs straight from Notion + the
 * episode's YouTube-description Google Doc, auto-picks the rotating accent, and
 * renders the picked thumbnail via scripts/podcast/thumbgen.py.
 *
 *   guest name   <- Guest First/Last Name
 *   credential   <- Guest Bio (first clause, distilled)
 *   hook         <- THUMBNAIL_TEXT: in the YouTube Desc doc (parsed)
 *   guest photo  <- Guest Photo (files) | Guest Photo URL | --photo override
 *                   (no photo + no override -> FLAG and skip, never ship faceless)
 *   accent       <- rotates per episode number (amber|coral|cyan|green)
 *
 * Usage:
 *   node scripts/podcast/thumbnail-build.cjs <ep> [--photo <path|url>] [--grid] [--live]
 *     --grid : also render the 4-accent comparison grid for reference
 *     --live : (not yet) upload chosen image to Drive + write Thumbnail File ID + tick Thumbnail Chosen
 *   default = DRY: resolve + render locally + copy to Downloads, no Notion/Drive writes.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(`${ROOT}/.env`, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const NH = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const ACCENTS = ['amber', 'coral', 'cyan', 'green'];
const HOST_DEFAULT = '05092023_ATP_014.png';
const THUMB_FOLDER = '18x0YIijU3LC-avK0KpJw3t8MTeXMCOWv';   // 17_Podcast Thumbnails (Elevate 360 shared drive)

function uploadToDrive(localPath, name) {
  const out = execFileSync('node', [`${ROOT}/scripts/podcast/drive-upload.cjs`, localPath, THUMB_FOLDER, name], { encoding: 'utf8' });
  const m = out.match(/FILE_ID=(\S+)/);
  if (!m) throw new Error('Drive upload failed: ' + out.slice(0, 300));
  return m[1];
}

async function notionSetThumbnail(pageId, fileId) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH', headers: NH,
    body: JSON.stringify({ properties: {
      'Thumbnail File ID': { rich_text: [{ text: { content: fileId } }] },
      'Thumbnail Chosen': { checkbox: true },
    } }),
  });
  if (!r.ok) throw new Error('Notion write failed: ' + JSON.stringify(await r.json()).slice(0, 300));
}

const args = process.argv.slice(2);
const ep = String(args[0] || '').replace(/\D/g, '');
const LIVE = args.includes('--live');
const GRID = args.includes('--grid');
const photoOverride = (() => { const i = args.indexOf('--photo'); return i >= 0 ? args[i + 1] : null; })();
if (!ep) { console.log('usage: thumbnail-build.cjs <episodeNumber> [--photo <path|url>] [--grid] [--live]'); process.exit(1); }

const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');

function credFromBio(bio) {
  if (!bio) return '';
  let s = bio.split(/(?<=[.!?])\s/)[0];                       // first sentence
  s = s.replace(/^.*?\bis\b\s+(an?\s+|the\s+)?/i, '');         // drop "<Name> is a/the "
  s = s.split(/,| who | based | and host| a year| a #/i)[0];  // up to first clause break
  s = s.replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  // light tidy: "co-founder and CEO of X" -> "Co-Founder & CEO, X"
  s = s.replace(/\band\b/i, '&').replace(/\bof\b/i, ',');
  s = s.replace(/\s*,\s*/g, ', ');
  return s.split(' ').map(w => w.length > 3 && w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function hookFromDoc(docUrl) {
  const m = docUrl && docUrl.match(/\/document\/d\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const url = `https://www.googleapis.com/drive/v3/files/${m[1]}/export?mimeType=text/plain`;
  let out;
  try { out = execFileSync('node', [`${ROOT}/scripts/podcast/drive-via-n8n.cjs`, 'GET', url], { encoding: 'utf8' }); }
  catch (e) { console.log('  desc-doc read failed:', e.message); return null; }
  // the Drive export comes back with newlines escaped as literal \r\n — restore them,
  // then capture the THUMBNAIL_TEXT value only (stops at newline / quote).
  out = out.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\\"/g, '"');
  const hm = out.match(/THUMBNAIL[\\_]*TEXT:\s*([^\n\r"]+)/i);
  return hm ? hm[1].trim() : null;
}

async function download(src, dest) {
  if (/^https?:/i.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`photo fetch ${r.status}`);
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  } else {
    fs.copyFileSync(src, dest);
  }
  return dest;
}

(async () => {
  // ---- Notion row ----------------------------------------------------------
  let rows = [], cursor;
  do {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
      method: 'POST', headers: NH, body: JSON.stringify(cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 }),
    });
    const j = await r.json(); rows = rows.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  const row = rows.find(p => String(p.properties['Episode Number']?.number) === ep);
  if (!row) { console.log('No Notion row for ep', ep); return; }
  const p = row.properties;

  const name = `${txt(p['Guest First Name'])} ${txt(p['Guest Last Name'])}`.trim();

  // Audio-only (Captivate-only) episodes have no video -> never go to YouTube -> no thumbnail.
  // Signal: a video asset exists (Condensed Video File ID) or a YouTube URL is already set.
  const isVideoEpisode = !!txt(p['Condensed Video File ID']) || !!p['Full Episode YouTube']?.url;
  if (!isVideoEpisode) {
    console.log(`\n=== Ep ${ep} — ${name} ===`);
    console.log('  -> SKIP: audio-only episode (no video asset). Captivate-only, no YouTube upload — no thumbnail needed.');
    return;
  }

  const credential = credFromBio(txt(p['Guest Bio']));
  const hook = hookFromDoc(p['YouTube Desc Link']?.url);
  const highlight = hook ? hook.trim().split(/\s+/).pop() : '';   // default: last word
  const accent = ACCENTS[(Number(ep) - 1 + ACCENTS.length) % ACCENTS.length];

  // ---- guest photo (override -> Notion file -> Notion URL -> flag) ----------
  const notionFile = (p['Guest Photo']?.files || [])[0];
  const photoSrc = photoOverride
    || notionFile?.file?.url || notionFile?.external?.url
    || p['Guest Photo URL']?.url || null;

  const outDir = `${ROOT}/projects/briefs/podcast-system-rebuild/thumbnail-generator/episodes/ep${ep}`;
  fs.mkdirSync(`${outDir}/assets`, { recursive: true });

  console.log(`\n=== Ep ${ep} — ${name} ===`);
  console.log('  hook       :', hook || '(MISSING — no THUMBNAIL_TEXT)');
  console.log('  highlight  :', highlight);
  console.log('  credential :', credential || '(none)');
  console.log('  accent     :', accent, `(rotation: ep ${ep})`);
  console.log('  photo src  :', photoSrc ? (photoOverride ? 'OVERRIDE ' : '') + photoSrc.slice(0, 70) : 'NONE');

  if (!hook) { console.log('\n  -> SKIP: no hook text in the description doc.'); return; }
  if (!photoSrc) {
    console.log('\n  -> FLAG: no guest photo in Notion and no --photo override. Not shipping a faceless thumbnail.');
    console.log('     Add a Guest Photo in Notion, or re-run with --photo <path|url>.');
    return;
  }

  const rawPhoto = `${outDir}/assets/guest-raw${path.extname(photoSrc.split('?')[0]) || '.jpg'}`;
  try { await download(photoSrc, rawPhoto); } catch (e) { console.log('  photo download failed:', e.message); return; }

  // ---- render --------------------------------------------------------------
  const pyArgs = [
    `${ROOT}/scripts/podcast/thumbgen.py`,
    '--guest-img', rawPhoto,
    '--hook', hook, '--highlight', highlight,
    '--guest-name', name, '--credential', credential,
    '--host-imgs', HOST_DEFAULT,
    '--out', outDir,
  ];
  if (!GRID) pyArgs.push('--accent', accent);
  console.log('\n  rendering...');
  execFileSync('python', pyArgs, { stdio: 'inherit' });

  const picked = GRID ? `${outDir}/variant-${ACCENTS.indexOf(accent) + 1}-${accent}.jpg`
                      : `${outDir}/variant-1-${accent}.jpg`;
  const dl = `C:/Users/roy.castleman/Downloads/ep${ep}-thumbnail-${accent}.jpg`;
  try { fs.copyFileSync(picked, dl); console.log('  -> Downloads:', dl); } catch {}

  console.log(`\n  chosen thumbnail: ${picked}`);
  if (LIVE) {
    const driveName = `ep${ep}-thumbnail-${accent}.jpg`;
    console.log('\n  uploading to Drive...');
    const fileId = uploadToDrive(picked, driveName);
    console.log('  Drive file id :', fileId);
    await notionSetThumbnail(row.id, fileId);
    console.log('  Notion        : Thumbnail File ID set + Thumbnail Chosen ticked');
    console.log('  view          :', `https://drive.google.com/file/d/${fileId}/view`);
    console.log('\n  LIVE done — P06 will attach this thumbnail when ep', ep, 'uploads.');
  } else {
    console.log('\n  DRY run — no Notion/Drive writes. Re-run with --live to upload + set Notion.');
  }
})().catch(e => console.log('Error:', e.message));
