// Turn SY's supplied logo PDF into web assets, and report what it actually is.
//
// Supplied 2026-08-26: "Syperformance - Logo.pdf", 1224 x 516 pt, produced by Adobe
// Photoshop. It contains no vector art and no fonts — the whole logo is one 5100 x 2150
// JPEG, on a white background, with drop shadows and a brushed-metal gradient baked in.
// That matters for three reasons and they are all in docs/checklist.md 8.6.
//
// What this does:
//   1. Samples the brand teal off the artwork, so the site accent can be matched to the
//      logo rather than guessed at.
//   2. Knocks the white background out to transparency, so the mark can sit on graphite.
//   3. Writes the header sizes, at 1x and 2x.
//
// Everything runs in headless Chrome through a canvas — no image library, nothing to
// install, same approach as scripts/make-favicon.mjs.
//
//   node scripts/prepare-logo.mjs                       # uses ~/Downloads/Syperformance - Logo.pdf
//   node scripts/prepare-logo.mjs --src path/to.jpg     # or a already-extracted raster
//
// The knockout is a threshold, not a matte. It is honest for a logo drawn on flat white
// and it will fringe on the soft drop shadow — which is why the report prints how many
// pixels landed in the partial band. If that number is large, the answer is a real
// transparent PNG or an SVG from whoever drew it, not a better threshold.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'brand');
const PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(p => fs.existsSync(p)) || 'chrome';

const srcIdx = process.argv.indexOf('--src');
let SRC = srcIdx > -1 ? process.argv[srcIdx + 1] : null;

// Default: pull the raster straight out of the PDF. Photoshop writes the image as a
// single DCTDecode stream, so the JPEG can be sliced out between its own markers.
if (!SRC) {
  const pdf = path.join(os.homedir(), 'Downloads', 'Syperformance - Logo.pdf');
  if (!fs.existsSync(pdf)) { console.error(`No source. Pass --src, or put the logo PDF at ${pdf}`); process.exit(1); }
  const buf = fs.readFileSync(pdf);
  const start = buf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]));
  const end = buf.indexOf(Buffer.from([0xFF, 0xD9]), start + 3);
  if (start < 0 || end < 0) { console.error('No JPEG stream found in the PDF.'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  SRC = path.join(OUT, 'logo-source.jpg');
  fs.writeFileSync(SRC, buf.slice(start, end + 2));
  console.log(`Extracted ${SRC} (${(buf.slice(start, end + 2).length / 1024 / 1024).toFixed(1)} MB)`);
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m.result); this.pending.delete(m.id); }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise(res => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); });
  }
}

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-logo-profile')}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
const cdp = new CDP(ws);
await cdp.send('Runtime.enable');

const dataUri = 'data:image/jpeg;base64,' + fs.readFileSync(SRC).toString('base64');

const splitIdx = process.argv.indexOf('--split');
const SPLIT_PCT = splitIdx > -1 ? Number(process.argv[splitIdx + 1]) / 100 : 0.60;

const script = `(async () => {
  const SPLIT_PCT = ${SPLIT_PCT};
  const img = new Image();
  img.src = ${JSON.stringify(dataUri)};
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H);
  const p = d.data;

  // --- 1. sample: the most common strongly-saturated hue in the 150-200 deg band
  const buckets = {};
  let opaque = 0, partial = 0, white = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i+1], b = p[i+2];
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), dl = mx - mn;
    if (mx > 235 && dl < 14) white++;
    else if (mx > 200 && dl < 40) partial++;
    else opaque++;
    if (dl > 45 && g >= r && g >= 60) {
      let h = 0;
      if (mx === g) h = ((b - r) / dl + 2) * 60; else if (mx === b) h = ((r - g) / dl + 4) * 60; else h = (((g - b) / dl) % 6) * 60;
      if (h < 0) h += 360;
      if (h > 140 && h < 210) {
        const key = [Math.round(r/8)*8, Math.round(g/8)*8, Math.round(b/8)*8].join(',');
        buckets[key] = (buckets[key] || 0) + 1;
      }
    }
  }
  const top = Object.entries(buckets).sort((a,b) => b[1]-a[1]).slice(0, 6)
    .map(([k, n]) => ({ rgb: k.split(',').map(Number), n }));

  // --- 2. knockout: near-white to transparent, with a soft band so edges do not jag
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i+1], b = p[i+2];
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), dl = mx - mn;
    if (dl < 26) {
      if (mn >= 246) p[i+3] = 0;
      else if (mn >= 214) p[i+3] = Math.round(255 * (246 - mn) / 32);
    }
  }
  x.putImageData(d, 0, 0);

  // --- 3. trim the transparent margin so the mark sits flush in a header
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    if (p[(y*W + xx)*4 + 3] > 12) { if (xx<minX)minX=xx; if (xx>maxX)maxX=xx; if (y<minY)minY=y; if (y>maxY)maxY=y; }
  }
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const t = document.createElement('canvas'); t.width = tw; t.height = th;
  t.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);

  const scaled = (h) => {
    const s = document.createElement('canvas');
    s.width = Math.round(tw * h / th); s.height = h;
    const sx = s.getContext('2d');
    sx.imageSmoothingQuality = 'high';
    sx.drawImage(t, 0, 0, s.width, s.height);
    return { w: s.width, h, url: s.toDataURL('image/png') };
  };

  // --- 4. the header mark. The supplied art is a three-tier lockup: the SYP block,
  // the SYPERFORMANCE wordmark under it, and a "Performance and Fabrication" line under
  // that. At a header height of 28-40px the bottom two tiers are unreadable, so the
  // asset a header needs is the top tier on its own. Find where it ends by looking for
  // the row with the least ink between 45% and 70% of the height - the two tiers abut,
  // so there is no fully clear row to split on.
  const rowInk = [];
  for (let y = 0; y < th; y++) {
    let n = 0;
    const row = t.getContext('2d').getImageData(0, y, tw, 1).data;
    for (let xx = 3; xx < row.length; xx += 4) if (row[xx] > 24) n++;
    rowInk.push(n);
  }
  // The two tiers overlap - the wordmark's ascenders rise into the SYP block's drop
  // shadow - so there is no empty row to find. Searching for one picked 46%, which is
  // inside the SYP letterforms and cut their feet off. The split is a judgement, so it
  // is a parameter: SPLIT_PCT, overridable with --split.
  const split = Math.round(th * SPLIT_PCT);
  const best = rowInk[split];
  const markC = document.createElement('canvas'); markC.width = tw; markC.height = split;
  markC.getContext('2d').drawImage(t, 0, 0, tw, split, 0, 0, tw, split);
  // trim the mark's own margins
  const md = markC.getContext('2d').getImageData(0, 0, tw, split).data;
  let mnX = tw, mxX = 0, mnY = split, mxY = 0;
  for (let y = 0; y < split; y++) for (let xx = 0; xx < tw; xx++) {
    if (md[(y*tw + xx)*4 + 3] > 12) { if (xx<mnX)mnX=xx; if (xx>mxX)mxX=xx; if (y<mnY)mnY=y; if (y>mxY)mxY=y; }
  }
  const mw = mxX - mnX + 1, mh = mxY - mnY + 1;
  const mark = document.createElement('canvas'); mark.width = mw; mark.height = mh;
  mark.getContext('2d').drawImage(markC, mnX, mnY, mw, mh, 0, 0, mw, mh);
  const markScaled = (h) => {
    const s = document.createElement('canvas');
    s.width = Math.round(mw * h / mh); s.height = h;
    const sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high';
    sx.drawImage(mark, 0, 0, s.width, s.height);
    return { w: s.width, h, url: s.toDataURL('image/png') };
  };

  return {
    split: { row: split, ofHeight: +(100*split/th).toFixed(1), inkAtSplit: best },
    mark: { w: mw, h: mh, ratio: +(mw/mh).toFixed(3) },
    markAssets: { m40: markScaled(40), m80: markScaled(80), m512: markScaled(512) },
    source: { W, H, ratio: +(W/H).toFixed(3) },
    pixels: { opaque, partial, white, partialPct: +(100*partial/(W*H)).toFixed(2) },
    teal: top,
    trimmed: { w: tw, h: th, ratio: +(tw/th).toFixed(3) },
    assets: { h56: scaled(56), h112: scaled(112), h256: scaled(256) }
  };
})()`;

const res = await cdp.send('Runtime.evaluate', { expression: script, awaitPromise: true, returnByValue: true });
if (res.exceptionDetails) { console.error(JSON.stringify(res.exceptionDetails, null, 1)); chrome.kill(); process.exit(1); }
const r = res.result.value;

const hex = ([a, b, c2]) => '#' + [a, b, c2].map(v => v.toString(16).padStart(2, '0')).join('');
console.log(`\nSource raster: ${r.source.W} x ${r.source.H}  (${r.source.ratio}:1)`);
console.log(`Trimmed:       ${r.trimmed.w} x ${r.trimmed.h}  (${r.trimmed.ratio}:1)`);
console.log(`\nBrand teal, most common first:`);
for (const t of r.teal) console.log(`   ${hex(t.rgb).padEnd(9)} rgb(${t.rgb.join(', ')})   ${t.n.toLocaleString()} px`);
console.log(`\nKnockout: ${r.pixels.white.toLocaleString()} px white -> transparent, ` +
            `${r.pixels.partial.toLocaleString()} px in the soft band (${r.pixels.partialPct}% of the image).`);
if (r.pixels.partialPct > 8) console.log('   That is high. A real transparent PNG or vector from the designer would be better than this threshold.');

console.log(`
Header mark split at row ${r.split.row} (${r.split.ofHeight}% of height, ${r.split.inkAtSplit} px of ink on that row).`);
console.log(`Mark: ${r.mark.w} x ${r.mark.h}  (${r.mark.ratio}:1)`);

fs.mkdirSync(OUT, { recursive: true });
for (const [name, a] of Object.entries(r.markAssets)) {
  const px = name.replace('m', '');
  fs.writeFileSync(path.join(OUT, `logo-mark-${px}.png`), Buffer.from(a.url.split(',')[1], 'base64'));
  console.log(`wrote brand/logo-mark-${px}.png  ${a.w} x ${a.h}`);
}
for (const [name, a] of Object.entries(r.assets)) {
  const px = name.replace('h', '');
  const file = path.join(OUT, `logo-${px}.png`);
  fs.writeFileSync(file, Buffer.from(a.url.split(',')[1], 'base64'));
  console.log(`wrote brand/logo-${px}.png  ${a.w} x ${a.h}`);
}
chrome.kill();
