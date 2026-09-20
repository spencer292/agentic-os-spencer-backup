#!/usr/bin/env node
// Channel reality + competition for the scorecard.
// Usage:
//   node channel-context.mjs <videoId> ["target query"]
//   node channel-context.mjs @handle ["target query"]
// Prints: video stats (if id), channel baseline (subs, uploads, lifetime views,
// median of recent uploads), recent titles, and top results for the query.
// Reads YOUTUBE_API_KEY from the nearest .env up the tree; never prints it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let dir = path.dirname(fileURLToPath(import.meta.url));
let envPath = null;
for (let i = 0; i < 8; i++) {
  const c = path.join(dir, ".env");
  if (fs.existsSync(c)) { envPath = c; break; }
  const p = path.dirname(dir);
  if (p === dir) break;
  dir = p;
}
if (!envPath) { console.error("no .env found"); process.exit(1); }
const line = fs.readFileSync(envPath, "utf8").split(/\r?\n/).find((l) => l.startsWith("YOUTUBE_API_KEY="));
if (!line) { console.error("YOUTUBE_API_KEY not set — scorecard runs uncalibrated"); process.exit(2); }
const KEY = line.slice(16).trim().replace(/^["']|["']$/g, "");

const api = async (ep, params) => {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${ep}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY })) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${ep} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

const target = process.argv[2];
const query = process.argv[3] || null;
if (!target) { console.error("usage: channel-context.mjs <videoId|@handle> [\"query\"]"); process.exit(1); }

let chId = null;
if (target.startsWith("@")) {
  const ch = await api("channels", { part: "id", forHandle: target });
  chId = ch.items?.[0]?.id;
} else {
  const v = await api("videos", { part: "snippet,statistics,contentDetails,status", id: target });
  const vid = v.items?.[0];
  if (vid) {
    chId = vid.snippet.channelId;
    console.log("VIDEO:", vid.snippet.title);
    console.log("  duration:", vid.contentDetails.duration, "| privacy:", vid.status.privacyStatus,
      "| views:", vid.statistics.viewCount, "| likes:", vid.statistics.likeCount || 0,
      "| comments:", vid.statistics.commentCount || 0, "| published:", vid.snippet.publishedAt);
  } else {
    console.log("video not found — treating input as channel search");
  }
}
if (!chId) { console.error("channel not resolved"); process.exit(1); }

const ch = await api("channels", { part: "statistics,snippet", id: chId });
const c = ch.items[0];
console.log("CHANNEL:", c.snippet.title, "| subs:", c.statistics.subscriberCount,
  "| uploads:", c.statistics.videoCount, "| lifetime views:", c.statistics.viewCount);

const s = await api("search", { part: "snippet", channelId: chId, order: "date", type: "video", maxResults: "10" });
const ids = (s.items || []).map((i) => i.id.videoId).filter(Boolean);
const vs = await api("videos", { part: "statistics,snippet", id: ids.join(",") });
const views = (vs.items || []).map((i) => Number(i.statistics.viewCount || 0)).sort((a, b) => a - b);
const median = views.length ? views[Math.floor(views.length / 2)] : 0;
console.log("RECENT UPLOADS (median views:", median + "):");
for (const it of vs.items || [])
  console.log(" -", (it.statistics.viewCount + "").padStart(7), "|", it.snippet.publishedAt.slice(0, 10), "|", it.snippet.title.slice(0, 66));

if (query) {
  const comp = await api("search", { part: "snippet", q: query, type: "video", maxResults: "8", relevanceLanguage: "en" });
  const cids = (comp.items || []).map((i) => i.id.videoId).join(",");
  const stats = await api("videos", { part: "statistics,snippet", id: cids });
  console.log(`TOP RESULTS for "${query}":`);
  for (const it of stats.items || [])
    console.log(" -", (it.statistics.viewCount + "").padStart(9), "views |", it.snippet.publishedAt.slice(0, 10),
      "|", it.snippet.channelTitle.slice(0, 24), "|", it.snippet.title.slice(0, 56));
}
