// Set a file on a page's <input type=file> over CDP. The shared browser/cdp.mjs
// driver has no file-picker support and is a shipped file, so this lives with the
// project instead of modifying it.
//
// usage: node scripts/browser-upload.mjs <absolute-file-path> [input-selector]
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9222;
const FILE = path.resolve(process.argv[2]);
const SELECTOR = process.argv[3] || 'input[type=file]';

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && !t.url.startsWith('devtools://'));
if (!page) { console.error('no page target'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id: i, method, params }));
});

await send('DOM.enable');
const { root } = await send('DOM.getDocument', { depth: -1, pierce: true });
const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: SELECTOR });
if (!nodeId) { console.error('file input not found for selector:', SELECTOR); process.exit(1); }

await send('DOM.setFileInputFiles', { files: [FILE], nodeId });
console.log('attached', FILE, 'to', SELECTOR);
ws.close();
process.exit(0);
