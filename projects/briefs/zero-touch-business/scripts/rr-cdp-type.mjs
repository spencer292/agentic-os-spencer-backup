#!/usr/bin/env node
// rr-cdp-type.mjs — type into whatever currently has focus, using Input.insertText.
// Needed for ProseMirror/contenteditable nodes (Gumroad's folder-name field), where
// setting .value does nothing and cdp.mjs `type` can't help.
//
// Usage: node .../rr-cdp-type.mjs --text "Route Ready — 14 Files" [--select-all]
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i === -1 ? d : argv[i + 1]; };
const PORT = arg('--port', '9222');
const TEXT = arg('--text');
const SELECT_ALL = argv.includes('--select-all');
if (!TEXT) { console.error('FAIL: pass --text'); process.exit(1); }

const targets = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = targets.find(t => t.type === 'page' && /gumroad/i.test(t.url)) || targets.find(t => t.type === 'page');
if (!page) { console.error('FAIL: no page target'); process.exit(1); }

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
  ws.addEventListener('error', () => rej(new Error('CDP websocket failed')), { once: true });
});

try {
  if (SELECT_ALL) {
    // Select only within the focused editable node, not the whole document.
    await send('Runtime.evaluate', {
      expression: `(function(){var el=document.activeElement; if(!el) return 'no-focus';
        var r=document.createRange(); r.selectNodeContents(el);
        var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); return 'selected';})()`,
      returnByValue: true,
    });
  }
  await send('Input.insertText', { text: TEXT });
  const after = await send('Runtime.evaluate', {
    expression: `(function(){var el=document.activeElement; return el ? (el.innerText||el.value||'').slice(0,60) : 'no-focus';})()`,
    returnByValue: true,
  });
  console.log(JSON.stringify({ status: 'TYPED', text: TEXT, focusedNow: after.result.value }));
} catch (e) {
  console.error('FAIL: ' + e.message);
  process.exitCode = 1;
} finally {
  ws.close();
}
process.exit(process.exitCode || 0);
