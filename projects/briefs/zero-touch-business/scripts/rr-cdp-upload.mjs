#!/usr/bin/env node
// rr-cdp-upload.mjs — set files on a page's <input type=file> via CDP DOM.setFileInputFiles.
// JS cannot assign to a file input (browser security), so this is the only way to drive an
// upload from a script. Kept project-local so the shipped browser/ driver stays untouched.
//
// Usage:
//   node .../rr-cdp-upload.mjs --selector "input[type=file]" --dir <folder> [--ext docx,xlsx]
//   node .../rr-cdp-upload.mjs --selector "input[accept*=png]" --files a.png,b.png
//   node .../rr-cdp-upload.mjs --inspect --selector "input[type=file]"
import { readdirSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i === -1 ? d : argv[i + 1]; };
const PORT = arg('--port', '9222');
const SELECTOR = arg('--selector', 'input[type=file]');
const INDEX = Number(arg('--index', '0'));
const INSPECT = argv.includes('--inspect');

let files = [];
const dir = arg('--dir');
if (dir) {
  const abs = resolve(dir);
  if (!existsSync(abs)) { console.error('FAIL: no such dir ' + abs); process.exit(1); }
  const exts = (arg('--ext', 'docx,xlsx,pdf')).split(',').map(e => e.trim().toLowerCase());
  files = readdirSync(abs)
    .filter(f => exts.includes(f.split('.').pop().toLowerCase()))
    .sort()
    .map(f => resolve(abs, f));
} else if (arg('--files')) {
  files = arg('--files').split(',').map(f => resolve(f.trim()));
}
for (const f of files) {
  if (!existsSync(f)) { console.error('FAIL: missing file ' + f); process.exit(1); }
}

const targets = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = targets.find(t => t.type === 'page' && /gumroad/i.test(t.url)) || targets.find(t => t.type === 'page');
if (!page) { console.error('FAIL: no page target on CDP port ' + PORT); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
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
  }
});
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('CDP websocket failed — is the window up?')), { once: true });
});

try {
  await send('DOM.enable');
  await send('Runtime.enable');
  const { root } = await send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: SELECTOR });
  if (!nodeIds.length) { console.error(`FAIL: selector matched nothing: ${SELECTOR}`); process.exit(1); }
  if (INDEX >= nodeIds.length) {
    console.error(`FAIL: --index ${INDEX} out of range (matched ${nodeIds.length})`); process.exit(1);
  }
  const nodeId = nodeIds[INDEX];

  if (INSPECT) {
    const { attributes } = await send('DOM.getAttributes', { nodeId });
    const attrs = {};
    for (let i = 0; i < attributes.length; i += 2) attrs[attributes[i]] = attributes[i + 1];
    console.log(JSON.stringify({ matched: nodeIds.length, index: INDEX, attributes: attrs }, null, 2));
    process.exit(0);
  }

  if (!files.length) { console.error('FAIL: no files resolved — pass --dir or --files'); process.exit(1); }
  const totalMb = files.reduce((s, f) => s + statSync(f).size, 0) / 1048576;
  await send('DOM.setFileInputFiles', { nodeId, files });
  console.log(JSON.stringify({
    status: 'SET',
    selector: SELECTOR,
    index: INDEX,
    count: files.length,
    total_mb: Number(totalMb.toFixed(2)),
    files: files.map(f => f.split(/[\\/]/).pop()),
  }, null, 2));
} catch (e) {
  console.error('FAIL: ' + e.message);
  process.exit(1);
} finally {
  ws.close();
}
process.exit(0);
