// Phase 8 regression check. Loads every template in a real browser and reports
// console errors, failed requests, and any custom element in the DOM that never
// got upgraded (i.e. its defining script did not load). An unregistered custom
// element fails silently, so this is the only way to catch an over-aggressive
// script gate.
//
//   node scripts/check-templates.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, STORE, THEME_ID, authenticate } from './_build-store.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9338;

const PAGES = {
  index: '/',
  collection: '/collections/syp-billet',
  'collection-list': '/collections',
  product: '/products/k-series-single-lobe-billet-rockers',
  search: '/search?q=billet',
  cart: '/cart',
  blog: '/blogs/news',
  'page-about': '/pages/about',
  'page-warranty': '/pages/warranty',
  'page-lead-times': '/pages/lead-times',
  'page-contact': '/pages/contact'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Tags the theme can actually define. Horizon also uses dashed tags purely as
// styling hooks (slideshow-slide, slideshow-arrows and friends) — those are
// meant to stay unupgraded, so only a tag with a customElements.define somewhere
// in theme/assets counts as a missing script.
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const definable = new Set();
for (const f of fs.readdirSync(path.join(ROOT, 'theme', 'assets'))) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(path.join(ROOT, 'theme', 'assets', f), 'utf8');
  for (const m of src.matchAll(/customElements\.define\(\s*['"]([a-z0-9-]+)['"]/g)) definable.add(m[1]);
}

const { cookieHeader, cdpCookies } = await authenticate();
const cookies = cdpCookies;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-check-profile')}`,
  '--no-first-run', '--disable-gpu', '--disable-extensions', '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}

const PROBE = `(function(){
  var bad = [];
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var tag = all[i].tagName.toLowerCase();
    if (tag.indexOf('-') === -1) continue;
    if (!customElements.get(tag)) bad.push(tag);
  }
  var counts = {};
  bad.forEach(function(t){ counts[t] = (counts[t] || 0) + 1; });
  return counts;
})()`;

let problems = 0;
for (const [name, url] of Object.entries(PAGES)) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  const errors = []; const failed = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
    if (m.method === 'Network.loadingFailed') failed.push(m.params.errorText);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
      failed.push(`${m.params.response.status} ${m.params.response.url}`);
    }
  });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');
  await send('Page.enable');
  for (const c of cookies) await send('Network.setCookie', c);
  // Wait for load, then settle. A fixed sleep was too short on a slow run and
  // reported every component on the page as unupgraded — a false alarm that looks
  // exactly like a real regression.
  let loaded = false;
  await send('Page.navigate', { url: BASE + url });
  for (let i = 0; i < 40 && !loaded; i++) {
    await sleep(500);
    const rs = await send('Runtime.evaluate', { returnByValue: true, expression: 'document.readyState' });
    loaded = rs.result?.result?.value === 'complete';
  }
  await sleep(3000);
  if (!loaded) console.log(`         (never reached readyState=complete — results below may be a timeout, not a regression)`);

  const res = await send('Runtime.evaluate', { returnByValue: true, expression: PROBE });
  const notUpgraded = res.result?.result?.value || {};
  const stray = Object.entries(notUpgraded).filter(([tag]) => definable.has(tag));
  const realErrors = errors.filter((e) => !/frame-ancestors/.test(String(e)));
  const badResponses = [...new Set(failed)].filter((f) => !/^net::ERR_ABORTED/.test(f));

  const status = realErrors.length || stray.length || badResponses.length ? 'FAIL' : ' ok ';
  if (status === 'FAIL') problems++;
  console.log(`[${status}] ${name.padEnd(16)} ${url}`);
  if (stray.length) console.log(`         script missing for: ${stray.map(([t, n]) => `${t}×${n}`).join(', ')}`);
  for (const e of [...new Set(realErrors)].slice(0, 4)) console.log(`         error: ${String(e).split(String.fromCharCode(10))[0].slice(0, 140)}`);
  for (const f of badResponses.slice(0, 4)) console.log(`         request: ${String(f).slice(0, 160)}`);

  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);
}

console.log(problems ? `\n${problems} template(s) with problems.` : '\nAll templates clean.');
chrome.kill();
process.exit(0);
