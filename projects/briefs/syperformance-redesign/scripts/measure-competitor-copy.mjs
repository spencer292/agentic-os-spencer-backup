// How many words do the competitors actually put on a product page?
//
// competitors.md carried three hand-read samples: SpeedFactory's best own-brand page
// at 208 words and a resold page at 25. Spencer asked for the real distribution before
// the 198 descriptions get written, because "300-500 words" is only a good target if
// it is measured against what the market actually ships.
//
// SpeedFactory and JackSpania are Shopify, so /products.json returns every product's
// body_html and the whole catalogue can be counted instead of sampled. Ichiban is not
// Shopify (404 on the feed) and is sampled from product URLs instead.
//
//   node scripts/measure-competitor-copy.mjs
//   node scripts/measure-competitor-copy.mjs --json    # writes data/competitor-copy.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; catalogue-copy-length-research)' };

const words = (html) => {
  const text = String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
  return (text.match(/[A-Za-z0-9][A-Za-z0-9'’\-\/\.]*/g) || []).length;
};

async function shopifyCatalogue(base, label) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${base}/products.json?limit=250&page=${page}`;
    const ctl = AbortSignal.timeout(20000);
    let res;
    try { res = await fetch(url, { headers: UA, signal: ctl }); }
    catch (e) { console.error(`  ${label} page ${page}: ${e.message}`); break; }
    if (!res.ok) { console.error(`  ${label} page ${page}: HTTP ${res.status}`); break; }
    const { products } = await res.json();
    if (!products?.length) break;
    for (const p of products) {
      out.push({ handle: p.handle, title: p.title, vendor: p.vendor, words: words(p.body_html) });
    }
    if (products.length < 250) break;
  }
  return out;
}

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

function report(label, rows, ownBrandTest) {
  const w = rows.map(r => r.words);
  const median = pct(w, 50);
  console.log(`\n=== ${label} — ${rows.length} products`);
  console.log(`    median ${median} words   mean ${Math.round(w.reduce((a, b) => a + b, 0) / w.length)}   p90 ${pct(w, 90)}   max ${Math.max(...w)}`);
  const buckets = [[0, 0], [1, 25], [26, 50], [51, 100], [101, 200], [201, 300], [301, 500], [501, 1e9]];
  for (const [lo, hi] of buckets) {
    const n = w.filter(x => x >= lo && x <= hi).length;
    if (!n) continue;
    const bar = '#'.repeat(Math.max(1, Math.round((n / rows.length) * 50)));
    const name = lo === 0 && hi === 0 ? 'no copy at all' : hi > 1e8 ? '501+' : `${lo}-${hi}`;
    console.log(`      ${name.padEnd(15)} ${String(n).padStart(4)}  ${String(Math.round((n / rows.length) * 100)).padStart(3)}%  ${bar}`);
  }
  if (ownBrandTest) {
    const own = rows.filter(ownBrandTest), resold = rows.filter(r => !ownBrandTest(r));
    if (own.length && resold.length) {
      console.log(`    own brand (${own.length}):  median ${pct(own.map(r => r.words), 50)}   best ${Math.max(...own.map(r => r.words))}`);
      console.log(`    resold    (${resold.length}):  median ${pct(resold.map(r => r.words), 50)}`);
    }
  }
  const top = [...rows].sort((a, b) => b.words - a.words).slice(0, 5);
  console.log('    longest pages:');
  for (const t of top) console.log(`      ${String(t.words).padStart(5)}  ${t.vendor || '-'} | ${t.title.slice(0, 62)}`);
}

const sf = await shopifyCatalogue('https://www.speedfactoryracing.net', 'SpeedFactory');
report('SpeedFactory Racing', sf, r => /speedfactory/i.test(r.vendor || ''));

const js = await shopifyCatalogue('https://jackspaniaracing.shop', 'JackSpania');
report('JackSpania Racing', js, r => /jack ?spania/i.test(r.vendor || ''));

if (process.argv.includes('--json')) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data', 'competitor-copy.json'),
    JSON.stringify({ measuredAt: new Date().toISOString(), speedfactory: sf, jackspania: js }, null, 1));
  console.log('\nwrote data/competitor-copy.json');
}
