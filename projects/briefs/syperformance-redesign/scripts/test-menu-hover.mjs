// Does the dropdown survive the trip from the trigger to the panel?
//
//   node scripts/test-menu-hover.mjs
//
// Drives real CDP mouse moves down the path a person takes: onto the nav item,
// then step by step toward a link inside the panel, checking at every step that
// the panel is still open. A screenshot cannot catch this and neither can reading
// the CSS — the bug only exists in the gap between two boxes.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { BASE, authenticateNoPreview } from './_build-store.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9346;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const { cdpCookies } = await authenticateNoPreview();

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-hover-profile')}`,
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
const ev = async (expr) => (await send('Runtime.evaluate', { returnByValue: true, expression: expr })).result?.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
for (const c of cdpCookies) await send('Network.setCookie', c);
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 950, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '/' });
for (let i = 0; i < 40; i++) { await sleep(400); if (await ev('document.readyState') === 'complete') break; }
await sleep(2500);

// Real mouse moves — pointerenter/leave only fire for a genuine pointer.
const move = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', pointerType: 'mouse' });
  await sleep(90);
};

const NAV = ['SYP Billet', 'Honda', 'Mitsubishi Evo', 'Forced Induction', 'Engine'];
let failures = 0;

for (const label of NAV) {
  const geo = await ev(`(function(){
    var items = [].slice.call(document.querySelectorAll('.syp-header__nav-item--has-panel'));
    var item = items.filter(function(i){ var b=i.querySelector('[data-syp-panel-trigger]'); return b && b.textContent.trim().indexOf(${JSON.stringify(label)}) === 0; })[0];
    if (!item) return null;
    var btn = item.querySelector('[data-syp-panel-trigger]');
    var panel = item.querySelector('.syp-header__panel');
    var link = panel.querySelector('a');
    var b = btn.getBoundingClientRect();
    var p = panel.getBoundingClientRect();
    var l = link ? link.getBoundingClientRect() : null;
    return { btn:{x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), bottom:Math.round(b.bottom)},
             panelTop: Math.round(p.top), panelHeight: Math.round(p.height),
             link: l ? {x:Math.round(l.x+l.width/2), y:Math.round(l.y+l.height/2), text:link.textContent.trim()} : null };
  })()`);

  if (!geo) { console.log(`  ${label}: no panel (skipping)`); continue; }

  // Panel geometry is measured while closed, so open it first, then re-measure.
  await move(geo.btn.x, geo.btn.y);
  await sleep(250);
  const open1 = await ev(`document.querySelectorAll('.syp-header__panel:not([hidden])').length > 0`);

  const geo2 = await ev(`(function(){
    var panel = document.querySelector('.syp-header__panel:not([hidden])');
    if (!panel) return null;
    var link = panel.querySelector('a');
    var p = panel.getBoundingClientRect();
    var l = link.getBoundingClientRect();
    return { panelTop: Math.round(p.top), gap: Math.round(p.top) - ${geo.btn.bottom},
             link: { x: Math.round(l.x + l.width/2), y: Math.round(l.y + l.height/2), text: link.textContent.trim() } };
  })()`);

  if (!open1 || !geo2) { console.log(`  ${label}: FAIL — panel did not open on hover`); failures++; continue; }

  // Walk down through the gap into the panel, checking at every step.
  const steps = [];
  const from = geo.btn.y, to = geo2.link.y;
  let stillOpen = true;
  for (let i = 1; i <= 8; i++) {
    const y = Math.round(from + ((to - from) * i) / 8);
    const x = Math.round(geo.btn.x + ((geo2.link.x - geo.btn.x) * i) / 8);
    await move(x, y);
    const o = await ev(`document.querySelectorAll('.syp-header__panel:not([hidden])').length > 0`);
    steps.push(o ? '.' : 'X');
    if (!o) stillOpen = false;
  }

  // And can we actually click the link?
  let clicked = null;
  if (stillOpen) {
    clicked = await ev(`(function(){
      var el = document.elementFromPoint(${geo2.link.x}, ${geo2.link.y});
      if (!el) return 'nothing at point';
      var a = el.closest('a');
      return a ? 'link: ' + a.textContent.trim() : 'blocked by ' + el.className;
    })()`);
  }

  const ok = stillOpen && String(clicked).startsWith('link:');
  if (!ok) failures++;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(17)} gap ${String(geo2.gap).padStart(3)}px  path [${steps.join('')}]  ${clicked ?? 'panel closed en route'}`
  );

  // reset
  await move(10, 600);
  await sleep(250);
}

console.log(failures ? `\n${failures} menu(s) unreachable.` : '\nAll menus reachable by mouse.');
chrome.kill();
process.exit(failures ? 1 : 0);
