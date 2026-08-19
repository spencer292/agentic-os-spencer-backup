import fs from 'node:fs';
const URLS = {
  home: 'https://syperformance.net/',
  collection: 'https://syperformance.net/collections/syperformance',
  product: 'https://syperformance.net/products/k-series-single-lobe-billet-rockers'
};
const cats = ['performance','accessibility','best-practices','seo'].map(c=>'&category='+c).join('');
const out = {};
for (const [name, url] of Object.entries(URLS)) {
  for (const strategy of ['mobile','desktop']) {
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${cats}`;
    process.stdout.write(`${name}/${strategy} ... `);
    try {
      const r = await fetch(api);
      if (!r.ok) { console.log('HTTP', r.status); out[`${name}/${strategy}`] = {error: r.status}; continue; }
      const j = await r.json();
      const c = j.lighthouseResult.categories;
      const a = j.lighthouseResult.audits;
      const rec = {
        performance: Math.round(c.performance.score*100),
        accessibility: Math.round(c.accessibility.score*100),
        bestPractices: Math.round(c['best-practices'].score*100),
        seo: Math.round(c.seo.score*100),
        LCP: a['largest-contentful-paint'].displayValue,
        CLS: a['cumulative-layout-shift'].displayValue,
        TBT: a['total-blocking-time'].displayValue,
        FCP: a['first-contentful-paint'].displayValue,
        speedIndex: a['speed-index'].displayValue,
        transferKB: Math.round((a['total-byte-weight']?.numericValue||0)/1024)
      };
      out[`${name}/${strategy}`] = rec;
      console.log(JSON.stringify(rec));
    } catch (e) { console.log('ERR', e.message); out[`${name}/${strategy}`] = {error: String(e.message)}; }
  }
}
fs.writeFileSync(new URL('../data/lighthouse-baseline.json', import.meta.url), JSON.stringify(out, null, 2));
