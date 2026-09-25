/**
 * gemini-review - send a video to Google Gemini and get a quality review back.
 * Used to QA rendered shorts (compression, sharpness, framing, caption legibility)
 * before they go to the social intake. Small clips (<~18MB) go inline; bigger ones
 * upload via the Files API first.
 *
 * Run: node scripts/meetings/gemini-review.cjs --file <video.mp4> [--prompt "..."] [--model gemini-2.5-flash]
 */
const fs = require("fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const die = (m) => { console.error("FAILED:", m); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = "https://generativelanguage.googleapis.com";
const MODEL = val("--model") || "gemini-3.6-flash"; // bumped 2026-08-11 from 2.5-flash (a generation behind); --model overrides if unavailable

const SHORTS_PROMPT = `You are a critical video-quality reviewer for short-form social clips (9:16, for YouTube Shorts / Reels / TikTok).
Watch this clip and assess, specifically and honestly:
1. Compression / encoding: blockiness, macroblocking, banding, softness, upscaling artifacts. Does it look low-resolution or over-compressed?
2. Sharpness & resolution: is the speaker's face crisp or soft/blurry?
3. Framing: is the speaker well-positioned in 9:16? Any awkward cropping?
4. Captions: legible? well-timed to speech? well-placed?
5. Overall: is this postable as-is? If not, what is the SINGLE biggest quality problem and the concrete fix?
Give a short verdict (postable / needs work / reject) then bullet points. Be concrete about whether the problem is the source footage vs the processing.`;

const LONGFORM_PROMPT = `You are a critical video-quality reviewer for a LANDSCAPE 16:9 long-form YouTube asset - a condensed podcast episode, typically 10-15 minutes, built from a two-person Zoom/webcam recording composed onto a branded 1080p canvas.
This is NOT a vertical short. Do NOT critique it for aspect ratio, for lacking a 9:16 crop, or for missing burned-in captions - none of those apply to this format, and raising them is a review error.
Watch it and assess, specifically and honestly:
1. Encoding: blockiness, macroblocking, banding, upscaling artifacts. Separate genuine encode faults from the webcam source's own limits.
2. Sharpness: are both speakers' faces acceptably clear for a 1080p web upload, given webcam origin?
3. Composition: are the speaker tiles balanced and correctly aligned on the canvas? Any black bars, frame bleed, divider slivers, stretched or squashed tiles, or dead space?
4. On-screen text: is the title card, logo and each name strap fully rendered, correctly spelled, unclipped and legible? Read them back verbatim so spelling can be checked.
5. Audio: is speech clear, intelligible and consistent in level? Any clipping, dropouts, hum or abrupt level jumps at cut points?
6. Edit quality: do segment transitions land on natural speech pauses, or are there mid-word chops, hard jumps, repeated content or audio/video desync?
Give a short verdict on the FIRST line - exactly one of SEND-QUALITY, NEEDS WORK, or REJECT - then bullet points. Be concrete about whether a problem originates in the source footage or in the processing.`;

// The gate defaults by asset shape, not by hope. Running the bare command on a
// landscape long-form asset used to apply the 9:16 Shorts rubric, which fails it
// for having no vertical crop and no burned-in captions - criteria a YouTube
// long-form asset can never meet. A meaningless "needs work" is worse than no
// gate at all, because it teaches everyone to wave the gate through.
const PROFILES = { shorts: SHORTS_PROMPT, longform: LONGFORM_PROMPT };
const profileArg = (val("--profile") || "").toLowerCase();
if (profileArg && !PROFILES[profileArg]) die(`unknown --profile "${profileArg}" (expected: shorts | longform)`);

async function fileSize(p) { return fs.statSync(p).size; }

/** Landscape -> longform, portrait -> shorts. Falls back to shorts (the historic
 *  default) if ffprobe is unavailable, so this can never harden into a blocker. */
function detectProfile(p) {
  try {
    const out = require("node:child_process").execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", p,
    ], { encoding: "utf8" }).trim();
    const [w, h] = out.split("x").map(Number);
    if (w && h) return w / h >= 1.2 ? "longform" : "shorts";
  } catch {}
  return "shorts";
}

async function uploadFile(p) {
  const size = await fileSize(p);
  const start = await fetch(`${BASE}/upload/v1beta/files?key=${KEY}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(size), "X-Goog-Upload-Header-Content-Type": "video/mp4",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: path.basename(p) } }),
  });
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) die(`Files API start failed ${start.status}: ${(await start.text()).slice(0, 200)}`);
  const up = await fetch(uploadUrl, {
    method: "POST",
    headers: { "X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0", "Content-Length": String(size) },
    body: fs.readFileSync(p),
  });
  let info = await up.json();
  if (!info.file) die(`upload failed: ${JSON.stringify(info).slice(0, 200)}`);
  // wait for ACTIVE
  let name = info.file.name, state = info.file.state;
  for (let i = 0; i < 30 && state !== "ACTIVE"; i++) {
    await sleep(2000);
    const g = await fetch(`${BASE}/v1beta/${name}?key=${KEY}`);
    info = await g.json(); state = info.state || (info.file && info.file.state);
    if (state === "FAILED") die("Gemini file processing FAILED");
  }
  return info.uri || (info.file && info.file.uri);
}

(async () => {
  const file = val("--file");
  if (!file) die("usage: --file <video.mp4>");
  if (!KEY) die("GEMINI_API_KEY missing in .env");
  // Pick the rubric from the asset's actual shape unless told otherwise, so the
  // bare command is correct by default rather than correct only if you remember
  // to pass a profile. Explicit --prompt still wins over everything.
  const profile = profileArg || detectProfile(file);
  const prompt = val("--prompt") || PROFILES[profile];
  if (!val("--prompt")) console.error(`(rubric: ${profile}${profileArg ? "" : " - auto-detected from frame size"})`);
  const size = await fileSize(file);

  let part;
  if (size < 18 * 1024 * 1024) {
    part = { inline_data: { mime_type: "video/mp4", data: fs.readFileSync(file).toString("base64") } };
  } else {
    console.error(`(${Math.round(size / 1048576)}MB - uploading via Files API…)`);
    const uri = await uploadFile(file);
    part = { file_data: { mime_type: "video/mp4", file_uri: uri } };
  }

  const r = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [part, { text: prompt }] }] }),
  });
  const j = await r.json();
  if (!r.ok) die(`Gemini ${r.status}: ${JSON.stringify(j).slice(0, 400)}`);
  const text = (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text).join("") || "";
  console.log(`\n──── GEMINI REVIEW (${MODEL}) ────\n`);
  console.log(text || JSON.stringify(j).slice(0, 500));
})().catch((e) => die(e.stack || e.message));
