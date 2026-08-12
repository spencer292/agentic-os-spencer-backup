#!/usr/bin/env node
// check-recent-activity.mjs — for every client in the send queue, read their conversation row
// (name, last message preview, timestamp) WITHOUT opening the thread.
//
// Why this exists: the robot's state file only knows what the robot sent. On 2026-08-11 Spencer
// had already texted three queued clients by hand that morning, and nothing in the system knew.
// The conversation LIST carries the last message and its time, so same-day human activity is
// detectable at zero cost — and without opening threads, which would clobber account-wide
// read state for the whole office.
//
// Classification of the last message:
//   automated  -> matches a known Jobber template (On My Way, quote, invoice)
//   human/inbound -> anything else. Either a person here wrote it, or the customer replied.
//                    Both are reasons NOT to fire a payment demand at them today.
//
//   node projects/briefs/jobber-text-automation/scripts/check-recent-activity.mjs
//   ... --json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'collection-queue.json');
const CDP_PORT = 9222;
const HOME = 'https://secure.getjobber.com/home';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const digits = s => String(s || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

// Jobber's own automated outbound. Anything NOT matching these was written by a person.
export const AUTOMATION = [
  /^hello!?\s*this is got moles\.\s*we will arrive/i,          // On My Way
  /it'?s got moles!?\b[\s\S]{0,60}will arrive today/i,          // arrival-window text
  /here'?s your (quote|invoice|receipt) from/i,
  /^got moles.{0,40}(appointment|reminder|scheduled)/i,
];
export const isAutomated = body => AUTOMATION.some(re => re.test(String(body || '').trim()));

// Jobber shows a BARE TIME ("4:50 PM") for anything in the last ~24 HOURS — not for the calendar
// day. Proven 2026-08-11: a row read "4:50 PM" at 4:32 PM local, which is impossible for today,
// and the same row flipped to a day-name format once it aged past 24h.
//
// So this cannot answer "was it today". It answers "was it recent", and that is the right
// question anyway: do not fire a payment demand at someone a human messaged within the last day.
// Named accordingly. `isToday` is kept as an alias so older callers do not silently change meaning.
export const isRecent = ts => {
  const t = String(ts || '').trim();
  if (/^just now$/i.test(t)) return true;
  if (/\b(second|minute|hour)s?\s+ago$/i.test(t)) return true;
  if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(t)) return true;   // within ~24h, today OR yesterday
  return false;                                             // "Yesterday", "Mon", "Aug 8" => older
};
export const isToday = isRecent;

async function connect() {
  const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
  const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('No page target — run: node browser/launch.mjs');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 0; const pending = new Map();
    ws.addEventListener('message', e => { const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); } });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      send: (m, p = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method: m, params: p })); }),
      close: () => ws.close() }));
  });
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('check-recent-activity.mjs')) {
  const asJson = process.argv.includes('--json');
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const cdp = await connect();
  await cdp.send('Runtime.enable');
  const ev = async x => { const r = await cdp.send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };

  await ev(`location.href=${JSON.stringify(HOME)}`); await sleep(3500);
  await ev(`(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<25;i++){ if(document.querySelectorAll('[data-testid=conversations-list-item]').length) return 'open';
    const t=document.querySelector('button[data-testid="open-message-center"]'); if(t)t.click(); await w(400);} return 'fail';})()`);

  // The panel's virtualized list degrades after a dozen or so consecutive searches and starts
  // returning zero rows. Navigating home and reopening it is the only reliable reset.
  const OPEN = `(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<25;i++){ if(document.querySelectorAll('[data-testid=conversations-list-item]').length) return 'open';
    const t=document.querySelector('button[data-testid="open-message-center"]'); if(t)t.click(); await w(400);} return 'fail';})()`;
  const resetPanel = async () => {
    await ev(`location.href=${JSON.stringify(HOME)}`);
    await sleep(3500);
    return ev(OPEN);
  };

  const searchFor = async (want) => {
    const focused = await ev(`(()=>{const rows=document.querySelectorAll('[data-testid=conversations-list-item]');
      if(!rows.length) return 'no-rows';
      const p=rows[0].closest('div[class*=Xipkp], aside, section, div[role=dialog]')||rows[0].parentElement.parentElement.parentElement;
      const inp=Array.from(p.querySelectorAll('input')).find(x=>x.type==='text');
      if(!inp) return 'no-input';
      inp.focus(); inp.select(); return 'ok';})()`);
    if (focused !== 'ok') return null;
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 46, key: 'Delete' });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 46, key: 'Delete' });
    await sleep(200);
    await cdp.send('Input.insertText', { text: want });
    await sleep(1600);
    return ev(`(()=>{
      const d=s=>String(s||'').replace(/\\D/g,'').replace(/^1(?=\\d{10}$)/,'');
      const rows=Array.from(document.querySelectorAll('[data-testid=conversations-list-item]'));
      const m=rows.filter(r=>d(r.innerText).includes(${JSON.stringify(want)}));
      if(m.length!==1) return {count:m.length};
      const L=m[0].innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
      return {count:1, head:L[0], body:L.slice(1,-1).join(' '), ts:L[L.length-1]};})()`);
  };

  const results = [];
  for (const [i, row] of queue.send.entries()) {
    const want = digits(row.phone);
    let found = await searchFor(want);
    // zero rows can mean "genuinely no conversation" OR a stale panel — reset once and retry
    // before believing it, otherwise a degraded panel reads as 26 missing customers.
    if (!found || found.count === 0) {
      await resetPanel();
      found = await searchFor(want) || { count: 0 };
    }

    const r = { client: row.name, phone: row.phone, total: row.total, stateKey: row.stateKey, ...found };
    r.today = found.count === 1 ? isToday(found.ts) : null;
    r.automated = found.count === 1 ? isAutomated(found.body) : null;
    r.hold = Boolean(r.today && r.automated === false);
    results.push(r);
    if (!asJson) {
      const flag = found.count !== 1 ? `no unique match (${found.count})` : r.hold ? 'HOLD — human/inbound today' : r.today ? 'today, automated' : 'clear';
      console.log(`  ${String(i + 1).padStart(2)}. ${row.name.padEnd(22)} ${String(found.ts || '').padEnd(16)} ${flag}`);
      if (r.hold) console.log(`      last: "${String(found.body).slice(0, 90)}"`);
    }
    await sleep(300);
  }
  cdp.close();

  fs.writeFileSync(path.join(DATA_DIR, 'recent-activity.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  if (asJson) console.log(JSON.stringify(results, null, 2));
  const holds = results.filter(r => r.hold);
  console.log(`\n  ${results.length} checked · ${holds.length} to HOLD · ${results.filter(r => r.count !== 1).length} unmatched`);
  console.log(`  wrote data/recent-activity.json\n`);
}
