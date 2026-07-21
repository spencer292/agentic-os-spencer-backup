// inject-design-doc.mjs — attach the API design PDF to the Basic Access
// application form's <input type=file> via DOM.setFileInputFiles.
import { resolve } from 'path';

const CDP_PORT = process.env.CDP_PORT || 9222;
const PDF = resolve('projects/briefs/zero-touch-business/api-access/route-ready-ads-api-design.pdf');

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const tab = targets.find(t => t.type === 'page' && /support\.google\.com\/adspolicy/.test(t.url));
if (!tab) { console.error('Application form tab not found.'); process.exit(1); }

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
if (!node.nodeId) { console.error('No file input found on the form.'); process.exit(1); }
await send('DOM.setFileInputFiles', { files: [PDF], nodeId: node.nodeId });
console.log('Attached:', PDF);
process.exit(0);
