// Phase 0 collector — public storefront only. No auth, no writes.
import fs from 'node:fs/promises';

const BASE = 'https://syperformance.net';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const out = (n, d) => fs.writeFile(new URL(`../data/${n}`, import.meta.url), typeof d === 'string' ? d : JSON.stringify(d, null, 2));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(path, asText = false) {
  const url = path.startsWith('http') ? path : BASE + path;
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!r.ok) return { ok: false, status: r.status, url };
  return { ok: true, status: r.status, url: r.url, body: asText ? await r.text() : await r.json() };
}

// 1. sitemaps
const smRoot = await get('/sitemap.xml', true);
const sitemaps = { root: smRoot.ok ? smRoot.body : `ERR ${smRoot.status}`, children: {} };
if (smRoot.ok) {
  const kids = [...smRoot.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  for (const k of kids) {
    const c = await get(k, true);
    sitemaps.children[k] = c.ok ? c.body : `ERR ${c.status}`;
    await sleep(300);
  }
}
await out('sitemaps.json', sitemaps);
console.log('sitemap child files:', Object.keys(sitemaps.children).length);

// 2. products
const products = [];
for (let page = 1; page <= 40; page++) {
  const r = await get(`/products.json?limit=250&page=${page}`);
  if (!r.ok) { console.log('products stop', r.status); break; }
  const batch = r.body.products || [];
  products.push(...batch);
  console.log('page', page, '->', batch.length, 'total', products.length);
  if (batch.length < 250) break;
  await sleep(400);
}
await out('products.json', products);

// 3. collections
const collections = [];
for (let page = 1; page <= 20; page++) {
  const r = await get(`/collections.json?limit=250&page=${page}`);
  if (!r.ok) break;
  const batch = r.body.collections || [];
  collections.push(...batch);
  if (batch.length < 250) break;
  await sleep(400);
}
await out('collections.json', collections);
console.log('collections', collections.length);

// 4. homepage + one collection + one product HTML (for app/script detection + templates)
const home = await get('/', true);
await out('home.html', home.ok ? home.body : `ERR ${home.status}`);
const firstColl = collections[0]?.handle;
if (firstColl) { const c = await get(`/collections/${firstColl}`, true); await out('sample-collection.html', c.ok ? c.body : `ERR ${c.status}`); }
const firstProd = products[0]?.handle;
if (firstProd) { const p = await get(`/products/${firstProd}`, true); await out('sample-product.html', p.ok ? p.body : `ERR ${p.status}`); }
console.log('sample collection:', firstColl, '| sample product:', firstProd);
