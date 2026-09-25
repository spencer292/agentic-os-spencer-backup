/**
 * Per-episode thumbnail driver (Power Movers Podcast).
 *
 * Resolves everything the renderer needs straight from Notion + the episode's
 * YouTube-description Google Doc, then renders the locked design via
 * scripts/podcast/thumb-challengers.py.
 *
 *   guest name   <- Guest First/Last Name
 *   hook         <- THUMBNAIL_TEXT: in the YouTube Desc doc (parsed)
 *   guest photo  <- Guest Photo (files) | Guest Photo URL | --photo override
 *                   (no photo + no override -> FLAG and skip, never ship faceless)
 *   accent       <- rotates per episode number (light-green|light-blue)
 *   host shot    <- rotates per episode number across the approved logo-free cut-outs
 *
 * Design: C2 guest-dominant, locked 2026-08-16. Superseded thumbgen.py, which
 * matted guests through a generative image model. Spec + rationale:
 * .claude/skills/mkt-youtube-optimizer/references/thumbnail-patterns.md
 *
 * NOTE the guest photo is read from the NOTION ROW, not from the Guest Photos Drive
 * folder. A photo uploaded only to Drive is invisible here - use --photo for those.
 *
 * Usage:
 *   node scripts/podcast/thumbnail-build.cjs <ep> [--photo <path|url>] [--live]
 *     --live : upload chosen image to Drive + write Thumbnail File ID + tick Thumbnail Chosen
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
// Locked design, 2026-08-16. Roy picked C2 guest-dominant from a four-way test
// (control + three challengers) rendered across eps 83/85/87 and judged at real
// feed sizes, 360px and 168px.
const DESIGN = 'C2-guest-dominant';

// Brand accents only. The palette nominally offers four, but on a Night Sky ground
// only two work as a highlight: Sky #E4EAE8 IS the body-text colour, and Dusty Blue
// #5E6D76 is barely lighter than the ground. So the rotation is two-wide and the
// episode-to-episode variety comes from the host shot and the guest photo instead.
const ACCENTS = ['light-green', 'light-blue'];

// Approved logo-free cut-outs with the pattern library's expression guide. The old
// engine used a single shot (_014) on every episode from the RETIRED branded-tee
// folder, so half of every thumbnail was an identical constant AND off-brand.
const HOST_SHOTS = [
  '05092023_ATP_014.png',   // wry lean-in - hard truths
  '05092023_ATP_010.png',   // calm direct - default
  '05092023_ATP_007.png',   // arms crossed - authority
  '05092023_ATP_011.png',   // pointing up - artifact/teaching
];
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
const photoOverride = (() => { const i = args.indexOf('--photo'); return i >= 0 ? args[i + 1] : null; })();
if (!ep) { console.log('usage: thumbnail-build.cjs <episodeNumber> [--photo <path|url>] [--live]'); process.exit(1); }

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
  // Guard: some Guest Bio rows hold a URL or an email rather than prose. Distilling
  // one produces a credential line that renders a raw link across the thumbnail
  // (caught on ep 85). A missing credential renders cleanly; a URL never does.
  if (/https?:\/\/|www\.|\S+@\S+|\.(com|net|org|de|io|ai|html?)\b/i.test(s)) return '';
  // Anything this long is unreadable at feed size — drop it rather than print noise.
  if (s.length > 42) return '';
  return s.split(' ').map(w => w.length > 3 && w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function hookFromDoc(docUrl) {
  const m = docUrl && docUrl.match(/\/document\/d\/([A-Za-z0-9_-]+)/);
  if (!m) return {};
  const url = `https://www.googleapis.com/drive/v3/files/${m[1]}/export?mimeType=text/plain`;
  let out;
  try { out = execFileSync('node', [`${ROOT}/scripts/podcast/drive-via-n8n.cjs`, 'GET', url], { encoding: 'utf8' }); }
  catch (e) { console.log('  desc-doc read failed:', e.message); return {}; }
  // the Drive export comes back with newlines escaped as literal \r\n — restore them,
  // then capture the THUMBNAIL_TEXT value only (stops at newline / quote).
  out = out.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\\"/g, '"');
  const hm = out.match(/THUMBNAIL[\\_]*TEXT:\s*([^\n\r"]+)/i);
  // THUMBNAIL_ACCENT names the word that takes the brand accent - the PATH word,
  // never the wound. Optional: without it the renderer accents the last word, which
  // is right for most hooks but not all (ROWING THE SAME WAY needs SAME, not WAY).
  const am = out.match(/THUMBNAIL[\_]*ACCENT:\s*([^\n\r"]+)/i);
  return { hook: hm ? hm[1].trim() : null, accentWord: am ? am[1].trim() : null };
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
  const { hook, accentWord } = hookFromDoc(p['YouTube Desc Link']?.url) || {};
  const highlight = accentWord || (hook ? hook.trim().split(/\s+/).pop() : '');
  const accent = ACCENTS[(Number(ep) - 1 + ACCENTS.length) % ACCENTS.length];
  const hostShot = HOST_SHOTS[(Number(ep) - 1 + HOST_SHOTS.length) % HOST_SHOTS.length];

  // ---- guest photo (override -> Notion file -> Notion URL -> flag) ----------
  const notionFile = (p['Guest Photo']?.files || [])[0];
  const photoSrc = photoOverride
    || notionFile?.file?.url || notionFile?.external?.url
    || p['Guest Photo URL']?.url || null;

  const outDir = `${ROOT}/projects/briefs/podcast-system-rebuild/thumbnail-generator/episodes/ep${ep}`;
  fs.mkdirSync(`${outDir}/assets`, { recursive: true });

  console.log(`\n=== Ep ${ep} — ${name} ===`);
  console.log('  hook       :', hook || '(MISSING — no THUMBNAIL_TEXT)');
  console.log('  accent word:', highlight, accentWord ? '(from doc)' : '(default: last word)');
  console.log('  credential :', credential || '(none)', '(not rendered - unreadable at 168px)');
  console.log('  accent     :', accent, `(rotation: ep ${ep})`);
  console.log('  host shot  :', hostShot);
  console.log('  design     :', DESIGN);
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
  // C2 guest-dominant, locked 2026-08-16. Replaces thumbgen.py, which matted the
  // guest by asking Gemini to chroma-isolate them - a generative model redrawing a
  // real person, which breached the brand's REAL-photography-only rule and produced
  // the ep 87 thumbnail with the host deleted. The new renderer never hands a person
  // to an image model: photos go in frames or full-bleed, untouched. It also carries
  // the brand palette and BN Dime Display, neither of which thumbgen.py used.
  const pyArgs = [
    `${ROOT}/scripts/podcast/thumb-challengers.py`,
    '--design', DESIGN,
    '--ep', ep,
    '--guest', name,
    '--photo', rawPhoto,
    '--hook', hook,
    '--accent', accent,
    '--host', hostShot,
    ...(highlight ? ['--highlight', highlight] : []),
    '--out', outDir,
  ];
  console.log('\n  rendering...');
  execFileSync('python', pyArgs, { stdio: 'inherit' });

  const picked = `${outDir}/ep${ep}_${DESIGN}_${accent}.jpg`;
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
