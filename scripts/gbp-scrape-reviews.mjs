// Scrape every Google review (verbatim + author) from the Got Moles GBP listings.
// Drives the already-running CDP Chrome from browser/launch.mjs. Node 22+, zero deps.
//
//   node browser/launch.mjs
//   node scripts/gbp-scrape-reviews.mjs
//
// Writes projects/str-gbp-optimization/reviews/<date>_google-reviews.json

import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;

const PLACES = [
  {
    key: 'enumclaw',
    label: 'Got Moles? — Enumclaw / South King County',
    url: 'https://www.google.com/maps/place/Got+Moles%3F/data=!4m7!3m6!1s0x5490f1fee3d3718b:0xbc9854b23bfe0468!8m2!3d47.201231!4d-121.985891!16s%2Fg%2F11q_93_wmr!19sChIJi3HT4_7xkFQRaAT-O7JUmLw?authuser=0&hl=en',
  },
  {
    key: 'seatac',
    label: 'Got Moles? — SeaTac / Burien area',
    url: 'https://www.google.com/maps/place/Got+Moles%3F/data=!4m7!3m6!1s0x549043ad8e7a2a2d:0x59d76715598a1852!8m2!3d47.4691328!4d-122.2525965!16s%2Fg%2F11sx3dwk_0!19sChIJLSp6jq1DkFQRUhiKWRVn11k?authuser=0&hl=en',
  },
  {
    key: 'tacoma',
    label: 'Got Moles? — Tacoma / University Place area',
    url: 'https://www.google.com/maps/place/Got+Moles%3F/data=!4m7!3m6!1s0x54905585692a093b:0xb0ba48d153346f53!8m2!3d47.2385533!4d-122.44074!16s%2Fg%2F11v4lwfjfj!19sChIJOwkqaYVVkFQRU280U9FIurA?authuser=0&hl=en',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPageTarget() {
  const r = await fetch(`${BASE}/json`);
  const targets = await r.json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('No page target — run: node browser/launch.mjs');
  return page;
}

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => res();
      this.ws.onerror = () => rej(new Error('WebSocket connection to Chrome failed'));
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

async function evalJs(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
}

async function goto(cdp, url) {
  await cdp.send('Page.navigate', { url });
  await sleep(5000);
}

// --- in-page helpers (stringified, run inside Maps) ---------------------------

const JS_OPEN_REVIEWS = `(() => {
  const btns = Array.from(document.querySelectorAll('button, [role=tab]'));
  const tab = btns.find(b => {
    const al = b.getAttribute('aria-label') || '';
    const tx = (b.textContent || '').trim();
    return /^Reviews/.test(al) || /^Reviews for/.test(al) || tx === 'Reviews';
  });
  if (tab) { tab.click(); return true; }
  return false;
})()`;

// Find the scrollable pane that actually holds the review cards.
const JS_SCROLL_STEP = `(() => {
  const cards = Array.from(document.querySelectorAll('[data-review-id]'))
    .filter(n => n.querySelector('.d4r55, .WNxzHc'));
  let pane = null;
  if (cards.length) {
    let el = cards[cards.length - 1].parentElement;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 40) { pane = el; break; }
      el = el.parentElement;
    }
  }
  if (!pane) {
    const panes = Array.from(document.querySelectorAll('div'))
      .filter(d => /(auto|scroll)/.test(getComputedStyle(d).overflowY) && d.scrollHeight > d.clientHeight + 200);
    pane = panes.sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || null;
  }
  if (pane) pane.scrollTop = pane.scrollHeight;
  else window.scrollTo(0, document.body.scrollHeight);
  return cards.length;
})()`;

const JS_EXPAND_ALL = `(() => {
  const sels = [
    'button[aria-label="See more"]',
    'button[jsaction*="review.expandReview"]',
    'button.w8nwRe',
  ];
  const seen = new Set();
  let n = 0;
  for (const s of sels) {
    for (const b of document.querySelectorAll(s)) {
      if (seen.has(b)) continue;
      seen.add(b);
      const t = (b.textContent || '').trim();
      if (b.getAttribute('aria-expanded') === 'true') continue;
      if (t && !/^(More|See more|Read more)$/i.test(t) && !b.getAttribute('aria-label')) continue;
      try { b.click(); n++; } catch {}
    }
  }
  return n;
})()`;

const JS_EXTRACT = `(() => {
  const txt = (el) => (el ? el.textContent.replace(/\\u00a0/g, ' ').trim() : '');
  const cards = Array.from(document.querySelectorAll('[data-review-id]'))
    .filter(n => n.querySelector('.d4r55, .WNxzHc'));
  const out = [];
  const seen = new Set();
  for (const c of cards) {
    const id = c.getAttribute('data-review-id');
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const author = txt(c.querySelector('.d4r55')) || txt(c.querySelector('.WNxzHc a')) ||
      (c.querySelector('button[aria-label^="Photo of"]')?.getAttribute('aria-label') || '').replace(/^Photo of /, '');

    const authorLink = c.querySelector('a[href*="/maps/contrib/"]');
    const authorMeta = txt(c.querySelector('.RfnDt'));

    let rating = null;
    const starEl = c.querySelector('[role="img"][aria-label*="star"], span.kvMYJc');
    if (starEl) {
      const m = (starEl.getAttribute('aria-label') || '').match(/([0-9](?:\\.[0-9])?)\\s*star/i);
      if (m) rating = Number(m[1]);
    }
    if (rating === null) {
      const m2 = (c.textContent || '').match(/([1-5])\\/5/);
      if (m2) rating = Number(m2[1]);
    }

    const when = txt(c.querySelector('.rsqaWe')) || txt(c.querySelector('.xRkPPb'));

    // Owner response block — resolve FIRST so its text is never mistaken for the review.
    const resp = c.querySelector('.CDe7pd');
    let ownerResponse = '';
    if (resp) ownerResponse = txt(resp.querySelector('.wiI7pd')) || txt(resp);

    // Review body. .wiI7pd is the main text span; MyEned wraps it.
    // Star-only reviews have NO body — but the owner's reply also lives in a
    // .wiI7pd, so exclude anything inside the response block.
    const inResponse = (el) => !!(resp && resp.contains(el));
    let bodyEl = Array.from(c.querySelectorAll('.wiI7pd')).find(el => !inResponse(el)) || null;
    if (!bodyEl) bodyEl = Array.from(c.querySelectorAll('.MyEned')).find(el => !inResponse(el)) || null;
    let text = txt(bodyEl);
    text = text.replace(/\\s*\\bMore$/, '').trim();
    const truncated = /…\\s*$/.test(text);

    out.push({
      reviewId: id,
      author,
      authorProfile: authorLink ? authorLink.href.split('?')[0] : '',
      authorMeta,
      rating,
      when,
      text,
      textOnly: !text,
      truncated,
      ownerResponse,
      raw: (c.innerText || '').trim(),
    });
  }
  return out;
})()`;

const JS_HEADER = `(() => {
  const t = document.body.innerText;
  const m = t.match(/([\\d,]+)\\s+reviews?/i);
  const r = t.match(/\\n(\\d\\.\\d)\\n/);
  return { reviewCountText: m ? m[1] : null, ratingText: r ? r[1] : null, title: document.title };
})()`;

// -----------------------------------------------------------------------------

async function scrapePlace(cdp, place) {
  process.stderr.write(`\n=== ${place.label} ===\n`);
  await goto(cdp, place.url);

  const opened = await evalJs(cdp, JS_OPEN_REVIEWS);
  process.stderr.write(`reviews tab clicked: ${opened}\n`);
  await sleep(3500);

  const header = await evalJs(cdp, JS_HEADER);
  process.stderr.write(`header: ${JSON.stringify(header)}\n`);

  let last = 0;
  let stagnant = 0;
  for (let i = 0; i < 400; i++) {
    const count = await evalJs(cdp, JS_SCROLL_STEP);
    if (count === last) {
      stagnant++;
      // Give lazy-load a longer beat before declaring the end.
      if (stagnant >= 6) break;
      await sleep(1600);
    } else {
      stagnant = 0;
      last = count;
      if (i % 5 === 0) process.stderr.write(`  loaded ${count}...\n`);
      await sleep(900);
    }
  }
  process.stderr.write(`  scroll finished at ${last} cards\n`);

  // Expand truncated reviews (repeat: expanding can reveal more buttons)
  for (let i = 0; i < 6; i++) {
    const n = await evalJs(cdp, JS_EXPAND_ALL);
    process.stderr.write(`  expanded ${n} "More" buttons\n`);
    if (!n) break;
    await sleep(1200);
  }
  await sleep(1200);

  const reviews = await evalJs(cdp, JS_EXTRACT);
  process.stderr.write(`  extracted ${reviews.length} reviews\n`);

  return {
    key: place.key,
    label: place.label,
    url: place.url,
    reportedReviewCount: header.reviewCountText,
    reportedRating: header.ratingText,
    scrapedCount: reviews.length,
    reviews,
  };
}

async function main() {
  const target = await getPageTarget();
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');

  const results = [];
  for (const p of PLACES) {
    try {
      results.push(await scrapePlace(cdp, p));
    } catch (e) {
      process.stderr.write(`FAILED ${p.key}: ${e.message}\n`);
      results.push({ key: p.key, label: p.label, url: p.url, error: e.message, reviews: [] });
    }
  }
  cdp.close();

  const outDir = path.join(process.cwd(), 'projects', 'str-gbp-optimization', 'reviews');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = process.env.RUN_DATE || '2026-07-31';
  const outFile = path.join(outDir, `${stamp}_google-reviews.json`);
  fs.writeFileSync(outFile, JSON.stringify({ scrapedAt: stamp, locations: results }, null, 2), 'utf8');

  process.stderr.write('\n--- SUMMARY ---\n');
  let total = 0;
  for (const r of results) {
    total += r.reviews.length;
    process.stderr.write(`${r.key}: scraped ${r.reviews.length} (Google reports ${r.reportedReviewCount || '?'}), rating ${r.reportedRating || '?'}\n`);
  }
  process.stderr.write(`TOTAL scraped: ${total}\n`);
  process.stderr.write(`Wrote ${outFile}\n`);
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
