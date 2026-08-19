// Capture every network request on a page, grouped by host + path, to identify
// which apps/pixels are injecting scripts. No installs; drives installed Chrome via CDP.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const URL_ = process.argv[2] || 'https://syperformance.net/products/k-series-single-lobe-billet-rockers';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-reqmap-profile')}`, '--no-first-run',
  '--disable-gpu', '--mute-audio', 'about:blank'], { stdio: 'ignore' });

for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(500); }

const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const reqs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Network.requestWillBeSent') reqs.push({ url: m.params.request.url, type: m.params.type, initiator: m.params.initiator?.type });
  else if (m.method === 'Network.loadingFinished') { const r = reqs.find(x => x.id === m.params.requestId); }
});
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Network.enable');
await send('Page.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.navigate', { url: URL_ });
await sleep(12000);

const byHost = {};
for (const r of reqs) {
  let h; try { h = new URL(r.url).host; } catch { continue; }
  byHost[h] = byHost[h] || { n: 0, types: {}, samples: [] };
  byHost[h].n++;
  byHost[h].types[r.type] = (byHost[h].types[r.type] || 0) + 1;
  if (byHost[h].samples.length < 4) byHost[h].samples.push(r.url.slice(0, 140));
}
console.log('URL:', URL_, '| total requests:', reqs.length, '\n');
Object.entries(byHost).sort((a, b) => b[1].n - a[1].n).forEach(([h, v]) => {
  console.log(String(v.n).padStart(4) + '  ' + h + '   ' + JSON.stringify(v.types));
  v.samples.forEach(s => console.log('        ' + s));
});
fs.writeFileSync(new URL('../data/request-map.json', import.meta.url), JSON.stringify({ url: URL_, total: reqs.length, byHost }, null, 2));
chrome.kill();
process.exit(0);
