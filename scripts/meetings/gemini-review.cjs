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
const MODEL = val("--model") || "gemini-2.5-flash";

const DEFAULT_PROMPT = `You are a critical video-quality reviewer for short-form social clips (9:16, for YouTube Shorts / Reels / TikTok).
Watch this clip and assess, specifically and honestly:
1. Compression / encoding: blockiness, macroblocking, banding, softness, upscaling artifacts. Does it look low-resolution or over-compressed?
2. Sharpness & resolution: is the speaker's face crisp or soft/blurry?
3. Framing: is the speaker well-positioned in 9:16? Any awkward cropping?
4. Captions: legible? well-timed to speech? well-placed?
5. Overall: is this postable as-is? If not, what is the SINGLE biggest quality problem and the concrete fix?
Give a short verdict (postable / needs work / reject) then bullet points. Be concrete about whether the problem is the source footage vs the processing.`;

async function fileSize(p) { return fs.statSync(p).size; }

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
  const prompt = val("--prompt") || DEFAULT_PROMPT;
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
