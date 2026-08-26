// Phase 8 performance measurement against the password-protected build store.
// Same method and throttling as scripts/perf-baseline.mjs (Phase 0) so the two
// are directly comparable: 4x CPU, 1.6 Mbps / 150 ms RTT for mobile.
//
//   node scripts/perf-measure.mjs before
//   node scripts/perf-measure.mjs after 3            # 3 runs per page, medians reported
//   node scripts/perf-measure.mjs after 3 --published # also block the preview-only scripts
//
// --published blocks Shopify's theme-hot-reload client, the preview bar and the
// perf kit. Those three are served only because 157001318557 is a development
// theme being previewed; none of them exist on a published theme, and together
// they add requests and bandwidth on the critical path. Blocking them is the
// closest honest estimate of what a customer will actually get.
//
// Writes data/perf-phase8-<label>.json plus a per-request breakdown so we can
// see exactly which assets are carrying the weight.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BASE, STORE, THEME_ID, authenticate, authenticateNoPreview } from './_build-store.mjs';

const LABEL = process.argv[2] || 'before';
const RUNS = Number(process.argv[3]) > 0 ? Number(process.argv[3]) : 1;
const PUBLISHED = process.argv.includes('--published');

// Served only to a previewed development theme. See --published above.
const PREVIEW_ONLY = [
  '*theme-hot-reload*',
  '*preview-bar*',
  '*perf-kit*'
];

// Diagnostic only (--no-compiled-css): drops Shopify's compiled_assets/styles.css,
// the bundle of every {% stylesheet %} block in the theme. Measures what shrinking
// that bundle is worth before deciding whether to chase it. The page renders
// unstyled in places under this flag - it is not a shippable configuration.
const COMPILED_CSS = ['*compiled_assets/styles.css*'];

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9336;
const URLS = {
  home: `${BASE}/`,
  collection: `${BASE}/collections/syp-billet`,
  product: `${BASE}/products/k-series-single-lobe-billet-rockers`
};
const PROFILES = {
  mobile: { w: 412, h: 823, dpr: 2.625, mobile: true, cpu: 4, down: 1.6 * 1024 * 1024 / 8, up: 750 * 1024 / 8, rtt: 150 },
  desktop: { w: 1350, h: 940, dpr: 1, mobile: false, cpu: 1, down: 10 * 1024 * 1024 / 8, up: 10 * 1024 * 1024 / 8, rtt: 40 }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// --published measures what a visitor actually gets: the live theme, with no
// preview cookie and none of the preview-only scripts. Now that the rebuild is
// the published theme this is a measurement, not an estimate.
const { cdpCookies: cookies } = PUBLISHED
  ? await authenticateNoPreview()
  : await authenticate();
console.log(`Storefront unlocked, previewing theme ${THEME_ID}.\n`);

const userDataDir = path.join(os.tmpdir(), 'syp-perf8-profile');
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions',
  '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.events = [];
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

const OBSERVER = [
  'window.__m = { lcp: 0, lcpEl: "", cls: 0, fcp: 0, longTasks: 0, longTaskTime: 0 };',
  'new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){',
  '  window.__m.lcp = e.startTime;',
  '  var el = e.element; var d = "";',
  '  if (el) { d = el.tagName; if (el.id) d += "#" + el.id;',
  '    if (el.className && typeof el.className === "string") d += "." + el.className.trim().split(/\\s+/).slice(0,2).join("."); }',
  '  if (e.url) d += " <- " + e.url;',
  '  window.__m.lcpEl = d;',
  '}); }).observe({ type: "largest-contentful-paint", buffered: true });',
  'new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ if (!e.hadRecentInput) window.__m.cls += e.value; }); })',
  '  .observe({ type: "layout-shift", buffered: true });',
  'new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ if (e.name === "first-contentful-paint") window.__m.fcp = e.startTime; }); })',
  '  .observe({ type: "paint", buffered: true });',
  'new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ window.__m.longTasks++; window.__m.longTaskTime += Math.max(0, e.duration - 50); }); })',
  '  .observe({ type: "longtask", buffered: true });'
].join('\n');

const PAGE_PROBE = [
  '(function(){',
  '  var nav = performance.getEntriesByType("navigation")[0] || {};',
  '  var imgs = Array.prototype.slice.call(document.images);',
  '  var scripts = Array.prototype.slice.call(document.scripts);',
  '  var sheets = Array.prototype.slice.call(document.querySelectorAll("link[rel=stylesheet]"));',
  '  var tail = function(s){ return String(s || "").replace(/\\?.*/, "").split("/").pop(); };',
  '  return Object.assign({}, window.__m, {',
  '    ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,',
  '    domNodes: document.getElementsByTagName("*").length,',
  '    images: imgs.length,',
  '    imagesNoAlt: imgs.filter(function(i){ return !i.alt || !i.alt.trim(); }).length,',
  '    lazyImages: imgs.filter(function(i){ return i.loading === "lazy"; }).length,',
  '    eagerImages: imgs.filter(function(i){ return i.loading !== "lazy"; }).map(function(i){',
  '      return { src: String(i.currentSrc || i.src || "").slice(-90), css: i.width, natural: i.naturalWidth,',
  '               fetchpriority: i.getAttribute("fetchpriority"),',
  '               inView: i.getBoundingClientRect().top < window.innerHeight }; }),',
  '    noSrcset: imgs.filter(function(i){ return !i.srcset; }).length,',
  '    oversized: imgs.filter(function(i){ return i.naturalWidth && i.width && i.naturalWidth > i.width * window.devicePixelRatio * 1.5; })',
  '      .map(function(i){ return { src: String(i.currentSrc || "").slice(-90), css: i.width, natural: i.naturalWidth }; }),',
  '    scripts: scripts.length,',
  '    blockingScripts: scripts.filter(function(s){ return s.src && !s.async && !s.defer && s.type !== "module"; })',
  '      .map(function(s){ return tail(s.src); }),',
  '    moduleScripts: scripts.filter(function(s){ return s.type === "module"; }).length,',
  '    stylesheets: sheets.length,',
  '    stylesheetHrefs: sheets.map(function(l){ return tail(l.href); }),',
  '    preloads: Array.prototype.slice.call(document.querySelectorAll("link[rel=preload]"))',
  '      .map(function(l){ return l.getAttribute("as") + ":" + tail(l.href); }),',
  '    title: document.title.trim(),',
  '    h1: Array.prototype.slice.call(document.querySelectorAll("h1")).map(function(h){ return h.textContent.trim(); }).slice(0,3)',
  '  });',
  '})()'
].join('\n');

async function waitForChrome() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch {}
    await sleep(500);
  }
  throw new Error('Chrome did not start');
}

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
  await c.send('Network.clearBrowserCookies');
  for (const ck of cookies) { try { await c.send('Network.setCookie', ck); } catch {} }
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  const blocked = [];
  if (PUBLISHED) blocked.push(...PREVIEW_ONLY);
  if (process.argv.includes('--no-compiled-css')) blocked.push(...COMPILED_CSS);
  if (blocked.length) await c.send('Network.setBlockedURLs', { urls: blocked });
  await c.send('Emulation.setDeviceMetricsOverride', { width: p.w, height: p.h, deviceScaleFactor: p.dpr, mobile: p.mobile });
  await c.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  await c.send('Network.emulateNetworkConditions', { offline: false, latency: p.rtt, downloadThroughput: p.down, uploadThroughput: p.up });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVER });

  const start = Date.now();
  await c.send('Page.navigate', { url });
  let loaded = false;
  for (let i = 0; i < 90 && !loaded; i++) {
    await sleep(500);
    loaded = c.events.some(e => e.method === 'Page.loadEventFired');
  }
  await sleep(3000);

  const req = c.events.filter(e => e.method === 'Network.responseReceived');
  const fin = c.events.filter(e => e.method === 'Network.loadingFinished');
  const bytes = fin.reduce((a, e) => a + (e.params.encodedDataLength || 0), 0);
  const byType = {};
  const assets = [];
  for (const e of req) {
    const ty = e.params.type || 'Other';
    const f = fin.find(x => x.params.requestId === e.params.requestId);
    const kb = Math.round((f?.params.encodedDataLength || 0) / 1024);
    byType[ty] = byType[ty] || { n: 0, kb: 0 };
    byType[ty].n++; byType[ty].kb += kb;
    assets.push({ type: ty, kb, url: e.params.response.url });
  }
  assets.sort((a, b) => b.kb - a.kb);

  const m = await c.send('Runtime.evaluate', { returnByValue: true, expression: PAGE_PROBE });
  const r = m.result.value;
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);

  return {
    url, profile,
    wallClockMs: Date.now() - start,
    ttfbMs: Math.round(r.ttfb), fcpMs: Math.round(r.fcp), lcpMs: Math.round(r.lcp), lcpElement: r.lcpEl,
    cls: Number(r.cls.toFixed(3)),
    domContentLoadedMs: Math.round(r.dcl), loadMs: Math.round(r.load),
    longTasks: r.longTasks, blockingTimeMs: Math.round(r.longTaskTime),
    requests: req.length, transferKB: Math.round(bytes / 1024), byType,
    top20Assets: assets.slice(0, 20),
    domNodes: r.domNodes, images: r.images, imagesMissingAlt: r.imagesNoAlt,
    lazyImages: r.lazyImages, eagerImages: r.eagerImages, imagesWithoutSrcset: r.noSrcset,
    oversizedImages: r.oversized,
    scripts: r.scripts, blockingScripts: r.blockingScripts, moduleScripts: r.moduleScripts,
    stylesheets: r.stylesheets, stylesheetHrefs: r.stylesheetHrefs, preloads: r.preloads,
    title: r.title, h1: r.h1
  };
}

// Median rather than mean: a single stalled request skews a mean badly and these
// runs share a real network.
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
};

await waitForChrome();
const results = {};
console.log(`${RUNS} run(s) per page${PUBLISHED ? ', preview-only scripts blocked' : ''}.
`);
for (const [name, url] of Object.entries(URLS)) {
  for (const profile of ['mobile', 'desktop']) {
    process.stdout.write(`${name}/${profile} ... `);
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      try { runs.push(await measure(url, profile)); }
      catch (e) { process.stdout.write(`[run ${i + 1} ERR ${e.message}] `); }
    }
    if (!runs.length) { results[`${name}/${profile}`] = { error: 'all runs failed' }; console.log('ERR'); continue; }

    // Keep the last run's structural detail (asset lists, image audits - these do
    // not vary), and replace the timing numbers with medians across runs.
    const r = { ...runs[runs.length - 1], runs: RUNS, previewScriptsBlocked: PUBLISHED };
    for (const k of ['ttfbMs', 'fcpMs', 'lcpMs', 'domContentLoadedMs', 'loadMs', 'blockingTimeMs', 'requests', 'transferKB', 'longTasks']) {
      r[k] = median(runs.map(x => x[k]));
    }
    r.cls = Number(median(runs.map(x => x.cls * 1000)) / 1000);
    if (RUNS > 1) r.lcpMsAllRuns = runs.map(x => x.lcpMs);
    results[`${name}/${profile}`] = r;
    console.log(`LCP ${r.lcpMs}ms  FCP ${r.fcpMs}ms  CLS ${r.cls}  TBT~${r.blockingTimeMs}ms  ${r.requests} reqs  ${r.transferKB}KB  ${r.domNodes} nodes  ${r.stylesheets} css  ${r.scripts} js`);
  }
}
const out = new URL(`../data/perf-phase8-${LABEL}.json`, import.meta.url);
fs.writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`\nWrote data/perf-phase8-${LABEL}.json`);
chrome.kill();
process.exit(0);
