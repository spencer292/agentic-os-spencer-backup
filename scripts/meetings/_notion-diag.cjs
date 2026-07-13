// Diagnose Notion token access WITHOUT printing the token. Read-only.
const fs = require('fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const DB = '1f5bf43f-7b08-4570-a15b-77717208d152';
const mask = (s) => s ? `${s.slice(0, 7)}…(${s.length} chars)` : '(missing)';

async function j(r) { try { return await r.json(); } catch { return {}; } }

(async () => {
  console.log('token:', mask(NOTION));
  // 1) identity
  for (const ver of ['2025-09-03', '2022-06-28']) {
    const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': ver, 'Content-Type': 'application/json' };
    const r = await fetch('https://api.notion.com/v1/users/me', { headers: H });
    const b = await j(r);
    console.log(`[me ${ver}]`, r.status, b.bot ? `bot=${b.name || b.bot?.owner?.type || '?'}` : (b.code || ''));
  }
  const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
  // 2) search what this integration can see
  const sr = await fetch('https://api.notion.com/v1/search', { method: 'POST', headers: H, body: JSON.stringify({ page_size: 25 }) });
  const sb = await j(sr);
  console.log('[search]', sr.status, 'results:', (sb.results || []).length);
  for (const x of (sb.results || [])) {
    const t = (x.properties?.Name?.title || x.properties?.title?.title || x.title || []).map(o => o.plain_text || '').join('') || x.id;
    console.log('   -', x.object, (x.object === 'data_source' ? x.id : ''), t.slice(0, 60));
  }
  // 3) direct DB fetch (v1 database endpoint) + data_source fetch
  const dbr = await fetch(`https://api.notion.com/v1/databases/${DB}`, { headers: { ...H, 'Notion-Version': '2022-06-28' } });
  console.log('[GET database 2022-06-28]', dbr.status, (await j(dbr)).code || 'ok');
  const dsr = await fetch(`https://api.notion.com/v1/data_sources/${DS}`, { headers: H });
  console.log('[GET data_source 2025-09-03]', dsr.status, (await j(dsr)).code || 'ok');
})().catch(e => { console.error('DIAG_ERROR', e.message); process.exit(1); });
