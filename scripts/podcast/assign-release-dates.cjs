/**
 * Release-date slotter — assigns the next open weekly release slot to episodes
 * that are ready to be scheduled but have no Release Date yet.
 *
 * Gate (only genuinely-upcoming episodes, never the aired backlog):
 *   Episode Number > the highest already-scheduled episode  (the "frontier")
 *   AND Episode Status != Published  AND  Release Date empty.
 * The frontier rule is what stops it dating the whole historical backlog: only
 * episodes beyond the latest scheduled one are new enough to need a slot.
 * Slot logic: next cadence slot strictly AFTER max(latest assigned release, now).
 * Multiple eligible episodes (by Episode Number asc) take consecutive slots, so
 * the schedule builds a forward queue. Non-destructive: never touches a row that
 * already has a Release Date; never assigns a slot in the past.
 *
 * Cadence is CONFIG below — default Tue + Thu at 10:00 UK local time. UK local is
 * anchored to Europe/London, so the stored UTC is 09:00 in BST (summer) and 10:00
 * in GMT (winter) automatically. Change RELEASE_DOWS / LOCAL_HOUR if needed.
 * Run: node scripts/podcast/assign-release-dates.cjs [--dry]
 */
const fs = require('fs');

// ---- CADENCE CONFIG (change here if the show's schedule changes) ----
const RELEASE_DOWS = [2, 4];        // weekdays to release on. 0=Sun..6=Sat -> [2,4] = Tue + Thu
const LOCAL_TZ = 'Europe/London';   // release time is this local time, DST-aware
const LOCAL_HOUR = 10;              // 10:00 local
const LOCAL_MIN = 0;
// ---------------------------------------------------------------------

/** Minutes that `LOCAL_TZ` local time is ahead of UTC at the given instant. */
function tzOffsetMinutes(date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: LOCAL_TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = dtf.formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +(p.hour % 24), +p.minute, +p.second);
  return (asUTC - date.getTime()) / 60000;
}

/** The UTC instant for LOCAL_HOUR:LOCAL_MIN local time on calendar day (y, m0, d). */
function localWallToUTC(y, m0, d) {
  let utc = Date.UTC(y, m0, d, LOCAL_HOUR, LOCAL_MIN, 0);
  // resolve the offset twice (handles DST-boundary days)
  for (let i = 0; i < 2; i++) utc = Date.UTC(y, m0, d, LOCAL_HOUR, LOCAL_MIN, 0) - tzOffsetMinutes(new Date(utc)) * 60000;
  return new Date(utc);
}

const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const DRY = process.argv.includes('--dry');
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');
const isYes = p => p?.checkbox === true;

/** First cadence slot strictly after `after`: next day whose weekday is in RELEASE_DOWS, at LOCAL time. */
function nextSlot(after) {
  // start scanning from the day after `after` (in UTC calendar terms is fine; we re-anchor to local)
  let probe = new Date(after.getTime());
  for (let i = 0; i < 60; i++) {
    probe = new Date(probe.getTime() + 86400000);
    if (!RELEASE_DOWS.includes(probe.getUTCDay())) continue;
    const slot = localWallToUTC(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate());
    if (slot > after) return slot;
  }
  throw new Error('no slot found within 60 days');
}

async function queryAll() {
  let out = [], cursor;
  do {
    const body = { page_size: 100 }; if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const j = await r.json(); out = out.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

async function setDate(pageId, iso) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ properties: { 'Release Date': { date: { start: iso } } } }),
  });
  if (!r.ok) console.log('   PATCH failed', r.status, (await r.text()).slice(0, 200));
}

(async () => {
  const rows = await queryAll();
  const now = new Date(env.__NOW__ || Date.now());

  // frontier = highest episode number that already has a Release Date, and the
  // latest assigned release datetime. New episodes are numbered beyond the frontier.
  let latest = now, frontierEp = 0;
  for (const p of rows) {
    const rel = p.properties['Release Date']?.date?.start;
    const ep = p.properties['Episode Number']?.number;
    if (rel) {
      const d = new Date(rel); if (d > latest) latest = d;
      if (ep != null && ep > frontierEp) frontierEp = ep;
    }
  }
  console.log(`Frontier: latest scheduled = Ep${frontierEp} on ${latest.toISOString()}`);

  // eligible = beyond the frontier, not yet published, no date. Ordered by ep number asc.
  const eligible = rows.filter(p => {
    const ep = p.properties['Episode Number']?.number;
    const status = p.properties['Episode Status']?.select?.name || '';
    return ep != null && ep > frontierEp && status !== 'Published' &&
      !p.properties['Release Date']?.date?.start;
  }).sort((a, b) => (a.properties['Episode Number'].number) - (b.properties['Episode Number'].number));

  if (!eligible.length) { console.log('No upcoming episodes await a release date (beyond frontier, unpublished, no date).'); return; }

  let cursor = latest;
  for (const p of eligible) {
    const slot = nextSlot(cursor);
    cursor = slot;
    const ep = p.properties['Episode Number'].number;
    const name = `${txt(p.properties['Guest First Name'])} ${txt(p.properties['Guest Last Name'])}`.trim();
    const iso = slot.toISOString();
    console.log(`Ep${ep} ${name} -> ${iso}  (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.getUTCDay()]})`);
    if (!DRY) await setDate(p.id, iso);
  }
  console.log(DRY ? '\n(dry run — nothing written)' : `\nAssigned release dates to ${eligible.length} episode(s).`);
})();
