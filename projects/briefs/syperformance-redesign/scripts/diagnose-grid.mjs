// Why does the collection grid paint fewer cards than the server sent?
//
//   node scripts/diagnose-grid.mjs /collections/syp-billet
//
// Reports, for every card in the DOM: whether it has a laid-out box, what height
// it has, and whether its image has decoded. Distinguishes a real rendering bug
// from a headless-screenshot artefact, which a picture alone cannot do.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { BASE, authenticateNoPreview } from './_build-store.mjs';

const TARGET = BASE + (process.argv[2] || '/collections/syp-billet');
const SCROLL = !process.argv.includes('--no-scroll');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9344;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const { cdpCookies } = await authenticateNoPreview();

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-grid-profile')}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio', 'about:blank'
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { returnByValue: true, expression: expr })).result?.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
for (const c of cdpCookies) await send('Network.setCookie', c);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: TARGET });
for (let i = 0; i < 40; i++) {
  await sleep(500);
  if (await evaluate('document.readyState') === 'complete') break;
}
await sleep(2500);

const PROBE = `(function(){
  var items = [].slice.call(document.querySelectorAll('.product-grid__item'));
  var zero = 0, sized = 0, noImg = 0, undecoded = 0;
  items.forEach(function(li){
    var r = li.getBoundingClientRect();
    if (r.height < 5) zero++; else sized++;
    var img = li.querySelector('img');
    if (!img) { noImg++; return; }
    if (!img.complete || img.naturalWidth === 0) undecoded++;
  });
  var grid = document.querySelector('.product-grid');
  return {
    cardsInDom: items.length,
    withHeight: sized,
    zeroHeight: zero,
    cardsWithoutImg: noImg,
    imagesNotDecoded: undecoded,
    gridHeight: grid ? Math.round(grid.getBoundingClientRect().height) : null,
    bodyHeight: Math.round(document.body.scrollHeight),
    firstCardHeights: items.slice(0,8).map(function(li){ return Math.round(li.getBoundingClientRect().height); })
  };
})()`;

console.log('\nBEFORE any scroll:');
console.log(JSON.stringify(await evaluate(PROBE), null, 1));

if (SCROLL) {
  // Walk down the page the way a person would, letting lazy images and any
  // intersection-driven code fire.
  for (let y = 0; y < 12; y++) {
    await evaluate(`window.scrollBy(0, window.innerHeight * 0.9)`);
    await sleep(700);
  }
  await sleep(2500);
  console.log('\nAFTER scrolling to the bottom:');
  console.log(JSON.stringify(await evaluate(PROBE), null, 1));
}

chrome.kill();
process.exit(0);
