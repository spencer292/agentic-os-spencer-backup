/**
 * meeting-clip-fetch — stage a gated meeting for the shorts render: download the
 * face-view MP4 from Zoom + the clip plan, into the 00-longform inbox, so the
 * render step (reframe + captions) has clean inputs at the exact planned windows.
 *
 * Picks the variant that frames faces (gallery_view -> active_speaker -> any MP4),
 * since meeting shorts use the two-up "stacked" reframe, not the screenshare.
 *
 * Run: node scripts/meetings/meeting-clip-fetch.cjs --uuid "<zoomUuid>" [--months 3]
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
  if (!ZACCT || !ZID || !ZSECRET) die("Zoom creds missing in .env");
  const token = await zoomToken();
  const meeting = await findMeeting(token, uuid, Number(val("--months")) || 3);
  if (!meeting) die("uuid not found in Zoom window");
  const date = (meeting.start_time || "").slice(0, 10);
  const slug = slugify(meeting.topic);
  const mp4 = pickFaceMp4(meeting);
  if (!mp4 || !mp4.download_url) die("no MP4 on this recording");

  const planSrc = path.join(ROOT, "projects/briefs/zoom-meeting-intelligence/clips", `${date}_${slug}.clips.json`);
  if (!fs.existsSync(planSrc)) die(`no clip plan at ${planSrc} — run meeting-clips.cjs first`);

  const outDir = path.join(ROOT, "projects/00-longform-to-shortform/_inbox/meetings", `${date}_${slug}`);
  fs.mkdirSync(outDir, { recursive: true });
  const planDst = path.join(outDir, "clips.json");
  fs.copyFileSync(planSrc, planDst);

  const srcPath = path.join(outDir, "source.mp4");
  if (args.includes("--force") || !fs.existsSync(srcPath) || fs.statSync(srcPath).size < 1000) {
    console.log(`Downloading ${mp4.recording_type} (${Math.round((mp4.file_size || 0) / 1048576)}MB)…`);
    const r = await fetch(mp4.download_url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok || !r.body) die(`download ${r.status}`);
    await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(srcPath));
  } else {
    console.log("source.mp4 already present (skip download)");
  }
  console.log(`SOURCE=${srcPath}`);
  console.log(`PLAN=${planDst}`);
  console.log(`Clips planned: ${JSON.parse(fs.readFileSync(planDst, "utf8")).clips.length}`);
})().catch((e) => die(e.stack || e.message));
