/**
 * Content-flywheel ledger lib — shared read/append/upsert for content-ledger.jsonl.
 *
 * The ledger is the bandit's memory: one row per (post x channel). The publishing machine
 * (cadence governor) APPENDS candidate metadata at publish time; the measure->learn cron
 * UPSERTS metrics + verdict by post_id. Schema is the contract — keep field names stable.
 *
 * Row: { post_id, date, channel, format, hook, topic, metrics{t1h,t24h,peak}, verdict, ...ext }
 */
const fs = require('fs');
const path = require('path');
const LEDGER_PATH = 'C:/Claude/agent-os-v3/agentic-os/projects/briefs/content-flywheel/content-ledger.jsonl';

// Target-Platforms option string -> canonical channel family (channel and format are separate dimensions).
const CHANNEL_MAP = {
  'TikTok': 'TikTok', 'Instagram Reels': 'Instagram', 'Facebook Reels': 'Facebook',
  'X/Twitter': 'X', 'YouTube Shorts': 'YouTube', 'YouTube Long': 'YouTube', 'LinkedIn': 'LinkedIn', 'Threads': 'Threads',
};
const canonicalChannel = p => CHANNEL_MAP[p] || p;

function readAll() {
  try { return fs.readFileSync(LEDGER_PATH, 'utf8').split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l)); }
  catch { return []; }
}

// Append rows, skipping any post_id already present (idempotent).
function append(rows) {
  try { fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true }); } catch {}
  const existing = new Set(readAll().map(r => r.post_id));
  const fresh = rows.filter(r => !existing.has(r.post_id));
  if (fresh.length) fs.appendFileSync(LEDGER_PATH, fresh.map(r => JSON.stringify(r)).join('\n') + '\n');
  return fresh.length;
}

// Merge a patch into the row with matching post_id (used by the measure->learn cron).
function upsert(post_id, patch) {
  const all = readAll();
  let found = false;
  for (const r of all) if (r.post_id === post_id) { Object.assign(r, patch); found = true; }
  if (found) fs.writeFileSync(LEDGER_PATH, all.map(r => JSON.stringify(r)).join('\n') + '\n');
  return found;
}

// Build candidate rows at publish time from clip metadata + the channels it was released to.
function buildRows(clip, targetPlatforms) {
  const { videoLibId, title, date, format, hook, topic, pillar, source } = clip;
  return targetPlatforms.map(p => {
    const channel = canonicalChannel(p);
    return {
      post_id: `${videoLibId}:${channel}`,
      date, channel,
      format: format || '', hook: hook || '', topic: topic || pillar || '',
      metrics: { t1h: null, t24h: null, peak: null },
      verdict: 'pending',
      source: source || 'autopilot', pillar: pillar || '', title: title || '', video_lib_id: videoLibId,
    };
  });
}

module.exports = { LEDGER_PATH, readAll, append, upsert, buildRows, canonicalChannel };
