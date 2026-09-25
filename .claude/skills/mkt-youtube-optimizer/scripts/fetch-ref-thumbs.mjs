#!/usr/bin/env node
// Refresh the thumbnail evidence base: download the most-viewed thumbnails from the
// reference channels into research/refs/ and build contact sheets for visual analysis.
// Edit REF_CHANNELS below as the reference set evolves.
// Usage: node fetch-ref-thumbs.mjs [maxPerChannel=4]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "research", "refs");
fs.mkdirSync(OUT, { recursive: true });

const REF_CHANNELS = [
  ["diaryofaceo", "@TheDiaryOfACEO"],
  ["aliabdaal", "@aliabdaal"],
  ["thefutur", "@thefutur"],
  ["johnnyharris", "@johnnyharris"],
  ["danmartell", "@danmartell"],
  ["ycombinator", "@ycombinator"],
  ["simonsquibb", "@SimonSquibb"],
  ["hormozi", "@AlexHormozi"],
];

let dir = HERE, envPath = null;
for (let i = 0; i < 8; i++) {
  const c = path.join(dir, ".env");
  if (fs.existsSync(c)) { envPath = c; break; }
  const p = path.dirname(dir);
  if (p === dir) break;
  dir = p;
}
const KEY = fs.readFileSync(envPath, "utf8").split(/\r?\n/).find((l) => l.startsWith("YOUTUBE_API_KEY=")).slice(16).trim();

const api = async (ep, params) => {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${ep}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY })) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${ep} ${r.status}`);
  return r.json();
};

const MAX = Number(process.argv[2] || 4);
for (const [slug, handle] of REF_CHANNELS) {
  try {
    const ch = await api("channels", { part: "id", forHandle: handle });
    const chId = ch.items?.[0]?.id;
    if (!chId) { console.log(slug, "not found"); continue; }
    const s = await api("search", { part: "id", channelId: chId, order: "viewCount", type: "video", maxResults: String(MAX) });
    for (const it of s.items || []) {
      const id = it.id.videoId;
      if (!id) continue;
      for (const q of ["maxresdefault", "hqdefault"]) {
        const r = await fetch(`https://img.youtube.com/vi/${id}/${q}.jpg`);
        if (r.ok && Number(r.headers.get("content-length") || 0) > 5000) {
          fs.writeFileSync(path.join(OUT, `${slug}-${id}.jpg`), Buffer.from(await r.arrayBuffer()));
          break;
        }
      }
    }
    console.log(slug, "done");
  } catch (e) { console.log(slug, "ERR", e.message.slice(0, 100)); }
}

// contact sheets via the python helper (PIL)
execFileSync("python", [path.join(HERE, "make_contact_sheets.py"), OUT], { stdio: "inherit" });
console.log("refs + contact sheets in", OUT);
