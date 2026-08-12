// Probe: open a conversation and dump what the thread view actually renders,
// so the sender's "am I in the right thread" check can key on something real.
const CDP_PORT = 9222;
const HOME = 'https://secure.getjobber.com/home';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const query = process.argv[2] || '2063803393';

const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
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
await sleep(800);

await ev(`(()=>{const rows=document.querySelectorAll('[data-testid=conversations-list-item]');
  const p=rows[0].closest('div[class*=Xipkp], aside, section, div[role=dialog]')||rows[0].parentElement.parentElement.parentElement;
  const i=Array.from(p.querySelectorAll('input')).find(x=>x.type==='text'); i.focus(); i.select(); return 'ok';})()`);
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 46, key: 'Delete' });
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 46, key: 'Delete' });
await sleep(250);
await cdp.send('Input.insertText', { text: query });
await sleep(2200);

console.log('matched:', await ev(`(()=>{const r=Array.from(document.querySelectorAll('[data-testid=conversations-list-item]'));
  return r.length+' :: '+r.slice(0,3).map(x=>x.innerText.split('\\n')[0]).join(' | ')})()`));

await ev(`document.querySelectorAll('[data-testid=conversations-list-item]')[0].click()`);
await sleep(3000);

console.log(JSON.stringify(await ev(`(()=>{
  const ta=document.querySelector('textarea');
  const panel=ta?ta.closest('div[class*=Xipkp], aside, section, div[role=dialog]'):null;
  const scope=panel||document.body;
  const heads=Array.from(scope.querySelectorAll('h1,h2,h3,h4,[class*=head],[class*=title]'))
    .map(e=>(e.innerText||'').trim()).filter(Boolean).slice(0,6);
  return {hasTextarea:!!ta, headings:heads, panelStart:(scope.innerText||'').slice(0,300)};})()`), null, 2));

cdp.close();
