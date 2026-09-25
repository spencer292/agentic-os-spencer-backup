// Pull the Google Business Profile review feed (all 3 Got Moles locations arrive in ONE
// paginated list, 10 per page) out of the already-signed-in Chrome window driven by
// browser/launch.mjs, and write it to JSON.
//
//   node browser/launch.mjs                       # window must be up + signed in
//   node scripts/gbp-pull-review-feed.mjs --pages 6 --out path.json
//
// Flags:
//   --pages N   how many pages of 10 to walk (default 6)
//   --authuser  which Google account index to open (default 0 = spencer@got-moles.com)
//   --out FILE  where to write (default projects/str-gbp-optimization/reviews/<date>_review-feed.json)
//   --no-goto   use the page as it already is (don't navigate / reset to page 1)
//
// DOM map (see context/learnings.md -> ## tool-browser):
//   .DsOcnf   review card, keyed by review id on `key`
//   .rRqL5e   business name      .ijHgsc  street address (tells the 3 profiles apart)
//   .LH5kS    author             .Xl7c2c > .MOLvNc  filled stars
//   .zWmYWd   relative date      blockquote .oiQd1c  review text
//   Unreplied = the card carries a "Reply" button instead of "Edit".
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const has = (n) => argv.includes(`--${n}`);

const PAGES = Number(flag('pages', 6));
const AUTHUSER = flag('authuser', '0');
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
const OUT = flag('out', `projects/str-gbp-optimization/reviews/${today}_review-feed.json`);

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
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalJs(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

const EXTRACT = `(() => {
  const txt = (el, s) => { const n = el.querySelector(s); return n ? n.innerText.trim() : ''; };
  return [...document.querySelectorAll('.DsOcnf')].map(card => {
    const btns = [...card.querySelectorAll('button')].map(b => b.innerText.trim());
    return {
      id: card.getAttribute('key') || '',
      business: txt(card, '.rRqL5e'),
      address: txt(card, '.ijHgsc'),
      author: txt(card, '.LH5kS'),
      stars: card.querySelectorAll('.Xl7c2c .MOLvNc').length,
      date: txt(card, '.zWmYWd'),
      text: txt(card, 'blockquote .oiQd1c'),
      replied: btns.some(b => /^Edit$/i.test(b)),
      unreplied: btns.some(b => /Reply$/i.test(b)),
      buttons: btns.filter(Boolean),
    };
  });
})()`;

const EXPAND = `(() => {
  const more = [...document.querySelectorAll('button')].filter(b => /^More$/i.test(b.innerText.trim()));
  more.forEach(b => b.click());
  return more.length;
})()`;

const NEXT = `(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Next');
  if (!b || b.disabled) return false;
  b.click();
  return true;
})()`;

(async () => {
  const targets = await (await fetch(`${BASE}/json`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target — run node browser/launch.mjs');
  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.connect();

  try {
    if (!has('no-goto')) {
      await cdp.send('Page.enable');
      await cdp.send('Page.navigate', { url: `https://business.google.com/u/${AUTHUSER}/reviews` });
      await sleep(5000);
    }

    const seen = new Map();
    for (let p = 1; p <= PAGES; p++) {
      await evalJs(cdp, EXPAND);
      await sleep(900);
      const rows = await evalJs(cdp, EXTRACT);
      if (!rows.length) { console.error(`page ${p}: 0 cards — wrong account or feed not loaded`); break; }
      rows.forEach((r) => { if (!seen.has(r.id || `${r.author}|${r.date}`)) seen.set(r.id || `${r.author}|${r.date}`, { ...r, page: p }); });
      const open = rows.filter((r) => r.unreplied).length;
      console.error(`page ${p}: ${rows.length} cards, ${open} unreplied  (${rows[0].author} … ${rows[rows.length - 1].date})`);
      if (p === PAGES) break;
      const moved = await evalJs(cdp, NEXT);
      if (!moved) { console.error('no Next button — end of feed'); break; }
      await sleep(2500);
    }

    const all = [...seen.values()];
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ scrapedAt: new Date().toISOString(), authuser: AUTHUSER, count: all.length, reviews: all }, null, 2));
    const open = all.filter((r) => r.unreplied);
    console.error(`\n${all.length} reviews pulled, ${open.length} unreplied -> ${OUT}`);
  } finally {
    cdp.close();
  }
})();
