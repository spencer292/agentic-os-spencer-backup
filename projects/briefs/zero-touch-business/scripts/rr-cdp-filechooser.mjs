#!/usr/bin/env node
// rr-cdp-filechooser.mjs — upload to a button-triggered uploader (one that opens the
// OS file dialog) by intercepting the chooser instead of letting it open.
//
// Gumroad's Cover uploader has no file input in the DOM until its button is clicked,
// and that click opens a native dialog a script can't touch. Page.setInterceptFileChooser
// makes Chrome fire Page.fileChooserOpened (with the input's backendNodeId) instead of
// showing the dialog — then DOM.setFileInputFiles does the rest. No native dialog ever
// appears, so the browser can't get stuck behind one.
//
// Usage:
//   node .../rr-cdp-filechooser.mjs --button-text "Upload images or videos" --files cover.png
//   node .../rr-cdp-filechooser.mjs --button-id rr-cover --files cover.png
import { existsSync } from 'fs';
import { resolve } from 'path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i === -1 ? d : argv[i + 1]; };
const PORT = arg('--port', '9222');
const BTN_TEXT = arg('--button-text');
const BTN_ID = arg('--button-id');
const TIMEOUT = Number(arg('--timeout', '15000'));

const files = (arg('--files') || '').split(',').filter(Boolean).map(f => resolve(f.trim()));
if (!files.length) { console.error('FAIL: pass --files'); process.exit(1); }
for (const f of files) if (!existsSync(f)) { console.error('FAIL: missing ' + f); process.exit(1); }
if (!BTN_TEXT && !BTN_ID) { console.error('FAIL: pass --button-text or --button-id'); process.exit(1); }

const targets = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = targets.find(t => t.type === 'page' && /gumroad/i.test(t.url)) || targets.find(t => t.type === 'page');
if (!page) { console.error('FAIL: no page target'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const listeners = [];
const send = (method, params = {}) => new Promise((res, rej) => {
  const msgId = ++id;
  pending.set(msgId, { res, rej });
  ws.send(JSON.stringify({ id: msgId, method, params }));
});
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  } else if (msg.method) {
    for (const l of listeners) l(msg);
  }
});
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP websocket failed')), { once: true });
});

try {
  await send('DOM.enable');
  await send('Page.enable');
  // Intercept: Chrome fires Page.fileChooserOpened instead of showing the OS dialog.
  await send('Page.setInterceptFileChooserDialog', { enabled: true });

  const chooser = new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('no fileChooserOpened within ' + TIMEOUT + 'ms')), TIMEOUT);
    listeners.push((msg) => {
      if (msg.method === 'Page.fileChooserOpened') { clearTimeout(to); res(msg.params); }
    });
  });

  // element.click() does NOT fire Gumroad's React handlers (learned 2026-07-26), and a
  // synthetic click never opens a file chooser anyway. Locate the button, then dispatch a
  // real mouse press/release at its center so Chrome treats it as user input.
  const findExpr = BTN_ID
    ? `(function(){var b=document.getElementById(${JSON.stringify(BTN_ID)}); if(!b) return null; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()`
    : `(function(){var b=[].slice.call(document.querySelectorAll('button,[role=button],label')).filter(function(x){return (x.innerText||'').trim()===${JSON.stringify(BTN_TEXT)};})[0]; if(!b) return null; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()`;
  const found = await send('Runtime.evaluate', { expression: findExpr, returnByValue: true });
  if (!found.result.value) {
    console.error('FAIL: button not found (' + (BTN_ID || BTN_TEXT) + ')');
    process.exit(1);
  }
  const { x, y } = JSON.parse(found.result.value);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

  const params = await chooser;
  const backendNodeId = params.backendNodeId;
  if (!backendNodeId) { console.error('FAIL: chooser had no backendNodeId: ' + JSON.stringify(params)); process.exit(1); }

  await send('DOM.setFileInputFiles', { backendNodeId, files });
  console.log(JSON.stringify({
    status: 'SET_VIA_CHOOSER',
    mode: params.mode,
    count: files.length,
    files: files.map(f => f.split(/[\\/]/).pop()),
  }, null, 2));
} catch (e) {
  console.error('FAIL: ' + e.message);
  process.exitCode = 1;
} finally {
  try { await send('Page.setInterceptFileChooserDialog', { enabled: false }); } catch {}
  ws.close();
}
process.exit(process.exitCode || 0);
