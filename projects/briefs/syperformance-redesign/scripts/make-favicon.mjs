// Renders the SYPerformance favicon mark to PNG, plus a preview sheet showing it
// at the sizes a browser actually uses.
//
//   node scripts/make-favicon.mjs
//
// Writes brand/favicon-512.png (the asset to upload) and brand/favicon-preview.png
// (for eyeballing — 16 px is the size that decides whether a mark works).
//
// The mark is drawn as real text in Inter rather than hand-authored outlines, so
// the letterforms match the site's heading face exactly instead of being guessed.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'brand');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9341;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Tokens from theme/assets/syp-tokens.css — referenced, not re-invented.
const ACCENT = '#1ec8a5';       // --syp-accent (teal green, 2026-08-26)
const INK = '#14161a';          // --syp-accent-ink
const GRAPHITE = '#14161a';     // --syp-graphite-800

// The chamfered-square silhouette: a milled billet edge, and a shape that
// survives downscaling because it changes the outline rather than adding detail.
// Overridable so the depth can be compared rather than asserted:
//   node scripts/make-favicon.mjs --chamfer=0.10
//   node scripts/make-favicon.mjs --compare     (writes a sheet of four depths)
const CHAMFER = Number((process.argv.find(a => a.startsWith('--chamfer=')) || '').split('=')[1]) || 0.11;

// The chamfered square, drawn with clip-path rather than an inline SVG: one box,
// one shape, no intrinsic-size negotiation between the SVG attributes and the
// layout box. `px` is the rendered size; the type scales with it.
const clipFor = (c) => `polygon(${(c * 100).toFixed(1)}% 0, ${(100 - c * 100).toFixed(1)}% 0, 100% ${(c * 100).toFixed(1)}%, 100% ${(100 - c * 100).toFixed(1)}%, ${(100 - c * 100).toFixed(1)}% 100%, ${(c * 100).toFixed(1)}% 100%, 0 ${(100 - c * 100).toFixed(1)}%, 0 ${(c * 100).toFixed(1)}%)`;
const CLIP = clipFor(CHAMFER);


function tile(px, chamfer) {
  const clip = chamfer === undefined ? '' : `clip-path:${clipFor(chamfer)};`;
  return `<div class="tile" style="width:${px}px;height:${px}px;font-size:${(px * 0.46).toFixed(2)}px;${clip}">SY</div>`;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=block');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: ${GRAPHITE}; font-family: Inter, system-ui, sans-serif; }
  .tile {
    display: grid;
    place-items: center;
    background: ${ACCENT};
    clip-path: ${CLIP};
    color: ${INK};
    font-weight: 800;
    /* Tight, because two letters at 16 px need every pixel of counter space they
       can get; default Inter tracking opens them up and blurs the pair. */
    letter-spacing: -0.045em;
    line-height: 1;
    /* Optical centring: cap-height sits high in the em box, so the glyphs need
       nudging down to look centred rather than measuring centred. */
    transform: translateY(3.5%);
  }
`;

async function shoot(cdp, html, width, height, file) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
  await sleep(1800); // let the webfont land
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('wrote', path.relative(ROOT, file));
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
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
  `--user-data-dir=${path.join(os.tmpdir(), 'syp-favicon-profile')}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(500);
}
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
const cdp = new CDP(ws);
await cdp.send('Page.enable');

if (process.argv.includes('--compare')) {
  // Chamfer depth is the one judgement call in this mark: too shallow and it is
  // just a square, too deep and it reads as a road sign rather than a milled block.
  const rows = [0.06, 0.11, 0.14, 0.18].map(c => `
    <div style="display:flex;align-items:center;gap:22px;margin-bottom:18px">
      <div style="font:600 12px Inter,sans-serif;color:#e8eaed;width:56px">${(c * 100).toFixed(0)}%</div>
      ${[16, 32, 64, 128].map(px => tile(px, c)).join('')}
    </div>`).join('');
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 20, g: 22, b: 26, a: 1 } });
  await shoot(cdp,
    `<style>${CSS} body{padding:24px}</style>
     <div style="font:600 12px Inter,sans-serif;color:#e8eaed;letter-spacing:.09em;text-transform:uppercase;margin-bottom:18px">chamfer depth</div>${rows}`,
    620, 620, path.join(OUT, 'favicon-chamfer-compare.png'));
  chrome.kill();
  process.exit(0);
}

// 1. The asset itself: 512, transparent outside the chamfer.
await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await shoot(cdp, `<style>${CSS} body{background:transparent}</style>${tile(512)}`, 512, 512,
  path.join(OUT, 'favicon-512.png'));

// 2. The preview sheet: the sizes browsers actually use, on both a dark and a
//    light tab strip, plus a mock row of tabs. 16 px is the one that matters.
await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 20, g: 22, b: 26, a: 1 } });
const strip = (bg, label, fg) => `
  <div style="background:${bg};padding:22px 26px">
    <div style="font:600 12px Inter,sans-serif;color:${fg};letter-spacing:.09em;text-transform:uppercase;margin-bottom:16px">${label}</div>
    <div style="display:flex;align-items:flex-end;gap:26px">
      ${[16, 24, 32, 48, 64, 128].map(px => `
        <div style="text-align:center">
          ${tile(px)}
          <div style="font:500 10px Inter,sans-serif;color:${fg};opacity:.6;margin-top:8px">${px}px</div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:2px;margin-top:24px">
      ${['SYPerformance', 'K-Series Rockers', 'Cart'].map((label2, i) => `
        <div style="display:flex;align-items:center;gap:7px;background:${i === 0 ? (bg === '#202124' ? '#35363a' : '#fff') : 'transparent'};
                    padding:7px 12px;border-radius:8px 8px 0 0;min-width:150px">
          ${tile(16)}
          <span style="font:400 11px Inter,sans-serif;color:${fg};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label2}</span>
        </div>`).join('')}
    </div>
  </div>`;
await shoot(cdp,
  `<style>${CSS}</style>${strip('#202124', 'dark browser chrome', '#e8eaed')}${strip('#dee1e6', 'light browser chrome', '#202124')}`,
  760, 460, path.join(OUT, 'favicon-preview.png'));

chrome.kill();
process.exit(0);
