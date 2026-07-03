/**
 * meeting-clips — turn a meeting's already-extracted marketing snippets into a
 * TIMESTAMPED clip plan for social shorts. Privacy-gated: only meetings whose
 * Notion row has "Clip for Social" ticked are ever processed.
 *
 * How it works (no extra LLM call): the Opus extraction already wrote
 * `marketing_snippets` onto each Notion row, each with a verbatim quote. Those exact
 * words live in the Zoom VTT transcript (which carries timecodes). We fetch the
 * timestamped VTT, locate each snippet's quote, and emit a clip window (start/end,
 * 16-60s) + caption. The plan is written back to the Notion row ("Clip Plan") and
 * saved as JSON, ready to cut/reframe/caption via the existing social pipeline.
 *
 * Run:
 *   node scripts/meetings/meeting-clips.cjs --init-notion              # add the 2 Notion fields (one-time)
 *   node scripts/meetings/meeting-clips.cjs --uuid "<zoomUuid>" [--dry]  # plan one meeting (bypasses gate)
 *   node scripts/meetings/meeting-clips.cjs --query "THRIVE review"      # find by topic, plan it
 *   node scripts/meetings/meeting-clips.cjs --sweep [--days 60]          # plan all gated, un-planned meetings
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
const ZACCT = env.ZOOM_ACCOUNT_ID, ZID = env.ZOOM_CLIENT_ID, ZSECRET = env.ZOOM_CLIENT_SECRET;
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DATA_SOURCE_ID = "be8400c3-cbbe-43f8-bfd9-32f18730b153";
const NOTION_DB_ID = "1f5bf43f-7b08-4570-a15b-77717208d152";
const NH = { Authorization: `Bearer ${NOTION}`, "Notion-Version": "2025-09-03", "Content-Type": "application/json" };

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
const DRY = flag("--dry");
const die = (m) => { console.error("\nFAILED:", m); process.exit(1); };
const ymd = (d) => d.toISOString().slice(0, 10);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ── Zoom ──────────────────────────────────────────────────────────────────────
async function zoomToken() {
  const basic = Buffer.from(`${ZID}:${ZSECRET}`).toString("base64");
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZACCT}`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  const j = await r.json();
  if (!r.ok) die(`Zoom token ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}
async function scanRecordings(token, months) {
  const now = new Date(); const seen = new Map();
  for (let i = 0; i < months; i++) {
    const to = new Date(now); to.setDate(to.getDate() - i * 30);
    const from = new Date(to); from.setDate(from.getDate() - 30);
    const r = await fetch(`https://api.zoom.us/v2/users/me/recordings?page_size=300&from=${ymd(from)}&to=${ymd(to)}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    for (const m of j.meetings || []) if (!seen.has(m.uuid)) seen.set(m.uuid, m);
  }
  return seen;
}
async function fetchVttCues(token, meeting) {
  const files = meeting.recording_files || [];
  const pick = files.find((f) => (f.file_type || "").toUpperCase() === "TRANSCRIPT")
    || files.find((f) => (f.recording_type || "") === "audio_transcript")
    || files.find((f) => (f.file_type || "").toUpperCase() === "CC");
  if (!pick || !pick.download_url) return null;
  let r = await fetch(pick.download_url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) r = await fetch(`${pick.download_url}?access_token=${token}`);
  if (!r.ok) die(`VTT download ${r.status}`);
  return parseVttCues(await r.text());
}
function parseVttCues(vtt) {
  const cues = [];
  for (const block of String(vtt).split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const m = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
    if (!m) continue;
    const toS = (h, mi, s, ms) => +h * 3600 + +mi * 60 + +s + +ms / 1000;
    const start = toS(m[1], m[2], m[3], m[4]);
    const end = toS(m[5], m[6], m[7], m[8]);
    const text = lines.filter((l) => l !== timeLine && l !== "WEBVTT" && !/^\d+$/.test(l)).join(" ");
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

// ── snippet -> timestamp matching ─────────────────────────────────────────────
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function buildIndex(cues) {
  let concat = ""; const offsets = [];
  for (const c of cues) { offsets.push({ char: concat.length, cue: c }); concat += norm(c.text) + " "; }
  return { concat, offsets };
}
function cueAt(offsets, idx) {
  let cur = offsets.length ? offsets[0].cue : null;
  for (const o of offsets) { if (o.char <= idx) cur = o.cue; else break; }
  return cur;
}
function locate(index, quote) {
  const nq = norm(quote);
  const words = nq.split(" ").filter(Boolean);
  if (words.length < 3) return null;
  for (const n of [10, 8, 6, 4]) {
    const probe = words.slice(0, Math.min(n, words.length)).join(" ");
    if (probe.length < 8) continue;
    const idx = index.concat.indexOf(probe);
    if (idx < 0) continue;
    const startCue = cueAt(index.offsets, idx);
    const tail = words.slice(-Math.min(5, words.length)).join(" ");
    let endIdx = index.concat.indexOf(tail, idx);
    const endCue = endIdx >= 0 ? cueAt(index.offsets, endIdx) : startCue;
    return { start: startCue.start, end: Math.max(endCue.end, startCue.end) };
  }
  return null;
}
function clipWindow(loc) {
  let start = Math.max(0, loc.start - 2);
  let end = loc.end + 2;
  let dur = end - start;
  if (dur < 16) end = start + 16;
  if (end - start > 60) end = start + 60;
  return { start: Math.round(start), end: Math.round(end), duration: Math.round(end - start) };
}

// ── Notion ────────────────────────────────────────────────────────────────────
const rtChunks = (s) => { const o = []; s = String(s || ""); for (let i = 0; i < s.length; i += 1900) o.push(s.slice(i, i + 1900)); return (o.length ? o : [""]).map((c) => ({ text: { content: c } })); };
async function notionRow(uuid) {
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: "POST", headers: NH, body: JSON.stringify({ filter: { property: "Source", rich_text: { contains: uuid } }, page_size: 1 }) });
  const j = await r.json();
  if (!r.ok) die(`Notion query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return (j.results || [])[0] || null;
}
function readSnippets(row) {
  const p = row.properties["Marketing Snippets"];
  const text = (p && p.rich_text ? p.rich_text.map((t) => t.plain_text).join("") : "");
  const out = [];
  for (let line of text.split(/\n/)) {
    line = line.replace(/^[•\-\s]+/, "").trim();
    if (!line) continue;
    const vm = line.match(/\|\s*"([^"]+)"\s*$/);
    const verbatim = vm ? vm[1] : null;
    const fm = line.match(/\[([^\]]+)\]/);
    const format = fm ? fm[1] : "short";
    const snippet = line.split(" [")[0].split(" | ")[0].trim();
    out.push({ snippet, format, verbatim });
  }
  return out;
}
async function initNotion() {
  const body = { properties: { "Clip for Social": { checkbox: {} }, "Clip Plan": { rich_text: {} }, "Clips Rendered": { checkbox: {} } } };
  for (const [ep, label] of [[`data_sources/${DATA_SOURCE_ID}`, "data_source"], [`databases/${NOTION_DB_ID}`, "database"]]) {
    const r = await fetch(`https://api.notion.com/v1/${ep}`, { method: "PATCH", headers: NH, body: JSON.stringify(body) });
    if (r.ok) { console.log(`Notion fields ensured via ${label}: "Clip for Social" (checkbox), "Clip Plan" (text).`); return; }
    console.log(`   (${label} patch ${r.status}: ${JSON.stringify(await r.json()).slice(0, 140)})`);
  }
  die("Could not add Notion clip fields.");
}
async function writePlan(pageId, planText) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: "PATCH", headers: NH, body: JSON.stringify({ properties: { "Clip Plan": { rich_text: rtChunks(planText) } } }) });
  if (!r.ok) die(`Notion write ${r.status}: ${JSON.stringify(await r.json()).slice(0, 200)}`);
}

// ── plan one meeting ──────────────────────────────────────────────────────────
async function planOne(token, meeting, row) {
  const date = (meeting.start_time || "").slice(0, 10);
  console.log(`\nMeeting: "${meeting.topic}"  ${date}`);
  const snippets = readSnippets(row);
  const withQuote = snippets.filter((s) => s.verbatim && s.verbatim.length > 12);
  console.log(`  marketing snippets: ${snippets.length} (${withQuote.length} with a quote we can time)`);
  if (!withQuote.length) { console.log("  (no quotable snippets — nothing to clip)"); return { clips: [] }; }

  const cues = await fetchVttCues(token, meeting);
  if (!cues || !cues.length) die("no timestamped VTT on this recording");
  const index = buildIndex(cues);

  const clips = [];
  for (const s of withQuote) {
    const loc = locate(index, s.verbatim);
    if (!loc) { console.log(`  - unmatched: "${s.verbatim.slice(0, 50)}..."`); continue; }
    const w = clipWindow(loc);
    clips.push({ ...w, format: s.format, caption: s.snippet, quote: s.verbatim });
  }
  // prefer clip-shaped formats, then by start time
  const rank = (f) => (/short|reel|clip|tiktok|video/i.test(f) ? 0 : 1);
  clips.sort((a, b) => rank(a.format) - rank(b.format) || a.start - b.start);
  clips.forEach((c, i) => (c.rank = i + 1));

  console.log(`  located ${clips.length} clip(s):`);
  for (const c of clips) console.log(`    #${c.rank} ${mmss(c.start)}-${mmss(c.end)} (${c.duration}s) [${c.format}]  ${c.caption.slice(0, 60)}`);

  const planText = clips.map((c) => `${c.rank}. [${mmss(c.start)}-${mmss(c.end)}] ${c.duration}s (${c.format}): ${c.caption} — "${c.quote}"`).join("\n");

  // save JSON
  const outDir = path.join(ROOT, "projects/briefs/zoom-meeting-intelligence/clips");
  fs.mkdirSync(outDir, { recursive: true });
  const slug = (meeting.topic || "meeting").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const jsonPath = path.join(outDir, `${date}_${slug}.clips.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ uuid: meeting.uuid, title: meeting.topic, date, sourceUrl: `https://drive.google.com`, clips }, null, 2));
  console.log(`  plan saved: ${jsonPath}`);

  if (!DRY && row) { await writePlan(row.id, planText); console.log(`  Notion "Clip Plan" written: ${row.url}`); }
  else if (DRY) console.log("  [DRY] Notion write skipped");
  return { clips };
}

// ── sweep gated meetings ──────────────────────────────────────────────────────
async function sweep(token, days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const filter = { and: [
    { property: "Clip for Social", checkbox: { equals: true } },
    { property: "Clip Plan", rich_text: { is_empty: true } },
    { property: "Date", date: { on_or_after: cutoff } },
  ] };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`, { method: "POST", headers: NH, body: JSON.stringify({ filter, page_size: 50 }) });
  const j = await r.json();
  if (!r.ok) die(`Notion sweep ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const rows = (j.results || []).map((p) => ({ row: p, uuid: ((p.properties["Source"] && p.properties["Source"].rich_text) || []).map((t) => t.plain_text).join("").trim() })).filter((x) => x.uuid);
  console.log(`Sweep: ${rows.length} gated, un-planned meeting(s) since ${cutoff}.`);
  if (!rows.length) return;
  const seen = await scanRecordings(token, Math.ceil(days / 30) + 1);
  for (const { row, uuid } of rows) {
    const meeting = seen.get(uuid);
    if (!meeting) { console.log(`\n• ${row.url} — recording not in Zoom window — skip`); continue; }
    try { await planOne(token, meeting, row); } catch (e) { console.log(`  ! ${e.message}`); }
  }
}

(async () => {
  if (flag("--init-notion")) return initNotion();
  if (!ZACCT || !ZID || !ZSECRET) die("Zoom creds missing in .env");
  const token = await zoomToken();
  const months = Number(val("--months")) || 3;

  if (flag("--sweep")) return sweep(token, Number(val("--days")) || 60);

  const uuid = val("--uuid");
  let meeting;
  if (uuid) { const seen = await scanRecordings(token, months); meeting = seen.get(uuid); if (!meeting) die(`uuid not found in ${months}mo window`); }
  else if (val("--query")) {
    const terms = val("--query").toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const seen = await scanRecordings(token, months);
    meeting = [...seen.values()].map((m) => ({ m, h: terms.filter((t) => (m.topic || "").toLowerCase().includes(t)).length })).filter((x) => x.h).sort((a, b) => b.h - a.h)[0]?.m;
    if (!meeting) die(`no match for "${val("--query")}"`);
  } else die('pass --uuid, --query, --sweep, or --init-notion.');

  const row = await notionRow(meeting.uuid);
  if (!row) die("no Notion row for this meeting (run the extractor first).");
  await planOne(token, meeting, row);
})().catch((e) => die(e.stack || e.message));
