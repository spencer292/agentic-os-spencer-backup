/**
 * Read-only: confirm the Zernio YouTube account + list its playlists (to get the
 * Power Movers Podcast playlist ID for P06). Run: node scripts/podcast/zernio-youtube-check.cjs
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = env.ZERNIO_API_KEY || env.ZERNIO_BEARER || env.LATE_API_KEY;
if (!KEY) { console.log('No ZERNIO_API_KEY in .env — cannot call Zernio directly. Keys present:', Object.keys(env).filter(k=>/ZERNIO|LATE/i.test(k)).join(',') || '(none)'); process.exit(0); }
const base = 'https://zernio.com/api/v1';
const H = { Authorization: `Bearer ${KEY}` };
const YT = '69f2ea5c985e734bf3dcfa2f';
(async () => {
  const a = await fetch(`${base}/accounts`, { headers: H });
  const aj = await a.json();
  if (!a.ok) { console.log('accounts failed', a.status, JSON.stringify(aj).slice(0, 300)); return; }
  const accts = aj.accounts || aj.data || aj || [];
  const yts = (Array.isArray(accts) ? accts : []).filter(x => (x.platform || '').toLowerCase() === 'youtube');
  console.log('YouTube accounts:'); for (const x of yts) console.log(`  ${x._id || x.id}  @${x.username || x.handle || x.name || '?'}`);
  const r = await fetch(`${base}/accounts/${YT}/youtube-playlists`, { headers: H });
  const j = await r.json();
  if (!r.ok) { console.log('playlists failed', r.status, JSON.stringify(j).slice(0, 300)); return; }
  const pls = j.playlists || j.data || j || [];
  console.log('\nPlaylists on @allthepowerltd:');
  for (const p of (Array.isArray(pls) ? pls : [])) console.log(`  ${p.id || p.playlistId}  "${p.title || p.name}"  (${p.itemCount ?? p.count ?? '?'} items)`);
})().catch(e => console.log('Error:', e.message));
