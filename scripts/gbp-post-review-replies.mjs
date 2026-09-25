// Post replies to Google Business Profile reviews through the signed-in Chrome window.
//
//   node browser/launch.mjs
//   node scripts/gbp-post-review-replies.mjs --file replies.json [--authuser 0] [--dry]
//
// replies.json: [{ "id": "<review card key>", "author": "...", "reply": "..." }, ...]
// (ids come from scripts/gbp-pull-review-feed.mjs)
//
// Sequence per review (see context/learnings.md -> ## tool-browser):
//   click the button whose text ENDS WITH "Reply" -> wait -> focus()+select() the card's
//   textarea -> Ctrl+A then Input.insertText (setting .value does NOT stick on Google's
//   controlled textarea) -> read the textarea back and compare -> click "Post reply".
//
// IMPORTANT: this script's own verdict is NOT ground truth. Google lags on propagation and
// reports false negatives. NEVER retry on a failure reported here alone — re-pull the feed
// (gbp-pull-review-feed.mjs) and check `unreplied` there. A retry on a false negative is how
// a double-post happens.
import fs from 'node:fs';

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const DRY = argv.includes('--dry');
const FILE = flag('file');
const AUTHUSER = flag('authuser', '0');
const MAXPAGES = Number(flag('pages', 8));
if (!FILE) { console.error('--file replies.json is required'); process.exit(1); }

const replies = JSON.parse(fs.readFileSync(FILE, 'utf8'));

class CDP {
  constructor(ws) { this.wsUrl = ws; this.id = 0; this.pending = new Map(); }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => res();
      this.ws.onerror = () => rej(new Error('WebSocket connection to Chrome failed — run node browser/launch.mjs'));
      this.ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res: r, rej: j } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) j(new Error(msg.error.message)); else r(msg.result);
        }
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  close() { try { this.ws.close(); } catch {} }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(String(s));

async function evalJs(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

const card = (id) => `document.querySelector('.DsOcnf[key=${q(id)}]')`;

async function findCardPage(cdp, id) {
  // walk the paginated feed from page 1 until the card with this id is on screen
  for (let p = 1; p <= MAXPAGES; p++) {
    const found = await evalJs(cdp, `!!${card(id)}`);
    if (found) return p;
    const moved = await evalJs(cdp, `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Next');if(!b||b.disabled)return false;b.click();return true;})()`);
    if (!moved) return 0;
    await sleep(2500);
  }
  return 0;
}

(async () => {
  const targets = await (await fetch(`${BASE}/json`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target — run node browser/launch.mjs');
  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.connect();
  const results = [];

  try {
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: `https://business.google.com/u/${AUTHUSER}/reviews` });
    await sleep(5000);

    for (const r of replies) {
      const label = `${r.author}`;
      const onPage = await findCardPage(cdp, r.id);
      if (!onPage) { console.log(`SKIP  ${label} — card not found in the first ${MAXPAGES} pages`); results.push({ ...r, status: 'not-found' }); continue; }

      const state = await evalJs(cdp, `(()=>{const c=${card(r.id)};const b=[...c.querySelectorAll('button')].map(x=>x.innerText.trim());return {replied:b.some(x=>/^Edit$/i.test(x)),open:b.some(x=>/Reply$/i.test(x))};})()`);
      if (state.replied) { console.log(`SKIP  ${label} — already has a reply`); results.push({ ...r, status: 'already-replied' }); continue; }
      if (!state.open) { console.log(`SKIP  ${label} — no Reply button on the card`); results.push({ ...r, status: 'no-button' }); continue; }
      if (DRY) { console.log(`DRY   ${label} — would post ${r.reply.length} chars`); results.push({ ...r, status: 'dry' }); continue; }

      // 1. open the reply box
      await evalJs(cdp, `(()=>{const c=${card(r.id)};const b=[...c.querySelectorAll('button')].find(x=>/Reply$/i.test(x.innerText.trim()));b.scrollIntoView({block:'center'});b.click();return true;})()`);
      await sleep(1200);

      // 2. focus the textarea and select whatever is in it
      const focused = await evalJs(cdp, `(()=>{const c=${card(r.id)};const t=c.querySelector('textarea');if(!t)return false;t.focus();t.select();return true;})()`);
      if (!focused) { console.log(`FAIL  ${label} — textarea never appeared`); results.push({ ...r, status: 'no-textarea' }); continue; }

      // 3. Ctrl+A then insertText (setting .value does not stick)
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, modifiers: 2, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
      }
      await cdp.send('Input.insertText', { text: r.reply });
      await sleep(600);

      // 4. read back before submitting
      const got = await evalJs(cdp, `(()=>{const c=${card(r.id)};const t=c.querySelector('textarea');return t?t.value:'';})()`);
      if (got.trim() !== r.reply.trim()) {
        console.log(`FAIL  ${label} — textarea mismatch, not submitting (got ${got.length} of ${r.reply.length} chars)`);
        results.push({ ...r, status: 'mismatch', got });
        continue;
      }

      // 5. submit
      const posted = await evalJs(cdp, `(()=>{const c=${card(r.id)};const b=[...c.querySelectorAll('button')].find(x=>x.innerText.trim()==='Post reply');if(!b)return false;b.click();return true;})()`);
      if (!posted) { console.log(`FAIL  ${label} — no "Post reply" button`); results.push({ ...r, status: 'no-submit' }); continue; }
      await sleep(2500);

      const after = await evalJs(cdp, `(()=>{const c=${card(r.id)};if(!c)return 'card-gone';const b=[...c.querySelectorAll('button')].map(x=>x.innerText.trim());return b.some(x=>/^Edit$/i.test(x))?'edit':'still-reply';})()`);
      console.log(`POST  ${label} — submitted (card now: ${after})`);
      results.push({ ...r, status: 'submitted', after });
      await sleep(2500);
    }
  } finally {
    cdp.close();
  }

  const n = results.filter((x) => x.status === 'submitted').length;
  console.log(`\n${n}/${replies.length} submitted. Verify with a fresh re-pull — do not retry on this output alone.`);
})();
