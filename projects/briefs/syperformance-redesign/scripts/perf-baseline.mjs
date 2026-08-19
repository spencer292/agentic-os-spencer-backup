// Phase 0 performance baseline without installing anything.
// Drives the installed Chrome over CDP (Node 24 has a global WebSocket).
// Mobile run mirrors Lighthouse's throttling: 4x CPU slowdown, ~1.6 Mbps / 150ms RTT.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const URLS = {
  home: 'https://syperformance.net/',
  collection: 'https://syperformance.net/collections/syperformance',
  product: 'https://syperformance.net/products/k-series-single-lobe-billet-rockers'
};
const PROFILES = {
  mobile: { w: 412, h: 823, dpr: 2.625, mobile: true, cpu: 4, down: 1.6 * 1024 * 1024 / 8, up: 750 * 1024 / 8, rtt: 150 },
  desktop: { w: 1350, h: 940, dpr: 1, mobile: false, cpu: 1, down: 10 * 1024 * 1024 / 8, up: 10 * 1024 * 1024 / 8, rtt: 40 }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const userDataDir = path.join(os.tmpdir(), 'syp-perf-profile');

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions',
  '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });

async function waitForChrome() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch {}
    await sleep(500);
  }
  throw new Error('Chrome did not start');
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = [];
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m); this.pending.delete(m.id); }
      else if (m.method) this.events.push(m);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

const OBSERVER = `
  window.__m = { lcp: 0, cls: 0, fcp: 0, longTasks: 0, longTaskTime: 0 };
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; })
    .observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; })
    .observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; })
    .observe({ type: 'paint', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__m.longTasks++; window.__m.longTaskTime += Math.max(0, e.duration - 50); } })
    .observe({ type: 'longtask', buffered: true });
`;

async function measure(url, profile) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  const c = new CDP(ws);
  const p = PROFILES[profile];

  await c.send('Network.enable');
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Network.clearBrowserCache');
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  await c.send('Emulation.setDeviceMetricsOverride', { width: p.w, height: p.h, deviceScaleFactor: p.dpr, mobile: p.mobile });
  await c.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  await c.send('Network.emulateNetworkConditions', { offline: false, latency: p.rtt, downloadThroughput: p.down, uploadThroughput: p.up });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVER });

  const start = Date.now();
  await c.send('Page.navigate', { url });
  // wait for load event, cap at 45s
  let loaded = false;
  for (let i = 0; i < 90 && !loaded; i++) {
    await sleep(500);
    loaded = c.events.some(e => e.method === 'Page.loadEventFired');
  }
  await sleep(3000); // let lazy work + LCP settle

  const req = c.events.filter(e => e.method === 'Network.responseReceived');
  const fin = c.events.filter(e => e.method === 'Network.loadingFinished');
  const bytes = fin.reduce((a, e) => a + (e.params.encodedDataLength || 0), 0);
  const byType = {};
  for (const e of req) {
    const ty = e.params.type || 'Other';
    const id = e.params.requestId;
    const f = fin.find(x => x.params.requestId === id);
    byType[ty] = byType[ty] || { n: 0, kb: 0 };
    byType[ty].n++;
    byType[ty].kb += Math.round((f?.params.encodedDataLength || 0) / 1024);
  }

  const m = await c.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      return Object.assign({}, window.__m, {
        ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,
        domNodes: document.getElementsByTagName('*').length,
        images: document.images.length,
        imagesNoAlt: [...document.images].filter(i => !i.alt || !i.alt.trim()).length,
        lazyImages: [...document.images].filter(i => i.loading === 'lazy').length,
        scripts: document.scripts.length,
        stylesheets: document.querySelectorAll('link[rel=stylesheet]').length,
        title: document.title,
        metaDesc: (document.querySelector('meta[name=description]') || {}).content || '',
        canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
        jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { const j = JSON.parse(s.textContent); return Array.isArray(j) ? j.map(x=>x['@type']).join(',') : (j['@type'] || (j['@graph']||[]).map(x=>x['@type']).join(',')); } catch { return 'unparseable'; } }),
        h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()).slice(0,3)
      });
    })()`
  });
  const r = m.result.value;
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);

  return {
    url, profile,
    wallClockMs: Date.now() - start,
    ttfbMs: Math.round(r.ttfb), fcpMs: Math.round(r.fcp), lcpMs: Math.round(r.lcp),
    cls: Number(r.cls.toFixed(3)),
    domContentLoadedMs: Math.round(r.dcl), loadMs: Math.round(r.load),
    longTasks: r.longTasks, blockingTimeMs: Math.round(r.longTaskTime),
    requests: req.length, transferKB: Math.round(bytes / 1024), byType,
    domNodes: r.domNodes, images: r.images, imagesMissingAlt: r.imagesNoAlt, lazyImages: r.lazyImages,
    scripts: r.scripts, stylesheets: r.stylesheets,
    title: r.title, titleLen: r.title.length,
    metaDescription: r.metaDesc, metaDescLen: r.metaDesc.length,
    canonical: r.canonical, jsonLdTypes: r.jsonLd, h1: r.h1
  };
}

await waitForChrome();
const results = {};
for (const [name, url] of Object.entries(URLS)) {
  for (const profile of ['mobile', 'desktop']) {
    process.stdout.write(`${name}/${profile} ... `);
    try {
      const r = await measure(url, profile);
      results[`${name}/${profile}`] = r;
      console.log(`LCP ${r.lcpMs}ms  FCP ${r.fcpMs}ms  CLS ${r.cls}  TBT~${r.blockingTimeMs}ms  ${r.requests} reqs  ${r.transferKB}KB  ${r.domNodes} nodes`);
    } catch (e) { console.log('ERR', e.message); results[`${name}/${profile}`] = { error: String(e.message) }; }
  }
}
fs.writeFileSync(new URL('../data/perf-baseline.json', import.meta.url), JSON.stringify(results, null, 2));
chrome.kill();
process.exit(0);
