/**
 * eleven-words - word-level transcription via ElevenLabs Scribe (scribe_v1), output
 * in the {"words":[{start,end,word}]} format captions_from_words.py expects.
 * Drop-in replacement for groq-words.cjs; preferred because ElevenLabs is the
 * speech model this account pays for and Scribe word-timing is high-accuracy.
 *
 * Run: node scripts/meetings/eleven-words.cjs --file <audio-or-video> --out <words.json>
 */
const fs = require("fs");
const path = require("node:path");
const os = require("os");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const KEY = env.ELEVENLABS_API_KEY || env.ELEVEN_API_KEY;
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const die = (m) => { console.error("FAILED:", m); process.exit(1); };

(async () => {
  const file = val("--file"); const out = val("--out");
  if (!file || !out) die("usage: --file <media> --out <words.json>");
  if (!KEY) die("ELEVENLABS_API_KEY missing in .env");

  let audio = file;
  if (/\.(mp4|mov|mkv|webm)$/i.test(file)) {
    audio = path.join(os.tmpdir(), `ew-${Date.now().toString(36)}.mp3`);
    execFileSync("ffmpeg", ["-nostdin", "-y", "-i", file, "-vn", "-acodec", "libmp3lame", "-q:a", "4", audio], { stdio: "ignore" });
  }
  const buf = fs.readFileSync(audio);
  const fd = new FormData();
  fd.append("file", new Blob([buf]), "audio.mp3");
  fd.append("model_id", "scribe_v1");
  fd.append("timestamps_granularity", "word");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": KEY }, body: fd });
  const t = await r.text();
  if (!r.ok) die(`ElevenLabs ${r.status}: ${t.slice(0, 300)}`);
  const j = JSON.parse(t);
  const words = (j.words || []).filter((w) => w.type === "word" || !w.type).map((w) => ({ start: w.start, end: w.end, word: w.text }));
  if (!words.length) die("no word timestamps returned");
  fs.writeFileSync(out, JSON.stringify({ words, text: j.text || "" }, null, 2));
  if (audio !== file) fs.unlink(audio, () => {});
  console.log(`words: ${words.length} (ElevenLabs Scribe) -> ${out}`);
})().catch((e) => die(e.stack || e.message));
