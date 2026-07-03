/**
 * Enumerate ALL Power Movers podcast recordings in Zoom cloud, paging back
 * month-by-month (Zoom caps each /recordings request to a 1-month range).
 * Read-only. Run: node scripts/podcast/zoom-podcast-archive.cjs [months]   (default 15)
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const USER = 'roy@prosyn.net';
const MONTHS = Number(process.argv[2] || 15);
const RX = /power mo/i; // "Power Movers" / "Power Moves"

async function token() {
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`, { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
  const j = await r.json(); if (!j.access_token) throw new Error('token: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}
const day = d => d.toISOString().slice(0, 10);

(async () => {
  const t = await token();
  const seen = new Map();
  let to = new Date();
  for (let i = 0; i < Math.ceil(MONTHS * 30 / 29) + 1; i++) {
    const from = new Date(to.getTime() - 29 * 86400000);
    let pageToken = '';
    do {
      const url = `https://api.zoom.us/v2/users/${USER}/recordings?from=${day(from)}&to=${day(to)}&page_size=300${pageToken ? `&next_page_token=${pageToken}` : ''}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.code) { console.log('Zoom error', j.code, j.message); return; }
      for (const m of (j.meetings || [])) {
        if (!RX.test(m.topic || '')) continue;
        const types = (m.recording_files || []).map(f => f.recording_type);
        seen.set(m.uuid, {
          date: (m.start_time || '').slice(0, 10),
          topic: m.topic,
          min: m.duration,
          video: types.includes('gallery_view') || types.includes('shared_screen_with_gallery_view'),
        });
      }
      pageToken = j.next_page_token || '';
    } while (pageToken);
    to = new Date(from.getTime() - 86400000);
  }
  const list = [...seen.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  console.log(`Found ${list.length} podcast recordings in Zoom (back to ${list.at(-1)?.date || '—'}):\n`);
  for (const e of list) console.log(`${e.date}  ${e.video ? 'VIDEO' : 'audio '}  ${String(e.min).padStart(3)}m  ${e.topic}`);
  console.log(`\n${list.filter(e => e.video).length} have gallery video.`);
})().catch(e => console.log('Error:', e.message));
