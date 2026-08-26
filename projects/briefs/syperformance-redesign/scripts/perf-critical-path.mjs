// Phase 8 diagnostic: what actually sits on the critical path to first paint.
// Prints every resource that finished before FCP, in start order, with its
// initiator type and whether it is render-blocking.
//
//   node scripts/perf-critical-path.mjs /products/k-series-single-lobe-billet-rockers
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { BASE, STORE, THEME_ID, authenticate } from './_build-store.mjs';

const TARGET = BASE + (process.argv[2] || '/');
const PROFILE = process.argv[3] || 'mobile';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9337;
const P = PROFILE === 'mobile'
  ? { w: 412, h: 823, dpr: 2.625, mobile: true, cpu: 4, down: 1.6 * 1024 * 1024 / 8, up: 750 * 1024 / 8, rtt: 150 }
  : { w: 1350, h: 940, dpr: 1, mobile: false, cpu: 1, down: 10 * 1024 * 1024 / 8, up: 10 * 1024 * 1024 / 8, rtt: 40 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

const { cookieHeader, cdpCookies } = await authenticate();
const cookies = cdpCookies;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-critpath-profile')}`,
  '--no-first-run', '--disable-gpu', '--disable-extensions', '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });

for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}

const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const events = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) events.push(m);
});
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Network.enable');
await send('Page.enable');
await send('Runtime.enable');
await send('Network.clearBrowserCache');
await send('Network.clearBrowserCookies');
for (const c of cookies) await send('Network.setCookie', c);
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: P.w, height: P.h, deviceScaleFactor: P.dpr, mobile: P.mobile });
await send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
await send('Network.emulateNetworkConditions', { offline: false, latency: P.rtt, downloadThroughput: P.down, uploadThroughput: P.up });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: 'window.__fcp=0;new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.name==="first-contentful-paint")window.__fcp=e.startTime;});}).observe({type:"paint",buffered:true});'
});

await send('Page.navigate', { url: TARGET });
for (let i = 0; i < 90; i++) { await sleep(500); if (events.some(e => e.method === 'Page.loadEventFired')) break; }
await sleep(2000);

const timing = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(function(){
    var nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      fcp: window.__fcp,
      ttfb: nav.responseStart,
      domInteractive: nav.domInteractive,
      resources: performance.getEntriesByType('resource').map(function(r){
        return { name: r.name, type: r.initiatorType, start: Math.round(r.startTime),
                 end: Math.round(r.responseEnd), kb: Math.round((r.encodedBodySize||r.transferSize||0)/1024),
                 blocked: r.renderBlockingStatus };
      })
    };
  })()`
});
// send() resolves with the whole CDP message, so the payload is result.result.value.
const evaluated = timing.result || {};
if (evaluated.exceptionDetails || evaluated.result?.value === undefined) {
  console.error('probe failed:', JSON.stringify(timing).slice(0, 1200));
  chrome.kill();
  process.exit(1);
}
const d = evaluated.result.value;

const short = u => u.replace(/^https?:\/\//, '').replace(/\?.*/, '').replace('syperformance-build.myshopify.com/', '').replace('cdn/shop/t/2/assets/', 'theme:').replace('cdn/shopifycloud/', 'sc:').slice(-64);

console.log(`\n${TARGET}  [${PROFILE}]`);
console.log(`TTFB ${Math.round(d.ttfb)} ms   domInteractive ${Math.round(d.domInteractive)} ms   FCP ${Math.round(d.fcp)} ms\n`);

const blocking = d.resources.filter(r => r.blocked === 'blocking');
console.log(`RENDER-BLOCKING (${blocking.length}):`);
for (const r of blocking.sort((a, b) => a.end - b.end)) {
  console.log(`  ${String(r.start).padStart(5)} -> ${String(r.end).padStart(5)} ms  ${String(r.kb).padStart(4)} KB  ${r.type.padEnd(6)} ${short(r.name)}`);
}

const beforeFcp = d.resources.filter(r => r.start < d.fcp).sort((a, b) => a.start - b.start);
console.log(`\nSTARTED BEFORE FCP (${beforeFcp.length}), the 25 that finished latest:`);
for (const r of beforeFcp.sort((a, b) => b.end - a.end).slice(0, 25)) {
  console.log(`  ${String(r.start).padStart(5)} -> ${String(r.end).padStart(5)} ms  ${String(r.kb).padStart(4)} KB  ${(r.blocked || '-').padEnd(12)} ${r.type.padEnd(6)} ${short(r.name)}`);
}

chrome.kill();
process.exit(0);
