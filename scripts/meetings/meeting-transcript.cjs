/**
 * meeting-transcript - dump a meeting's Zoom VTT as a [mm:ss] timestamped transcript,
 * the input for the edge-first clip SELECT in the Meeting Clips Lane.
 * Run: node scripts/meetings/meeting-transcript.cjs --uuid "<zoomUuid>" --out <file.txt>
 */
const fs = require("fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try { for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const die = (m) => { console.error("FAILED:", m); process.exit(1); };
const ymd = (d) => d.toISOString().slice(0, 10);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
async function token() {
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  return (await r.json()).access_token;
}
(async () => {
  const uuid = val("--uuid"); const out = val("--out");
  if (!uuid || !out) die('usage: --uuid "<uuid>" --out <file>');
  const t = await token();
  const now = new Date(); let meeting;
  for (let i = 0; i < 4 && !meeting; i++) {
    const to = new Date(now); to.setDate(to.getDate() - i * 30);
    const from = new Date(to); from.setDate(from.getDate() - 30);
    const r = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=300&from=${ymd(from)}&to=${ymd(to)}`, { headers: { Authorization: `Bearer ${t}` } });
    meeting = ((await r.json()).meetings || []).find((m) => m.uuid === uuid);
  }
  if (!meeting) die("uuid not found in Zoom window");
  const f = (meeting.recording_files || []).find((x) => (x.file_type || "").toUpperCase() === "TRANSCRIPT" || x.recording_type === "audio_transcript");
  if (!f) die("no VTT transcript on this recording");
  let r = await fetch(f.download_url, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) r = await fetch(`${f.download_url}?access_token=${t}`);
  const lines = [];
  for (const b of String(await r.text()).split(/\r?\n\r?\n/)) {
    const ls = b.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const tl = ls.find((l) => l.includes("-->")); if (!tl) continue;
    const m = tl.match(/(\d{2}):(\d{2}):(\d{2})/); if (!m) continue;
    const s = +m[1] * 3600 + +m[2] * 60 + +m[3];
    const text = ls.filter((l) => l !== tl && l !== "WEBVTT" && !/^\d+$/.test(l)).join(" ");
    if (text) lines.push(`[${mmss(s)}] (${Math.round(s)}s) ${text}`);
  }
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`wrote ${lines.length} cues -> ${out}`);
})().catch((e) => die(e.stack || e.message));
