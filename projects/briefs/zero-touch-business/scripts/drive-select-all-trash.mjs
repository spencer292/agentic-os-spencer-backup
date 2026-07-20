// drive-select-all-trash.mjs — in the active Drive tab: click the first file row (trusted
// mouse event), Ctrl+A to select all, Delete to trash. Used to clear the just-uploaded
// Office copies before re-uploading with convert-to-Google-format enabled.
const CDP_PORT = process.env.CDP_PORT || 9222;
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
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;

// center of the first file row
const box = await evalJs(`(() => {
  const row = document.querySelector("tr[data-id][role='row']");
  if (!row) return null;
  const r = row.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + Math.min(r.height / 2, 40)) };
})()`);
if (!box) { console.error('No file rows found.'); process.exit(1); }

const mouse = async (type, opts = {}) => send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1, ...opts });
await mouse('mousePressed');
await mouse('mouseReleased');
await new Promise(r => setTimeout(r, 800));

// Ctrl+A (modifiers: 2 = Ctrl)
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
await new Promise(r => setTimeout(r, 800));
const selCount = await evalJs(`document.querySelectorAll("[aria-selected='true']").length`);
console.log(`Selected elements: ${selCount}`);

// Delete → trash
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
await new Promise(r => setTimeout(r, 2500));
const after = await evalJs(`(document.body.innerText.match(/moved to (the )?trash|\\d+ files? moved/i) || ['no-banner'])[0]`);
console.log(`Result: ${after}`);
ws.close();
