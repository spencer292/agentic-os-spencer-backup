// drive-inject-files.mjs — set the 14 deliverables on Drive's existing <input type=file>
// via DOM.setFileInputFiles (follow-up to drive-upload.mjs when the chooser event doesn't fire).
import { readdirSync } from 'fs';
import { resolve } from 'path';

const CDP_PORT = process.env.CDP_PORT || 9222;
const DELIV = resolve('projects/briefs/zero-touch-business/products/cleaning-kit/deliverables');
const files = readdirSync(DELIV)
  .filter(f => f.endsWith('.xlsx') || f.endsWith('.docx'))
  .map(f => resolve(DELIV, f));

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const tab = targets.find(t => t.type === 'page' && /drive\.google\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
};
await new Promise(r => { ws.onopen = r; });

await send('DOM.enable');
const doc = await send('DOM.getDocument');
const node = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
if (!node.nodeId) { console.error('No file input found.'); process.exit(1); }
await send('DOM.setFileInputFiles', { files, nodeId: node.nodeId });
console.log(`Injected ${files.length} files into Drive's input.`);

const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;
let done = false;
for (let i = 0; i < 90 && !done; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const txt = await evalJs(`(document.body.innerText.match(/\\d+ uploads? complete|Upload complete/i) || [''])[0]`);
  if (txt) { console.log(`Drive says: ${txt}`); done = true; }
}
if (!done) console.log('No completion banner in 3 min — check the window.');
ws.close();
