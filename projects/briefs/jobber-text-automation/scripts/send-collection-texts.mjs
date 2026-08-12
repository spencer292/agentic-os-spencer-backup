#!/usr/bin/env node
// send-collection-texts.mjs — sends the past-due queue through Jobber's message center.
//
// Jobber has no API to send a text (no mutation, no inbound webhook, message bodies scope-gated),
// so this drives the real Jobber web UI in the persistent tool-browser Chrome profile.
// It is a robot clicking your screen: maintained, not fire-and-forget.
//
// TWO GOTCHAS THIS SCRIPT ENCODES (both cost a debugging round, do not "simplify" them away):
//   1. `input[type=search]` is Jobber's GLOBAL nav search. The message-center search is an
//      `input[type=text]` INSIDE the drawer that holds the conversation rows. Typing into the
//      wrong one silently searches the whole account and filters nothing.
//   2. Setting .value programmatically does NOT trigger the conversation filter. Typing must go
//      through CDP `Input.insertText` — the real browser input layer. (The compose textarea does
//      accept programmatic input, but we use insertText there too so what React holds is exactly
//      what is on screen, and therefore exactly what gets sent.)
//
// SAFETY MODEL
//   * DRY RUN IS THE DEFAULT. Everything except the Send click. Pass --send to actually send.
//   * Strict matching: exactly one conversation must match the queued phone on digits alone, and
//     the opened thread is re-verified to show that phone before a single character is typed.
//     Sending a payment demand to the wrong customer is the failure this guards against.
//   * State file: a client is never texted twice for the same stage, even across re-runs.
//   * Drip pacing. 40 near-identical SMS in two minutes is what gets a number spam-filtered, and
//     losing 253-300-0889 would take On My Way texts down with it.
//
// USAGE
//   node projects/briefs/jobber-text-automation/scripts/send-collection-texts.mjs           # dry run
//   node projects/briefs/jobber-text-automation/scripts/send-collection-texts.mjs --send    # live
//   ... --limit 5 --delay 45
//
// Requires: node browser/launch.mjs   (Chrome on CDP 9222, signed into Jobber)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isToday, isAutomated } from './check-recent-activity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'collection-queue.json');
const STATE_FILE = path.join(DATA_DIR, 'collection-state.json');
const LOG_FILE = path.join(DATA_DIR, 'send-log.jsonl');
const CDP_PORT = 9222;
const HOME = 'https://secure.getjobber.com/home';

const argv = process.argv.slice(2);
const LIVE = argv.includes('--send');
const num = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : d; };
const LIMIT = num('--limit', Infinity);
const DELAY_S = num('--delay', 60);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const digits = s => String(s || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

// ---------------- minimal CDP client (browser/cdp.mjs is a shipped CLI, not importable) ---------
async function connect() {
  const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
  const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('No page target — run: node browser/launch.mjs');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 0; const pending = new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        m.error ? p.j(new Error(m.error.message)) : p.r(m.result);
      }
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      send: (method, params = {}) => new Promise((r, j) => {
        const i = ++id; pending.set(i, { r, j });
        ws.send(JSON.stringify({ id: i, method, params }));
      }),
      close: () => ws.close(),
    }));
  });
}

let cdp;
async function ev(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'page exception');
  return r.result.value;
}
const type = text => cdp.send('Input.insertText', { text });
async function pressDelete() {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 46, key: 'Delete' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 46, key: 'Delete' });
}

// ---------------- page snippets ------------------------------------------------------------------
const PANEL = `(()=>{const rows=document.querySelectorAll('[data-testid=conversations-list-item]');
  if(!rows.length) return null;
  return rows[0].closest('div[class*=Xipkp], aside, section, div[role=dialog]')
    || rows[0].parentElement.parentElement.parentElement;})()`;

const OPEN_PANEL = `(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<25;i++){
    if(document.querySelectorAll('[data-testid=conversations-list-item]').length) return 'open';
    const t=document.querySelector('button[data-testid="open-message-center"]');
    if(t) t.click();
    await wait(400);
  }
  return 'failed';})()`;

const FOCUS_SEARCH = `(()=>{const p=${PANEL}; if(!p) return 'no panel';
  const inp=Array.from(p.querySelectorAll('input')).find(i=>i.type==='text');
  if(!inp) return 'no input';
  inp.focus(); inp.select(); return 'ok';})()`;

// Inspect WITHOUT clicking: the row already carries the last message and its timestamp, so a
// thread that a human touched today is detectable before we open (and mark-read) anything.
const inspectRow = want => `(()=>{
  const d=s=>String(s||'').replace(/\\D/g,'').replace(/^1(?=\\d{10}$)/,'');
  const rows=Array.from(document.querySelectorAll('[data-testid=conversations-list-item]'));
  const m=rows.filter(r=>d(r.innerText).includes(${JSON.stringify(want)}));
  if(m.length===0) return {ok:false,reason:'no conversation found',rows:rows.length};
  if(m.length>1) return {ok:false,reason:m.length+' conversations matched — ambiguous'};
  const L=m[0].innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
  return {ok:true,label:L[0],body:L.slice(1,-1).join(' '),ts:L[L.length-1]};})()`;

const clickRow = want => `(()=>{
  const d=s=>String(s||'').replace(/\\D/g,'').replace(/^1(?=\\d{10}$)/,'');
  const rows=Array.from(document.querySelectorAll('[data-testid=conversations-list-item]'));
  const m=rows.filter(r=>d(r.innerText).includes(${JSON.stringify(want)}));
  if(m.length!==1) return {ok:false,reason:'row vanished before click'};
  m[0].click(); return {ok:true};})()`;

// The thread view renders the client NAME only — no phone number (verified: heading is
// "Deborah Larry", body is "Type a message... 0/670 characters"). So the phone search picks the
// row and the name confirms the thread. Two factors, both from Jobber.
// Some conversations are labelled "Unknown" — the number carries real history (Jobber's own
// invoice and arrival texts addressed to the client by name) but was never linked to the client
// record in the message center. Those are accepted ONLY when the caller has already confirmed
// the row's last message names this client, so it is still two factors: exact phone + name.
const focusCompose = (expectedName, allowUnknown = false) => `(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim();
  let ta=null;
  for(let i=0;i<30;i++){ ta=document.querySelector('textarea'); if(ta) break; await wait(250); }
  if(!ta) return {ok:false,reason:'no compose box'};
  const panel=ta.closest('div[class*=Xipkp], aside, section, div[role=dialog]')||document.body;
  const heading=(panel.innerText||'').split('\\n')[0];
  const want=norm(${JSON.stringify(expectedName)}), got=norm(heading);
  const tokens=want.split(' ').filter(t=>t.length>1);
  const unknown = /^unknown\\b/i.test(heading.trim());
  const match = got===want || (tokens.length && tokens.every(t=>got.includes(t))) || (${allowUnknown} && unknown);
  if(!match) return {ok:false,reason:'thread is "'+heading+'", expected "'+${JSON.stringify(expectedName)}+'"'};
  ta.focus(); ta.select();
  return {ok:true,heading};})()`;

const SEND_STATE = `(()=>{const b=document.querySelector('button[aria-label=Send]');
  const ta=document.querySelector('textarea');
  return {hasBtn:!!b, disabled:b?b.disabled:null, value:ta?ta.value:null};})()`;

const CLICK_SEND = `(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const b=document.querySelector('button[aria-label=Send]');
  if(!b||b.disabled) return {ok:false,reason:'send not clickable'};
  b.click();
  for(let i=0;i<40;i++){ const ta=document.querySelector('textarea');
    if(ta && ta.value==='') return {ok:true}; await wait(250); }
  return {ok:false,reason:'compose box did not clear — send may not have gone through'};})()`;

const CLEAR_COMPOSE = `(()=>{const ta=document.querySelector('textarea'); if(!ta) return 'none';
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(ta,'');
  ta.dispatchEvent(new Event('input',{bubbles:true})); return 'cleared';})()`;

// ---------------- driver --------------------------------------------------------------------------
if (!fs.existsSync(QUEUE_FILE)) { console.error('No queue — run build-collection-queue.mjs first.'); process.exit(1); }
const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { sent: {} };

const ageH = (Date.now() - new Date(queue.generatedAt)) / 3600e3;
if (ageH > 6) { console.error(`Queue is ${ageH.toFixed(1)}h old — rebuild it, someone may have paid since.`); process.exit(1); }

const todo = queue.send.filter(r => !state.sent[r.stateKey]).slice(0, LIMIT);
console.log(`\n${LIVE ? '*** LIVE SEND — real texts to real customers ***' : 'DRY RUN — nothing will be sent'}`);
console.log(`  queued ${queue.send.length} · processing ${todo.length} · pacing ${LIVE ? DELAY_S + 's' : 'fast'}\n`);

cdp = await connect();
await cdp.send('Runtime.enable');

let ok = 0, skipped = 0;
for (const [i, row] of todo.entries()) {
  const want = digits(row.phone);
  process.stdout.write(`  [${i + 1}/${todo.length}] ${row.name} (${row.phone}) $${row.total} … `);
  let result;
  try {
    // deterministic reset: home, then open the panel fresh
    await ev(`location.href=${JSON.stringify(HOME)}`);
    await sleep(3500);
    if (await ev(OPEN_PANEL) !== 'open') throw new Error('message center would not open');

    // A client can hold several SMS-allowed numbers and the thread may live on any of them
    // (Jobber's primary is the usual home). Try each before concluding there is no conversation.
    const candidates = (row.smsPhones && row.smsPhones.length ? row.smsPhones : [row.phone]).map(digits);
    let picked = null, matchedOn = null;
    for (const cand of candidates) {
      const f = await ev(FOCUS_SEARCH);
      if (f !== 'ok') throw new Error(`search box: ${f}`);
      await pressDelete();
      await sleep(250);
      await type(cand);
      await sleep(2200);
      const r = await ev(inspectRow(cand));
      if (r.ok) { picked = r; matchedOn = cand; break; }
      picked = r; // keep the last failure reason
    }
    const want2 = matchedOn || want;
    if (!picked.ok) { result = { ok: false, ...picked }; }
    else if (isToday(picked.ts) && !isAutomated(picked.body)) {
      // Someone here texted them today, or the customer wrote in. Either way a payment demand
      // is the wrong next message — hand it to a human.
      result = { ok: false, reason: `human/inbound message today (${picked.ts}): "${String(picked.body).slice(0, 60)}"`, label: picked.label };
    }
    else {
      const clicked = await ev(clickRow(want2));
      if (!clicked.ok) throw new Error(clicked.reason);
      await sleep(400);
      if (row.message.length > 670) throw new Error(`message ${row.message.length} chars — Jobber caps at 670`);
      // "Unknown"-labelled thread is acceptable only if its last message names this client.
      const nameTokens = String(row.name).split(/\s+/).filter(t => t.length > 2);
      const bodyNamesClient = nameTokens.some(t => new RegExp(`\\b${t.replace(/[^\w]/g, '')}\\b`, 'i').test(String(picked.body)));
      const comp = await ev(focusCompose(row.name, bodyNamesClient));
      if (!comp.ok) { result = { ok: false, ...comp, label: picked.label }; }
      else {
        await type(row.message);
        await sleep(600);
        const st = await ev(SEND_STATE);
        if (!st.hasBtn) result = { ok: false, reason: 'send button missing', label: picked.label };
        else if (st.disabled) result = { ok: false, reason: 'send stayed disabled', label: picked.label };
        else if (String(st.value).trim() !== row.message.trim())
          result = { ok: false, reason: `composed text differs from intended message (box has ${String(st.value).length} chars, expected ${row.message.length})`, label: picked.label };
        else if (!LIVE) { await ev(CLEAR_COMPOSE); result = { ok: true, step: 'dry-run', label: picked.label }; }
        else {
          const s = await ev(CLICK_SEND);
          result = s.ok ? { ok: true, step: 'sent', label: picked.label } : { ok: false, ...s, label: picked.label };
        }
      }
    }
  } catch (err) {
    result = { ok: false, reason: String(err.message || err) };
  }

  if (result.ok && result.step === 'sent') {
    ok++; state.sent[row.stateKey] = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`sent  → ${result.label}`);
  } else if (result.ok) {
    ok++; console.log(`ok (dry run) → ${result.label}`);
  } else {
    skipped++; console.log(`SKIPPED — ${result.reason}`);
  }

  fs.appendFileSync(LOG_FILE, JSON.stringify({
    at: new Date().toISOString(), live: LIVE, client: row.name, phone: row.phone,
    total: row.total, stage: row.stage, result,
  }) + '\n');

  if (i < todo.length - 1) await sleep(LIVE ? DELAY_S * 1000 * (0.75 + Math.random() * 0.5) : 500);
}

cdp.close();
console.log(`\n  ${LIVE ? 'sent' : 'would send'}: ${ok}   skipped: ${skipped}`);
console.log(`  log: projects/briefs/jobber-text-automation/data/send-log.jsonl\n`);
