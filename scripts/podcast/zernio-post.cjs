/**
 * Inspect Zernio post(s) to find where the published YouTube URL lives.
 * Read-only. Usage:
 *   node scripts/podcast/zernio-post.cjs            # list recent posts (status + any yt url)
 *   node scripts/podcast/zernio-post.cjs <postId>   # dump one post's url/status fields
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = env.ZERNIO_API_KEY || env.ZERNIO_BEARER || env.LATE_API_KEY;
const base = 'https://zernio.com/api/v1';
const H = { Authorization: `Bearer ${KEY}` };
const id = process.argv[2];

const urlKeys = obj => {
  const out = [];
  const walk = (o, path) => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      const p = path ? path + '.' + k : k;
      if (typeof v === 'string' && /(url|link|status|state|youtu|videoId|postId|publishedAt|_id)/i.test(k)) out.push(`${p} = ${v}`);
      else if (v && typeof v === 'object') walk(v, p);
    }
  };
  walk(obj, '');
  return out;
};

(async () => {
  if (id) {
    const r = await fetch(`${base}/posts/${id}`, { headers: H });
    const j = await r.json();
    if (!r.ok) { console.log('GET /posts/%s failed', id, r.status, JSON.stringify(j).slice(0, 200)); return; }
    const post = j.post || j.data || j;
    console.log('post', id, '\n  ' + urlKeys(post).join('\n  '));
    return;
  }
  const r = await fetch(`${base}/posts?limit=100`, { headers: H });
  const j = await r.json();
  if (!r.ok) { console.log('GET /posts failed', r.status, JSON.stringify(j).slice(0, 300)); return; }
  const posts = j.posts || j.data || j || [];
  const pub = (Array.isArray(posts) ? posts : []).filter(p => /publish|live|complete|posted|success/i.test(p.status || '') ||
    (p.platforms || []).some(x => /publish|live|complete|posted|success/i.test(x.status || '')));
  console.log(`${posts.length} posts fetched; ${pub.length} look published.\n`);
  for (const p of pub.slice(0, 5)) {
    console.log(`--- ${(p._id || p.id)}  status=${p.status}  "${(p.title || '').slice(0, 40)}"`);
    console.log('  ' + urlKeys(p).join('\n  '));
  }
  if (!pub.length) {
    console.log('No published posts found. Status values seen:',
      [...new Set((Array.isArray(posts) ? posts : []).map(p => p.status))].join(', '));
  }
})().catch(e => console.log('ERR', e.message));
