/**
 * Flip `YT Condensed Status` = "Ready to Upload" for the given episodes so P06
 * picks them up and schedules them to YouTube. Skips audio-only eps (no Condensed
 * Video File ID) as a safety.
 *
 * Before flipping, runs patch-yt-chapters.cjs so the YouTube Desc doc carries the
 * condensed edit's chapters instead of full-episode timestamps (P06 uploads the doc
 * text verbatim). A failed patch blocks the flip — --no-patch to override.
 *
 * Usage: node scripts/podcast/set-yt-ready.cjs <ep> [ep ...] [--no-patch]
 */
const fs = require('fs');
const { spawnSync } = require('child_process');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const T = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${T}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const noPatch = process.argv.includes('--no-patch');
const eps = process.argv.slice(2).filter(a => a !== '--no-patch');
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');
if (!eps.length) { console.log('usage: set-yt-ready.cjs <ep> [ep ...] [--no-patch]'); process.exit(1); }

(async () => {
  let rows = [], c;
  do { const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(c ? { page_size: 100, start_cursor: c } : { page_size: 100 }) }); const j = await r.json(); rows = rows.concat(j.results || []); c = j.has_more ? j.next_cursor : null; } while (c);
  for (const ep of eps) {
    const row = rows.find(p => String(p.properties['Episode Number']?.number) === ep);
    if (!row) { console.log(ep, 'no row'); continue; }
    const p = row.properties;
    if (!txt(p['Condensed Video File ID'])) { console.log(ep, 'SKIP — no condensed video (audio-only)'); continue; }
    if (txt(p['Zernio YT Post ID'])) { console.log(ep, 'SKIP — already has Zernio YT Post ID'); continue; }
    if (!noPatch) {
      const pr = spawnSync(process.execPath, [`${__dirname}/patch-yt-chapters.cjs`, ep], { stdio: 'inherit' });
      if (pr.status !== 0) { console.log(ep, 'BLOCKED — chapter patch failed (see above). Fix chapters.txt or rerun with --no-patch to force.'); continue; }
    }
    const r = await fetch(`https://api.notion.com/v1/pages/${row.id}`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ properties: { 'YT Condensed Status': { select: { name: 'Ready to Upload' } } } }),
    });
    console.log(ep, r.ok ? 'set YT Condensed Status = Ready to Upload' : 'FAILED ' + r.status + ' ' + JSON.stringify(await r.json()).slice(0, 200));
  }
})().catch(e => console.log('ERR', e.message));
