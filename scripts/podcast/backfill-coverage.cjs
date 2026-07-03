/**
 * Backfill coverage: cross-reference the full Captivate episode list (master) against
 * the Power Movers recordings that still have VIDEO in Zoom. Tells us which episodes
 * we can recover video for now, and which are MISSING (need the Windows folder / other).
 * Read-only. Run: node scripts/podcast/backfill-coverage.cjs
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const N8N = 'https://allthepower.app.n8n.cloud/api/v1';
const NKEY = env.N8N_API_KEY;
const SHOW = 'ee20a638-beff-42a1-b85e-96d4125b2e6c';
const day = d => d.toISOString().slice(0, 10);
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const lastName = s => norm((s || '').trim().split(/\s+/).pop());

async function captivate() {
  let v = {}, cursor;
  do {
    const r = await fetch(`${N8N}/variables?limit=100${cursor ? `&cursor=${cursor}` : ''}`, { headers: { 'X-N8N-API-KEY': NKEY } });
    const j = await r.json(); for (const x of j.data || []) v[x.key] = x.value; cursor = j.nextCursor;
  } while (cursor);
  const auth = await fetch('https://api.captivate.fm/authenticate/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: v.CAPTIVATE_USER_ID, token: v.CAPTIVATE_API_TOKEN }) });
  const bearer = (await auth.json()).user.token;
  const ep = await fetch(`https://api.captivate.fm/shows/${SHOW}/episodes`, { headers: { Authorization: `Bearer ${bearer}` } });
  const ej = await ep.json();
  const list = ej.episodes || ej.data || [];
  return list.map(e => ({ num: Number(e.episode_number || 0), title: e.title || '', status: e.status || '' })).filter(e => e.num);
}

async function zoomToken() {
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`, { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
  return (await r.json()).access_token;
}
async function zoom() {
  const t = await zoomToken(); const seen = new Map(); let to = new Date();
  for (let i = 0; i < 17; i++) {
    const from = new Date(to.getTime() - 29 * 86400000); let pt = '';
    do {
      const r = await fetch(`https://api.zoom.us/v2/users/roy@prosyn.net/recordings?from=${day(from)}&to=${day(to)}&page_size=300${pt ? `&next_page_token=${pt}` : ''}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json(); if (j.code) break;
      for (const m of j.meetings || []) {
        if (!/power mo/i.test(m.topic || '')) continue;
        const types = (m.recording_files || []).map(f => f.recording_type);
        const name = (m.topic || '').replace(/power\s*mo\w*/ig, ' ').replace(/podcast/ig, ' ').replace(/pre-?interview|between roy castleman and/ig, ' ').replace(/[:\-–]/g, ' ').replace(/\s+/g, ' ').trim();
        seen.set(m.uuid, { name, video: types.includes('gallery_view') || types.includes('shared_screen_with_gallery_view'), date: (m.start_time || '').slice(0, 10) });
      }
      pt = j.next_page_token || '';
    } while (pt);
    to = new Date(from.getTime() - 86400000);
  }
  return [...seen.values()];
}

function capName(title) {
  const b = (title.split(':')[0] || '').trim();
  const w = b.split(/\s+/);
  if (w.length <= 4 && /^[A-Z]/.test(b) && !/^(From|The|Why|How|What|When|A|An)\b/i.test(b)) return b;
  return null;
}

const deburr = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
// Match a Zoom recording's guest name against the FULL Captivate title.
function matchIn(title, pool) {
  const words = new Set((deburr(title).toLowerCase().match(/[a-z]+/g) || []));
  return pool.find(z => {
    const w = (deburr(z.name).toLowerCase().match(/[a-z]+/g) || []).filter(x => x.length > 2 && !['the','and','dr'].includes(x));
    if (!w.length) return false;
    const last = w[w.length - 1], first = w[0];
    return words.has(last) && (w.length === 1 || words.has(first));
  });
}

(async () => {
  const [eps, zrecs] = await Promise.all([captivate(), zoom()]);
  const zVideo = zrecs.filter(z => z.video);
  const zAudio = zrecs.filter(z => !z.video);
  const have = [], missing = [], audioOnly = [];
  for (const e of eps.sort((a, b) => a.num - b.num)) {
    if (matchIn(e.title, zVideo)) have.push(e);
    else if (matchIn(e.title, zAudio)) audioOnly.push(e);
    else missing.push(e);
  }
  const line = e => `- #${String(e.num).padEnd(3)} ${e.title.slice(0, 70)}`;
  const md = [
    `# Backfill coverage — Captivate vs Zoom video (${new Date().toISOString().slice(0,10)})`,
    `\nCaptivate episodes: ${eps.length} · Zoom video recordings: ${zVideo.length} (archive starts ~2025-06-12).`,
    `Note: oldest episodes have descriptive Captivate titles with no guest surname, so a few "missing" rows may actually be in Zoom under the guest's name — confirm against the Windows folder.`,
    `\n## Accepted decisions (Roy, 2026-06-20)`,
    `- #78 Christian Komor — audio-only by design; NOT a gap, never will be.`,
    `- Pre-2025-06-12 early episodes — optional / low priority (Roy has the video elsewhere). Backfill later only if wanted, not now.`,
    `\n## ✅ Have video in Zoom (${have.length})`, ...have.map(line),
    `\n## ❌ Missing — need Windows folder / other source (${missing.length})`, ...missing.map(line),
    `\n## 🔊 Audio-only in Zoom — no video to clip (${audioOnly.length})`, ...audioOnly.map(line),
  ].join('\n');
  fs.writeFileSync('C:/Claude/agent-os-v3/agentic-os/projects/briefs/podcast-system-rebuild/guest-media-pack/backfill-coverage.md', md);
  console.log(`Captivate: ${eps.length} | Zoom video: ${zVideo.length} | HAVE ${have.length} | MISSING ${missing.length} | audio-only ${audioOnly.length}`);
  console.log('Full list -> guest-media-pack/backfill-coverage.md');
})().catch(e => console.log('Error:', e.message));
