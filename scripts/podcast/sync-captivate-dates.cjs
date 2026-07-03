/**
 * Captivate -> Notion release-date sync.
 * Pulls the show's episodes from the Captivate API (creds live in n8n Variables,
 * reached with N8N_API_KEY) and writes each Captivate publish date onto the
 * matching Podcast Episodes row's "Release Date" (matched by Episode Number),
 * using the system's convention of 10:00 UK local (DST-aware).
 *
 * Captivate is the source of truth for dates once episodes are loaded there.
 * Default scope: only Captivate "Scheduled" episodes (the in-flight batch).
 *   --all   also reconcile Published episodes that have a Notion row
 *   --dry   preview only, write nothing
 * Run: node scripts/podcast/sync-captivate-dates.cjs [--dry] [--all]
 */
const fs = require('fs');

const ENVPATH = 'C:/Claude/agent-os-v3/agentic-os/.env';
const env = {};
for (const l of fs.readFileSync(ENVPATH, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NKEY = env.N8N_API_KEY || env.N8N_API_TOKEN;
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const N8N = 'https://allthepower.app.n8n.cloud/api/v1';
const SHOW = 'ee20a638-beff-42a1-b85e-96d4125b2e6c';
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

// ---- 10:00 UK local, DST-aware (same convention as assign-release-dates.cjs) ----
const LOCAL_TZ = 'Europe/London', LOCAL_HOUR = 10, LOCAL_MIN = 0;
function tzOffsetMinutes(date) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: LOCAL_TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = dtf.formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +(p.hour % 24), +p.minute, +p.second);
  return (asUTC - date.getTime()) / 60000;
}
function localWallToUTC(y, m0, d) {
  let utc = Date.UTC(y, m0, d, LOCAL_HOUR, LOCAL_MIN, 0);
  for (let i = 0; i < 2; i++) utc = Date.UTC(y, m0, d, LOCAL_HOUR, LOCAL_MIN, 0) - tzOffsetMinutes(new Date(utc)) * 60000;
  return new Date(utc).toISOString();
}

async function n8nVars() {
  let out = {}, cursor;
  do {
    const r = await fetch(`${N8N}/variables?limit=100${cursor ? `&cursor=${cursor}` : ''}`, { headers: { 'X-N8N-API-KEY': NKEY } });
    if (!r.ok) throw new Error('n8n variables ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json();
    for (const v of j.data || []) out[v.key] = v.value;
    cursor = j.nextCursor;
  } while (cursor);
  return out;
}

async function captivateEpisodes() {
  const v = await n8nVars();
  const uid = v.CAPTIVATE_USER_ID, tok = v.CAPTIVATE_API_TOKEN;
  if (!uid || !tok) throw new Error('Captivate creds not in n8n variables.');
  const auth = await fetch('https://api.captivate.fm/authenticate/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uid, token: tok }),
  });
  if (!auth.ok) throw new Error('Captivate auth ' + auth.status);
  const bearer = (await auth.json()).user?.token;
  const ep = await fetch(`https://api.captivate.fm/shows/${SHOW}/episodes`, { headers: { Authorization: `Bearer ${bearer}` } });
  if (!ep.ok) throw new Error('episodes ' + ep.status);
  const ej = await ep.json();
  const list = ej.episodes || ej.data || (Array.isArray(ej) ? ej : []);
  return list.map(e => ({
    num: Number(e.episode_number || e.episodes_number || 0),
    status: (e.status || '').toLowerCase(),
    date: (e.published_date || e.date || e.publish_date || '').slice(0, 10),
    title: e.title || '(untitled)',
  })).filter(e => e.num && e.date);
}

async function notionRows() {
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
    method: 'PATCH', headers: H, body: JSON.stringify({ properties: { 'Release Date': { date: { start: iso } } } }),
  });
  if (!r.ok) { console.log('   PATCH failed', r.status, (await r.text()).slice(0, 200)); return false; }
  return true;
}

(async () => {
  const eps = await captivateEpisodes();
  const rows = await notionRows();
  const byNum = new Map();
  for (const p of rows) { const n = p.properties['Episode Number']?.number; if (n != null) byNum.set(n, p); }

  const scope = eps.filter(e => ALL || e.status === 'scheduled').sort((a, b) => a.num - b.num);
  console.log(`Captivate: ${eps.length} eps | Notion rows: ${rows.length} | syncing ${scope.length} (${ALL ? 'all dated' : 'Scheduled only'})${DRY ? '  [DRY]' : ''}\n`);

  let changed = 0, same = 0, missing = 0;
  for (const e of scope) {
    const p = byNum.get(e.num);
    const [y, m, d] = e.date.split('-').map(Number);
    const target = localWallToUTC(y, m - 1, d);
    if (!p) { console.log(`Ep ${String(e.num).padEnd(3)} ⚠ no Notion row — Captivate ${e.date}`); missing++; continue; }
    const cur = p.properties['Release Date']?.date?.start || null;
    const curDay = cur ? cur.slice(0, 10) : '—';
    if (cur && cur.slice(0, 10) === e.date) { console.log(`Ep ${String(e.num).padEnd(3)} = ${curDay} (unchanged)`); same++; continue; }
    console.log(`Ep ${String(e.num).padEnd(3)} ${curDay} -> ${e.date}  ${e.title.slice(0, 42)}`);
    if (!DRY) { if (await setDate(p.id, target)) changed++; }
  }
  console.log(`\n${DRY ? '(dry run) would change' : 'changed'} ${changed}, unchanged ${same}, missing rows ${missing}.`);
})();
