// drive-upload.mjs — upload the 14 cleaning-kit deliverables to the ACTIVE Google Drive tab
// via CDP file-chooser interception (no native dialog). Run from repo root with the agentic
// Chrome already on drive.google.com in the routereadykits@gmail.com context (/u/2/).
// Usage: node projects/briefs/zero-touch-business/scripts/drive-upload.mjs
import { readdirSync } from 'fs';
import { resolve } from 'path';

const CDP_PORT = process.env.CDP_PORT || 9222;
const DELIV = resolve('projects/briefs/zero-touch-business/products/cleaning-kit/deliverables');
const files = readdirSync(DELIV)
  .filter(f => f.endsWith('.xlsx') || f.endsWith('.docx'))
  .map(f => resolve(DELIV, f));
if (files.length !== 14) {
  console.error(`Expected 14 deliverables, found ${files.length} — aborting.`);
  process.exit(1);
}

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const tab = targets.find(t => t.type === 'page' && /drive\.google\.com/.test(t.url));
if (!tab) { console.error('No drive.google.com tab found.'); process.exit(1); }

const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  } else if (msg.method) {
    events.push(msg);
  }
};
await new Promise(r => { ws.onopen = r; });

const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) console.error('EVAL EXCEPTION:', JSON.stringify(r.exceptionDetails).slice(0, 400));
  if (r.result?.value === undefined && !r.exceptionDetails) console.error('EVAL RAW:', JSON.stringify(r).slice(0, 300));
  return r.result?.value;
};

await send('Page.enable');
await send('DOM.enable');
await send('Page.setInterceptFileChooserDialog', { enabled: true });

// 1. Open the New menu, then click "File upload"
const clickNew = await evalJs(`(() => {
  const btn = document.querySelector("button[guidedhelpid='new_menu_button']")
    || [...document.querySelectorAll("div[role='button'],button")].find(b => b.innerText.trim() === 'New');
  if (!btn) return 'NEW_BUTTON_NOT_FOUND';
  for (const type of ['mousedown','mouseup','click']) {
    btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  }
  return 'clicked';
})()`);
console.log(`New menu: ${clickNew}`);
if (clickNew !== 'clicked') { ws.close(); process.exit(1); }
await new Promise(r => setTimeout(r, 1200));

const clickUpload = await evalJs(`(() => {
  const items = [...document.querySelectorAll("[role='menuitem']")];
  const item = items.find(i => i.innerText.split('\\n')[0].trim() === 'File upload');
  if (!item) return 'FILE_UPLOAD_ITEM_NOT_FOUND: ' + items.map(i => i.innerText.split('\\n')[0]).join(' | ');
  for (const type of ['mousedown','mouseup','click']) {
    item.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  }
  return 'clicked';
})()`);
console.log(`File upload item: ${clickUpload}`);
if (clickUpload !== 'clicked') { ws.close(); process.exit(1); }

// 2. Wait for the intercepted file chooser, then inject the files
let chooser;
for (let i = 0; i < 40 && !chooser; i++) {
  chooser = events.find(e => e.method === 'Page.fileChooserOpened');
  if (!chooser) await new Promise(r => setTimeout(r, 250));
}
if (!chooser) { console.error('File chooser never opened.'); ws.close(); process.exit(1); }
await send('DOM.setFileInputFiles', {
  files,
  backendNodeId: chooser.params.backendNodeId,
});
console.log(`Injected ${files.length} files — uploading...`);

// 3. Poll the Drive UI until uploads report complete (up to 3 min)
let done = false;
for (let i = 0; i < 90 && !done; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const txt = await evalJs(`(document.body.innerText.match(/\\d+ uploads? complete|Upload complete/i) || [''])[0]`);
  if (txt) { console.log(`Drive says: ${txt}`); done = true; }
}
if (!done) console.log('No completion banner seen in 3 min — verify in the window.');
ws.close();
