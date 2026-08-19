// Scroll the page with a synthesized wheel event. Unlike window.scrollTo this
// works over cross-origin iframes (the Shopify theme editor preview), because
// CDP dispatches it as real input rather than page JS.
//
// usage: node scripts/browser-scroll.mjs <deltaY> [x] [y]
const PORT = process.env.CDP_PORT || 9222;
const deltaY = Number(process.argv[2] || 1000);
const x = Number(process.argv[3] || 900);
const y = Number(process.argv[4] || 500);

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
const send = (method, params = {}) => new Promise(res => {
  const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});

// Several smaller ticks scroll more reliably than one large delta.
const steps = 10;
for (let i = 0; i < steps; i++) {
  await send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x, y, deltaX: 0, deltaY: deltaY / steps, pointerType: 'mouse'
  });
  await new Promise(r => setTimeout(r, 60));
}
console.log('scrolled', deltaY, 'at', x + ',' + y);
ws.close();
process.exit(0);
