// Screenshot pages on the build store, on the preview theme.
//
//   node scripts/screenshot.mjs /                 out.png [desktop|mobile]
//
// Exists because Phase 8 was verified by reading HTML, which cannot tell you
// whether a page LOOKS right — only whether the markup and the asset URLs are
// present. Look at the picture.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BASE, authenticate, authenticateNoPreview } from './_build-store.mjs';

const TARGET = BASE + (process.argv[2] || '/');
const OUT = process.argv[3] || 'screenshot.png';
const PROFILE = process.argv[4] || 'desktop';
const FULL = process.argv.includes('--full');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9343;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const P = PROFILE === 'mobile'
  ? { width: 412, height: 900, deviceScaleFactor: 2, mobile: true }
  : { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };

// --published screenshots the store's PUBLISHED theme instead of the build,
// which is what a visitor sees if the preview cookie is not set.
const { cdpCookies } = process.argv.includes('--published')
  ? await authenticateNoPreview()
  : await authenticate();

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-shot-profile')}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Network.enable');
for (const c of cdpCookies) await send('Network.setCookie', c);
await send('Emulation.setDeviceMetricsOverride', P);
await send('Page.navigate', { url: TARGET });
for (let i = 0; i < 40; i++) {
  await sleep(500);
  const rs = await send('Runtime.evaluate', { returnByValue: true, expression: 'document.readyState' });
  if (rs.result?.value === 'complete') break;
}
await sleep(2500);

// --full: resize the viewport to the real content height and capture normally.
// captureBeyondViewport looks like the obvious tool and is a trap here — this
// theme's <body> reports scrollHeight 1000 while the product grid alone is 2,685
// tall, so the extra canvas comes back as empty background and the page looks
// broken. Measure what actually scrolls, then make the window that tall.
if (FULL) {
  const h = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `Math.max(
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.body ? document.body.scrollHeight : 0,
      ...[].slice.call(document.querySelectorAll('.page-wrapper, main, .product-grid'))
        .map(function(el){ var r = el.getBoundingClientRect(); return Math.ceil(r.bottom + window.scrollY); })
    )`
  });
  const contentHeight = Math.min(Math.ceil(h.result?.result?.value || P.height), 20000);
  await send('Emulation.setDeviceMetricsOverride', { ...P, height: contentHeight });
  // Give lazy images below the old fold a chance to load at the new size.
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await sleep(3000);
}

const { data } = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
console.log(`wrote ${OUT}  (${PROFILE}, ${TARGET})`);
chrome.kill();
process.exit(0);
