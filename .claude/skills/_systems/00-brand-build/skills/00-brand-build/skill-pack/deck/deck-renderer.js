/* Brand Deck Renderer — generic, data-driven, dependency-free.
 * Produces a designed 16:9 landscape HTML deck (one <section.slide> per page),
 * ready for Chrome `--print-to-pdf`. Brand-agnostic: all content comes from a
 * JSON data file; assets are inlined as base64 so the PDF is self-contained.
 *
 * Usage:  node deck-renderer.js --data brand-deck.json --out deck.html [--assets DIR]
 * Then:   chrome --headless=new --no-pdf-header-footer --print-to-pdf=deck.pdf file:///ABS/deck.html
 *
 * Data schema: see SCHEMA.md in this folder. Every section is optional — a slide
 * is skipped if its data is absent, so partial brands still render cleanly.
 */
const fs = require('fs');
const path = require('path');

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i];
}
if (!args.data || !args.out) { console.error('need --data and --out'); process.exit(1); }

const dataPath = path.resolve(args.data);
const D = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const assetsDir = args.assets ? path.resolve(args.assets) : path.dirname(dataPath);

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mime = e => ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[e.toLowerCase()] || 'image/png');
function dataURI(rel) {
  if (!rel) return '';
  try {
    const abs = path.isAbsolute(rel) ? rel : path.resolve(assetsDir, rel);
    const b64 = fs.readFileSync(abs).toString('base64');
    return `data:${mime(path.extname(abs))};base64,${b64}`;
  } catch (e) { return ''; }
}
function img(rel, cls = '') {
  const u = dataURI(rel);
  return u ? `<img class="${cls}" src="${u}">` : `<div class="${cls} ph">image: ${esc(rel)}</div>`;
}

// ---- colour helpers --------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
}
function rgbToCmyk(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k >= 0.999) return [0, 0, 0, 100];
  const c = (1 - R - k) / (1 - k), m = (1 - G - k) / (1 - k), y = (1 - B - k) / (1 - k);
  return [c, m, y, k].map(v => Math.round(v * 100));
}
function readable(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0d0d0d' : '#ffffff'; }

// ---- deck chrome colours (derived from the brand palette) ------------------
const cols = D.colours || [];
const darkest = cols.slice().sort((a, b) => { const s = h => hexToRgb(h).reduce((x, y) => x + y, 0); return s(a.hex) - s(b.hex); })[0];
const INK = (D.ink) || (darkest && darkest.hex) || '#111111';
const ACCENT = (D.accent) || (cols.find(c => /accent/i.test(c.role || '')) || cols.find(c => /primary/i.test(c.role || '')) || cols[0] || {}).hex || '#b8860b';

// ---- slide builders --------------------------------------------------------
const slides = [];
function slide(html, cls = '') { slides.push(`<section class="slide ${cls}">${html}</section>`); }
function kicker(n, t) { return `<div class="kick"><span class="num">${n}</span> ${esc(t)}</div>`; }

// 1. cover
slide(`
  <div class="cover">
    ${D.logo_cover || (D.logos && D.logos.primary && D.logos.primary.img) ? `<div class="cover-logo">${img(D.logo_cover || D.logos.primary.img)}</div>` : `<h1 class="cover-name">${esc(D.brand)}</h1>`}
    ${D.essence ? `<p class="cover-essence">${esc(D.essence)}</p>` : ''}
    <p class="cover-meta">Brand Guidelines${D.version ? ` · v${esc(D.version)}` : ''}${D.date ? ` · ${esc(D.date)}` : ''}${D.founders ? `<br>${esc(D.founders)}` : ''}</p>
  </div>
  ${D.studio ? `<div class="studio">${esc(D.studio)}</div>` : ''}
`, 'cover-slide');

// 2. contents
const toc = [];
if (D.story) toc.push('the brand');
if (D.adjectives) toc.push('brand foundations');
if (D.purpose || D.vision || D.mission) toc.push('purpose, vision, mission');
if (D.values) toc.push('values');
if (D.positioning) toc.push('positioning');
if (D.logos) toc.push('logo suite');
if (D.colours) toc.push('colour');
if (D.type) toc.push('typography');
if (D.voice) toc.push('voice & tone');
if (D.imagery) toc.push('imagery & assets');
if (D.actions) toc.push('brand in action');
if (D.governance || D.ai_usage) toc.push('governance & AI');
slide(`
  <div class="split">
    <div class="left"><h2 class="big">contents</h2></div>
    <div class="right toc">${toc.map(t => `<div class="toc-item">${esc(t)}</div>`).join('')}</div>
  </div>
`);

// 3. the brand (story)
if (D.story) slide(`
  <div class="split">
    <div class="left">${kicker('01', 'the brand')}<h2 class="big">${esc(D.brand)}</h2></div>
    <div class="right"><p class="lede">${esc(D.story)}</p></div>
  </div>
`);

// 4. foundations — 3 adjectives
if (D.adjectives) slide(`
  ${kicker('02', 'brand foundations')}
  ${D.adjectives_line ? `<div class="adj-line">${esc(D.adjectives_line)}</div>` : ''}
  <div class="cols3">
    ${D.adjectives.map(a => `<div class="col"><h3>${esc(a.word)}</h3><p>${esc(a.def)}</p></div>`).join('')}
  </div>
`);

// 5. purpose / vision / mission
if (D.purpose || D.vision || D.mission) slide(`
  ${kicker('03', 'purpose · vision · mission')}
  <div class="pvm">
    ${D.purpose ? `<div class="pvm-row"><h3>purpose</h3><p>${esc(D.purpose)}</p></div>` : ''}
    ${D.vision ? `<div class="pvm-row"><h3>vision</h3><p>${esc(D.vision)}</p></div>` : ''}
    ${D.mission ? `<div class="pvm-row"><h3>mission</h3><p>${esc(D.mission)}</p></div>` : ''}
  </div>
`);

// 6. values
if (D.values) slide(`
  ${kicker('04', 'values')}
  <div class="values-grid">
    ${D.values.map(v => `<div class="value"><h4>${esc(v.name)}</h4><p>${esc(v.def)}</p></div>`).join('')}
  </div>
`);

// 7. positioning statement (our differentiator — a hero slide)
if (D.positioning) slide(`
  ${kicker('05', 'positioning')}
  <blockquote class="position">${esc(D.positioning)}</blockquote>
`, 'accent-slide');

// 8. logo — primary + clear space
if (D.logos && D.logos.primary) {
  const p = D.logos.primary;
  slide(`
    <div class="split">
      <div class="left">${kicker('06', 'logo suite')}<h3 class="sec">primary logo</h3>
        ${p.usage ? `<p><b>Usage.</b> ${esc(p.usage)}</p>` : ''}
        ${p.clearspace ? `<p><b>Clear space.</b> ${esc(p.clearspace)}</p>` : ''}
        ${p.minsize ? `<p><b>Minimum size.</b> ${esc(p.minsize)}</p>` : ''}
      </div>
      <div class="right logo-stage">
        <div class="logo-clear">${img(p.img, 'logo-img')}
          <span class="cs cs-t"></span><span class="cs cs-b"></span><span class="cs cs-l"></span><span class="cs cs-r"></span>
        </div>
        <div class="cs-cap">dashed line = minimum clear space</div>
      </div>
    </div>
  `);
}

// 9. logo — variations (secondary + mark)
if (D.logos && (D.logos.secondary || D.logos.mark)) slide(`
  ${kicker('06', 'logo suite')}<h3 class="sec">variations</h3>
  <div class="logo-variants">
    ${D.logos.secondary ? `<div class="lv"><div class="lv-stage">${img(D.logos.secondary.img, 'logo-img')}</div><h4>secondary</h4><p>${esc(D.logos.secondary.usage || '')}</p></div>` : ''}
    ${D.logos.mark ? `<div class="lv"><div class="lv-stage">${img(D.logos.mark.img, 'logo-img mark')}</div><h4>logo mark</h4><p>${esc(D.logos.mark.usage || '')}</p></div>` : ''}
  </div>
`);

// 10. logo — incorrect usage
if (D.logo_donts) slide(`
  ${kicker('07', 'incorrect usage')}<h3 class="sec">leave the logo alone</h3>
  <div class="donts">
    ${D.logo_donts.map(d => `<div class="dont"><span class="x">✕</span> ${esc(d)}</div>`).join('')}
  </div>
`);

// 11. colour palette
if (D.colours) {
  const blocks = D.colours.map(c => {
    const [r, g, b] = hexToRgb(c.hex); const cmyk = c.cmyk || rgbToCmyk(r, g, b).join(', ');
    return `<div class="swatch" style="background:${c.hex};color:${readable(c.hex)}">
      <div class="sw-name">${esc(c.name)}</div>
      <div class="sw-role">${esc(c.role || '')}</div>
      <div class="sw-vals">HEX ${esc(c.hex.toUpperCase())}<br>RGB ${r}, ${g}, ${b}<br>CMYK ${esc(cmyk)}</div>
    </div>`;
  }).join('');
  slide(`
    <div class="split">
      <div class="left">${kicker('08', 'colour palette')}
        <p><b>${esc(D.colour_ratio || '60 / 30 / 10')}.</b> ${esc(D.colour_ratio_note || 'Primary dominates (~60%), secondary supports (~30%), accents make the statement (~10%).')}</p>
        <p class="dim">HEX/RGB for screen · CMYK for print.</p>
      </div>
      <div class="right swatches">${blocks}</div>
    </div>
  `);
}

// 12. colour pairing
if (D.colour_pairing) slide(`
  ${kicker('08', 'colour usage')}<h3 class="sec">pairings</h3>
  <div class="pairings">
    ${D.colour_pairing.map(p => `<div class="pair" style="background:${p.bg};color:${readable(p.bg)}">
      <div class="pair-bg">on ${esc(p.name)}</div>
      <div class="pair-use">${esc(p.use)}</div>
    </div>`).join('')}
  </div>
`);

// 13. typography
if (D.type) slide(`
  ${kicker('09', 'typography')}
  <div class="type-list">
    ${D.type.map(t => `<div class="type-row">
      <div class="type-meta"><h4>${esc(t.role)}</h4><div class="type-name">${esc(t.name)}</div><p>${esc(t.desc || '')}</p></div>
      <div class="type-sample" style="font-family:${esc(t.css_font || 'inherit')};font-weight:${t.weight || 700}">${esc(t.sample || 'Aa Bb Cc 123')}</div>
    </div>`).join('')}
  </div>
`);

// 14. type incorrect usage
if (D.type_donts) slide(`
  ${kicker('09', 'typography')}<h3 class="sec">incorrect usage</h3>
  <div class="donts">
    ${D.type_donts.map(d => `<div class="dont"><span class="x">✕</span> ${esc(d)}</div>`).join('')}
  </div>
`);

// 15. voice & tone (our differentiator)
if (D.voice) slide(`
  ${kicker('10', 'voice & tone')}
  <div class="voice">
    ${D.voice.oneline ? `<p class="lede">${esc(D.voice.oneline)}</p>` : ''}
    ${D.voice.coordinates ? `<p><b>Tone.</b> ${esc(D.voice.coordinates)}</p>` : ''}
    <div class="vocab">
      ${D.voice.leanInto ? `<div class="vc lean"><h4>lean into</h4><p>${D.voice.leanInto.map(esc).join(' · ')}</p></div>` : ''}
      ${D.voice.avoid ? `<div class="vc avoid"><h4>avoid</h4><p>${D.voice.avoid.map(esc).join(' · ')}</p></div>` : ''}
    </div>
    ${D.voice.ritual ? `<blockquote class="ritual">${esc(D.voice.ritual)}</blockquote>` : ''}
  </div>
`);

// 16. imagery & assets
if (D.imagery) slide(`
  ${kicker('11', 'imagery & assets')}
  <div class="imagery">
    ${D.imagery.do ? `<div class="im do"><h4>do</h4><ul>${D.imagery.do.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${D.imagery.dont ? `<div class="im dont-col"><h4>don't</h4><ul>${D.imagery.dont.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  </div>
`);

// 17. brand in action — paginated gallery of uncropped, framed mockups (4 per slide)
if (D.actions && D.actions.length) {
  const items = D.actions.map(a => (typeof a === 'string' ? { img: a } : a));
  const per = 6;
  for (let i = 0; i < items.length; i += per) {
    const chunk = items.slice(i, i + per);
    slide(`
      ${kicker('12', 'brand in action')}${i > 0 ? '<h3 class="sec light">applied, continued</h3>' : ''}
      <div class="bia n${chunk.length}">
        ${chunk.map(a => `<figure class="bia-card">
          <div class="bia-frame">${img(a.img, 'bia-img')}</div>
          <figcaption>${a.platform ? `<span class="bia-plat">${esc(a.platform)}</span>` : ''}<span>${esc(a.caption || '')}</span></figcaption>
        </figure>`).join('')}
      </div>
    `, 'dark-action');
  }
}

// 18. governance & AI
if (D.governance || D.ai_usage) slide(`
  ${kicker('13', 'governance & AI-usage')}
  <div class="split">
    <div class="left">${D.governance ? `<p>${esc(D.governance)}</p>` : ''}</div>
    <div class="right">${D.ai_usage ? `<h4>AI-usage</h4><ul class="ai">${D.ai_usage.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
  </div>
`);

// 19. closing
slide(`
  <div class="cover closing">
    <h2 class="big">keep me safe</h2>
    <p class="cover-essence">${esc(D.closing || 'Follow this guide for consistency across every touchpoint. If you ever feel you\'re straying from the brand, open me up.')}</p>
    ${D.essence ? `<p class="cover-meta">${esc(D.brand)} — ${esc(D.essence)}</p>` : ''}
  </div>
`, 'cover-slide');

// ---- CSS -------------------------------------------------------------------
const PAGE = (D.orientation === 'landscape')
  ? { w: 1280, h: 720, pad: '84px 96px' }
  : { w: 1000, h: 1414, pad: '76px 72px' };
const css = `
@page { size: ${PAGE.w}px ${PAGE.h}px; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
:root { --ink:${INK}; --accent:${ACCENT}; --line:#e7e3da; --dim:#8a8578; }
html,body { background:#fff; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.slide { position:relative; width:${PAGE.w}px; height:${PAGE.h}px; padding:${PAGE.pad}; page-break-after:always; overflow:hidden; background:#fff; display:flex; flex-direction:column; }
.slide:last-child { page-break-after:auto; }
.kick { font-size:14px; letter-spacing:.18em; text-transform:uppercase; color:var(--dim); margin-bottom:22px; flex:none; }
.kick .num { color:var(--accent); font-weight:700; margin-right:8px; }
.big { font-size:64px; font-weight:800; letter-spacing:-1.5px; line-height:.97; }
.sec { font-size:30px; font-weight:800; letter-spacing:-.5px; margin-bottom:20px; }
.sec.light { color:#fff; }
/* split → stacks vertically in portrait */
.split { display:flex; flex-direction:column; gap:40px; flex:1; justify-content:center; }
.split .left, .split .right { width:100%; }
.lede { font-size:23px; line-height:1.5; font-weight:300; }
p { font-size:17px; line-height:1.55; margin:10px 0; }
p b { font-weight:700; }
.dim { color:var(--dim); }
.studio { position:absolute; top:44px; right:72px; font-size:13px; letter-spacing:.06em; color:var(--accent); font-weight:700; }
/* cover */
.cover-slide { align-items:center; justify-content:center; text-align:center; }
.cover { max-width:840px; }
.cover-logo img { max-width:520px; max-height:300px; object-fit:contain; margin:0 auto 40px; display:block; }
.cover-name { font-size:58px; font-weight:800; letter-spacing:-1.5px; }
.cover-essence { font-size:27px; font-style:italic; color:var(--ink); margin-top:10px; }
.cover-meta { margin-top:34px; font-size:16px; letter-spacing:.05em; color:var(--dim); line-height:1.7; }
.closing .big { margin-bottom:18px; }
/* contents */
.toc { margin-top:10px; }
.toc-item { font-size:26px; padding:14px 0; border-bottom:1px solid var(--line); }
.toc-item:last-child { border-bottom:none; }
/* foundations → stacked rows */
.adj-line { font-size:21px; font-weight:700; margin-bottom:30px; }
.cols3 { display:flex; flex-direction:column; gap:26px; }
.cols3 h3 { font-size:28px; font-weight:800; color:var(--accent); margin-bottom:8px; }
.cols3 p { font-size:18px; max-width:760px; }
/* pvm */
.pvm-row { display:flex; gap:30px; padding:24px 0; border-top:1px solid var(--line); }
.pvm-row h3 { flex:0 0 150px; font-size:24px; font-weight:800; text-transform:lowercase; }
.pvm-row p { font-size:18px; margin:0; }
/* values */
.values-grid { display:grid; grid-template-columns:1fr 1fr; gap:26px 40px; }
.value h4 { font-size:20px; font-weight:800; color:var(--accent); margin-bottom:6px; }
.value p { font-size:15px; margin:0; }
/* positioning */
.accent-slide { background:var(--ink); color:#fff; justify-content:center; }
.accent-slide .kick { color:rgba(255,255,255,.6); } .accent-slide .kick .num { color:var(--accent); }
.position { font-size:31px; line-height:1.42; font-weight:300; }
/* logo */
.logo-stage { display:flex; flex-direction:column; align-items:center; justify-content:center; }
.logo-clear { position:relative; padding:56px; border:2px dashed var(--accent); border-radius:8px; background:#faf9f6; }
.logo-img { max-width:520px; max-height:260px; object-fit:contain; display:block; }
.logo-img.mark { max-width:200px; }
.cs-cap { margin-top:16px; font-size:13px; color:var(--dim); letter-spacing:.05em; text-align:center; }
.logo-variants { display:flex; gap:40px; margin-top:8px; flex:1; align-items:center; }
.lv { flex:1; text-align:center; }
.lv-stage { height:300px; display:flex; align-items:center; justify-content:center; background:#faf9f6; border:1px solid var(--line); border-radius:8px; }
.lv-stage .logo-img { max-height:230px; }
.lv h4 { font-size:21px; margin:18px 0 6px; text-transform:lowercase; }
.lv p { font-size:15px; color:var(--dim); }
/* donts */
.donts { display:grid; grid-template-columns:1fr; gap:14px; margin-top:6px; }
.dont { font-size:18px; padding:14px 18px; background:#faf9f6; border-left:3px solid #c0392b; }
.dark-action .dont { background:rgba(255,255,255,.06); color:#fff; }
.dont .x { color:#c0392b; font-weight:800; margin-right:8px; }
/* colour */
.swatches { display:grid; grid-template-columns:1fr 1fr; gap:0; border-radius:8px; overflow:hidden; }
.swatch { padding:24px; min-height:215px; display:flex; flex-direction:column; justify-content:flex-end; }
.sw-name { font-size:22px; font-weight:800; } .sw-role { font-size:12px; opacity:.85; margin-bottom:10px; text-transform:uppercase; letter-spacing:.08em; }
.sw-vals { font-size:12.5px; line-height:1.5; opacity:.95; }
.pairings { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-top:6px; }
.pair { padding:22px 18px; border-radius:8px; min-height:200px; display:flex; flex-direction:column; justify-content:space-between; }
.pair-bg { font-size:18px; font-weight:800; } .pair-use { font-size:14px; }
/* type → stacked */
.type-row { padding:22px 0; border-top:1px solid var(--line); }
.type-meta { margin-bottom:12px; } .type-meta h4 { font-size:14px; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); }
.type-name { font-size:24px; font-weight:800; margin:4px 0 6px; } .type-meta p { font-size:15px; margin:0; }
.type-sample { font-size:44px; line-height:1.04; color:var(--ink); }
/* voice */
.vocab { display:flex; gap:24px; margin:22px 0; }
.vc { flex:1; padding:18px 20px; border-radius:8px; } .vc h4 { font-size:14px; text-transform:uppercase; letter-spacing:.1em; margin-bottom:10px; }
.vc.lean { background:#f3f7f2; border-left:3px solid #3a7d44; } .vc.avoid { background:#faf3f2; border-left:3px solid #c0392b; }
.vc p { font-size:16px; margin:0; }
.ritual { font-size:19px; font-style:italic; padding:18px 22px; background:var(--ink); color:#fff; border-radius:8px; }
/* imagery */
.imagery { display:flex; gap:32px; margin-top:10px; }
.im { flex:1; padding:22px 24px; border-radius:8px; } .im h4 { font-size:17px; text-transform:lowercase; margin-bottom:12px; }
.im.do { background:#f3f7f2; } .im.dont-col { background:#faf3f2; }
.im ul { list-style:none; } .im li { font-size:15px; padding:7px 0; border-bottom:1px solid rgba(0,0,0,.06); }
/* brand in action — framed, uncropped gallery */
.dark-action { background:var(--ink); }
.dark-action .kick { color:rgba(255,255,255,.6); }
.bia { display:grid; gap:22px; margin-top:12px; flex:1; align-content:start; }
.bia.n1 { grid-template-columns:1fr; } .bia.n2 { grid-template-columns:1fr 1fr; }
.bia.n3 { grid-template-columns:1fr 1fr 1fr; }
.bia.n4, .bia.n5, .bia.n6 { grid-template-columns:1fr 1fr; }
.bia-card { background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.28); display:flex; flex-direction:column; }
.bia-frame { background:#f4f1ea; display:flex; align-items:center; justify-content:center; height:430px; padding:14px; }
.bia.n1 .bia-frame { height:560px; }
.bia.n5 .bia-frame, .bia.n6 .bia-frame { height:300px; }
.bia-img { max-width:100%; max-height:100%; object-fit:contain; display:block; border-radius:4px; }
.bia-card figcaption { padding:12px 16px; font-size:14px; color:var(--ink); display:flex; align-items:center; gap:10px; }
.bia-plat { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; background:var(--accent); color:#fff; padding:3px 9px; border-radius:20px; white-space:nowrap; }
/* ai */
.ai, ul.ai { list-style:none; } .ai li { font-size:16px; padding:8px 0; padding-left:22px; position:relative; }
.ai li:before { content:'→'; position:absolute; left:0; color:var(--accent); }
.right h4 { font-size:16px; text-transform:lowercase; margin-bottom:10px; color:var(--accent); }
.ph { display:flex; align-items:center; justify-content:center; background:#f0ede6; color:#a8a293; font-size:13px; min-height:120px; border-radius:6px; }
`;

const out = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(D.brand)} — Brand Deck</title><style>${css}</style></head><body>${slides.join('\n')}</body></html>`;
fs.writeFileSync(path.resolve(args.out), out, 'utf8');
console.log('deck HTML written:', args.out, '| slides:', slides.length, '| bytes:', out.length);
