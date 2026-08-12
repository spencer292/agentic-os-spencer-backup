#!/usr/bin/env node
// find-thread.mjs — search the Jobber message center and list matching conversations.
// Read-only: it searches and reads the LIST. It never opens a thread, so it cannot affect
// account-wide read state.
//
//   node projects/briefs/jobber-text-automation/scripts/find-thread.mjs "Doud"
//   node projects/briefs/jobber-text-automation/scripts/find-thread.mjs "4015784395"
const CDP_PORT = 9222;
const HOME = 'https://secure.getjobber.com/home';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const query = process.argv.slice(2).join(' ');
if (!query) { console.error('Usage: find-thread.mjs <name or phone>'); process.exit(1); }

const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
if (!page) { console.error('No page target — run: node browser/launch.mjs'); process.exit(1); }

const cdp = await new Promise((resolve, reject) => {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); } });
  ws.addEventListener('error', reject);
  ws.addEventListener('open', () => resolve({
    send: (m, p = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method: m, params: p })); }),
    close: () => ws.close() }));
});
await cdp.send('Runtime.enable');
const ev = async x => { const r = await cdp.send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };

await ev(`location.href=${JSON.stringify(HOME)}`); await sleep(3500);
await ev(`(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<25;i++){ if(document.querySelectorAll('[data-testid=conversations-list-item]').length) return 'open';
  const t=document.querySelector('button[data-testid="open-message-center"]'); if(t)t.click(); await w(400);} return 'fail';})()`);
await sleep(600);

await ev(`(()=>{const rows=document.querySelectorAll('[data-testid=conversations-list-item]');
  const p=rows[0].closest('div[class*=Xipkp], aside, section, div[role=dialog]')||rows[0].parentElement.parentElement.parentElement;
  const i=Array.from(p.querySelectorAll('input')).find(x=>x.type==='text'); i.focus(); i.select(); return 'ok';})()`);
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 46, key: 'Delete' });
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 46, key: 'Delete' });
await sleep(250);
await cdp.send('Input.insertText', { text: query });
await sleep(2500);

const rows = await ev(`(()=>Array.from(document.querySelectorAll('[data-testid=conversations-list-item]')).map(r=>{
  const L=r.innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
  return {head:L[0], body:L.slice(1,-1).join(' ').slice(0,110), ts:L[L.length-1]};}))()`);

console.log(`\n  "${query}" → ${rows.length} conversation(s)\n`);
rows.forEach(r => console.log(`  ${r.head}\n    ${r.ts}  |  ${r.body}\n`));
cdp.close();
