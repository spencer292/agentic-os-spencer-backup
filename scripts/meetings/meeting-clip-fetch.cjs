/**
 * meeting-clip-fetch — stage a gated meeting for the shorts render: fetch the
 * face-view MP4 + the clip plan into the 00-longform inbox, so the render step
 * (reframe + captions) has clean inputs at the exact planned windows.
 *
 * Picks the variant that frames faces (active_speaker -> gallery_view -> any MP4),
 * since meeting shorts use the two-up "stacked" reframe, not the screenshare.
 *
 * TWO SOURCES, in order:
 *   1. Zoom cloud — the fast path, but only for recordings inside Zoom's retention window.
 *   2. The Drive archive — once 30-day retention is live, anything older has left Zoom.
 *      zoom-drain.cjs has already copied every file to 11_Zoom Recordings/02_Zoom Archive
 *      on the Elevate 360 shared drive and logged it in manifest.jsonl, so the fallback looks the meeting up
 *      by uuid in that manifest and reads the bytes straight off the locally mounted
 *      shared drive (Drive for Desktop). No Drive API needed for the transfer — the only
 *      Google credential in this repo is Gmail-scoped, and streaming a 500 MB MP4 through
 *      an n8n webhook is not reliable.
 *
 * If the archive holds a transcript VTT it is copied alongside, since the render step can
 * use it directly rather than re-transcribing.
 *
 * Run: node scripts/meetings/meeting-clip-fetch.cjs --uuid "<zoomUuid>" [--months 3]
 *      node scripts/meetings/meeting-clip-fetch.cjs --uuid "<u>" --from-archive   skip Zoom
 * Prints: SOURCE=<path>  PLAN=<path>  (for the render step to consume)
 */
const fs = require("fs");
const os = require("os");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");

const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const ZACCT = env.ZOOM_ACCOUNT_ID, ZID = env.ZOOM_CLIENT_ID, ZSECRET = env.ZOOM_CLIENT_SECRET;
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const die = (m) => { console.error("\nFAILED:", m); process.exit(1); };
const ymd = (d) => d.toISOString().slice(0, 10);
const slugify = (s) => (s || "meeting").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

async function zoomToken() {
  const basic = Buffer.from(`${ZID}:${ZSECRET}`).toString("base64");
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZACCT}`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  const j = await r.json();
  if (!r.ok) die(`Zoom token ${r.status}`);
  return j.access_token;
}
async function findMeeting(token, uuid, months) {
  const now = new Date(); const seen = new Map();
  for (let i = 0; i < months; i++) {
    const to = new Date(now); to.setDate(to.getDate() - i * 30);
    const from = new Date(to); from.setDate(from.getDate() - 30);
    const r = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=300&from=${ymd(from)}&to=${ymd(to)}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    for (const m of j.meetings || []) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
  }
  return seen.get(uuid);
}
// ── Drive archive fallback ────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, "projects/briefs/atp-google-migration/zoom-drain/manifest.jsonl");
// The Elevate 360 shared drive, as mounted by Drive for Desktop. Override with
// ZOOM_ARCHIVE_ROOT in .env if the drive letter differs on another machine.
// The archive lives under 11_Zoom Recordings/02_Zoom Archive since the Drive
// tidy-up; the bare paths stay last so a machine whose Drive mirror has not yet
// caught up with the move still resolves, and so do older mounts.
const ARCHIVE_ROOTS = [
  env.ZOOM_ARCHIVE_ROOT,
  "G:/Shared drives/Elevate 360/11_Zoom Recordings/02_Zoom Archive",
  "H:/Shared drives/Elevate 360/11_Zoom Recordings/02_Zoom Archive",
  "G:/Shared drives/Elevate 360/Zoom Archive",
  "H:/Shared drives/Elevate 360/Zoom Archive",
].filter(Boolean);

function archiveRoot() {
  for (const r of ARCHIVE_ROOTS) { try { if (fs.statSync(r).isDirectory()) return r; } catch {} }
  return null;
}

// Only `verified` rows count — those are the ones whose Drive byte count matched Zoom's.
function manifestEntries(uuid) {
  if (!fs.existsSync(MANIFEST)) return [];
  const out = [];
  for (const line of fs.readFileSync(MANIFEST, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const e = JSON.parse(line); if (e.uuid === uuid && e.verified) out.push(e); } catch {}
  }
  return out;
}

function pickArchiveFace(entries) {
  const mp4s = entries.filter((e) => /\.mp4$/i.test(e.name || ""));
  for (const t of ["active_speaker", "gallery_view", "shared_screen_with_speaker_view"]) {
    const hit = mp4s.find((e) => e.type === t);
    if (hit) return hit;
  }
  return mp4s[0] || null;
}

// The folder slug is cut to a different length by different scripts, so match on the
// date prefix and the file name rather than trying to rebuild the slug.
function resolveArchivePath(root, entry) {
  const monthDir = path.join(root, String(entry.date || "").slice(0, 7));
  let dirs;
  try {
    dirs = fs.readdirSync(monthDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith(entry.date + "_"))
      .map((d) => d.name);
  } catch { return null; }
  for (const d of dirs) {
    const p = path.join(monthDir, d, entry.name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function copyLocal(src, dst) {
  await pipeline(fs.createReadStream(src), fs.createWriteStream(dst));
  return fs.statSync(dst).size;
}

function pickFaceMp4(meeting) {
  // Prefer active_speaker (full-frame talking person) -> face-track gives a clean single-face 9:16.
  // gallery_view is unreliable for meetings: a notetaker/extra tile breaks the clean two-up grid.
  const f = meeting.recording_files || [];
  return f.find((x) => x.recording_type === "active_speaker" && (x.file_type || "").toUpperCase() === "MP4")
    || f.find((x) => x.recording_type === "gallery_view" && (x.file_type || "").toUpperCase() === "MP4")
    || f.find((x) => x.recording_type === "shared_screen_with_speaker_view" && (x.file_type || "").toUpperCase() === "MP4")
    || f.find((x) => (x.file_type || "").toUpperCase() === "MP4");
}

(async () => {
  const uuid = val("--uuid");
  if (!uuid) die('pass --uuid "<zoomUuid>"');
  const FROM_ARCHIVE = args.includes("--from-archive");

  // ── source 1: Zoom cloud ────────────────────────────────────────────────────
  let zoom = null;
  if (!FROM_ARCHIVE) {
    if (!ZACCT || !ZID || !ZSECRET) die("Zoom creds missing in .env");
    const token = await zoomToken();
    const meeting = await findMeeting(token, uuid, Number(val("--months")) || 3);
    const mp4 = meeting ? pickFaceMp4(meeting) : null;
    if (mp4 && mp4.download_url) zoom = { token, meeting, mp4 };
    else console.log(meeting ? "No MP4 on the Zoom recording — trying the Drive archive…"
                             : "Not in Zoom's retention window — trying the Drive archive…");
  }

  // ── source 2: the Drive archive (via the locally mounted shared drive) ───────
  let archive = null;
  if (!zoom) {
    const entries = manifestEntries(uuid);
    if (!entries.length) {
      die(`not in Zoom, and uuid ${uuid} has no verified entry in ${MANIFEST}.\n` +
          `        This meeting may predate the archive drain, or the uuid is wrong.`);
    }
    const root = archiveRoot();
    if (!root) {
      die(`not in Zoom. It IS in the Drive archive manifest, but the Elevate 360 shared drive is not\n` +
          `        mounted on this machine, so the bytes cannot be read.\n` +
          `        Fix: start Google Drive for Desktop, or set ZOOM_ARCHIVE_ROOT in .env to the mount path.\n` +
          `        Manual route: open Drive > Elevate 360 > 11_Zoom Recordings > 02_Zoom Archive > ${String(entries[0].date).slice(0, 7)}, ` +
          `find the ${entries[0].date} folder, and download the active_speaker MP4 by hand.`);
    }
    const face = pickArchiveFace(entries);
    if (!face) die(`archive holds this meeting but no MP4 (only ${entries.map((e) => e.type).join(", ")}).`);
    const src = resolveArchivePath(root, face);
    if (!src) die(`archive manifest lists ${face.name} for this meeting, but it is not on disk under ${root}.\n` +
                  `        Drive may still be syncing, or the folder was moved.`);
    archive = { entry: face, entries, path: src, root };
  }

  const date = zoom ? (zoom.meeting.start_time || "").slice(0, 10) : archive.entry.date;
  const topic = zoom ? zoom.meeting.topic : archive.entry.topic;
  const slug = slugify(topic);

  const planSrc = path.join(ROOT, "projects/briefs/zoom-meeting-intelligence/clips", `${date}_${slug}.clips.json`);
  if (!fs.existsSync(planSrc)) die(`no clip plan at ${planSrc} — run meeting-clips.cjs first`);

  const outDir = path.join(ROOT, "projects/00-longform-to-shortform/_inbox/meetings", `${date}_${slug}`);
  fs.mkdirSync(outDir, { recursive: true });
  const planDst = path.join(outDir, "clips.json");
  fs.copyFileSync(planSrc, planDst);

  const srcPath = path.join(outDir, "source.mp4");
  if (args.includes("--force") || !fs.existsSync(srcPath) || fs.statSync(srcPath).size < 1000) {
    if (zoom) {
      console.log(`Downloading ${zoom.mp4.recording_type} from Zoom (${Math.round((zoom.mp4.file_size || 0) / 1048576)}MB)…`);
      const r = await fetch(zoom.mp4.download_url, { headers: { Authorization: `Bearer ${zoom.token}` } });
      if (!r.ok || !r.body) die(`download ${r.status}`);
      await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(srcPath));
    } else {
      const want = Number(archive.entry.drive_bytes) || 0;
      console.log(`Copying ${archive.entry.type} from the Drive archive (${Math.round(want / 1048576)}MB)…`);
      const got = await copyLocal(archive.path, srcPath);
      // Drive for Desktop hydrates on read; a short copy means the file was not fully synced.
      if (want && got !== want) die(`archive copy is ${got} bytes, manifest says ${want}. Incomplete — re-run once Drive has finished syncing.`);
      console.log(`   verified ${got} bytes against the manifest.`);
    }
  } else {
    console.log("source.mp4 already present (skip download)");
  }

  // The archive usually carries the Zoom VTT too — cheaper than re-transcribing.
  if (archive) {
    const vtt = archive.entries.find((e) => /\.vtt$/i.test(e.name || ""));
    const vttSrc = vtt && resolveArchivePath(archive.root, vtt);
    if (vttSrc) {
      const vttDst = path.join(outDir, "transcript.vtt");
      const bytes = await copyLocal(vttSrc, vttDst);
      console.log(`TRANSCRIPT=${vttDst} (${bytes} bytes)`);
    }
  }
  console.log(`SOURCE=${srcPath}`);
  console.log(`ORIGIN=${zoom ? "zoom" : "drive-archive"}`);
  console.log(`PLAN=${planDst}`);
  console.log(`Clips planned: ${JSON.parse(fs.readFileSync(planDst, "utf8")).clips.length}`);
})().catch((e) => die(e.stack || e.message));
