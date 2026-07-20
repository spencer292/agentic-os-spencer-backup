// drive-trash-v2.mjs — range-select all file rows (click first, Shift+click last), then Delete.
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

const rows = await evalJs(`(() => {
  const rs = [...document.querySelectorAll("tr[data-id][role='row']")];
  return rs.map(r => { const b = r.getBoundingClientRect(); return { x: Math.round(b.x + 200), y: Math.round(b.y + b.height / 2) }; });
})()`);
console.log(`File rows found: ${rows.length}`);
if (!rows.length) process.exit(1);

const click = async (pt, modifiers = 0) => {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1, modifiers });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1, modifiers });
  await new Promise(r => setTimeout(r, 500));
};

await click(rows[0]);
await click(rows[rows.length - 1], 8); // Shift
const sel = await evalJs(`document.querySelectorAll("tr[aria-selected='true']").length`);
console.log(`Rows selected: ${sel}`);

await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
await new Promise(r => setTimeout(r, 3000));
const remaining = await evalJs(`document.querySelectorAll("tr[data-id][role='row']").length`);
console.log(`Rows remaining after delete: ${remaining}`);
ws.close();
