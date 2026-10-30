// Three sample Facebook posts (1080x1350) to set the look. Copy checked against
// mkt-cmo/references/claims-gate.md; facts from brand_context/mole-knowledge-base.md §3.
import { svg, LOGO, moundPath } from '../brand.mjs';

const d = moundPath();
// A field of mounds in one color, like the brand guide's pattern swatch.
const mounds = (fill, items) => items.map(([x, y, w]) =>
  `<svg viewBox="0 0 584.26 274.56" style="position:absolute;left:${x}px;top:${y}px;width:${w}px"><path fill="${fill}" d="${d}"/></svg>`).join('');

export const posts = [
  {
    id: '01_fall-rain',
    css: `
      .p1{background:var(--grass);color:var(--cream)}
      .p1 .logo{position:absolute;left:84px;top:84px;width:300px}
      .p1 .stack{position:absolute;left:84px;top:270px;width:912px;display:flex;flex-direction:column;gap:44px} .p1 h1{font-size:122px}
      .p1 h1 em{font-style:normal;color:var(--gold)}
      .p1 .sub{width:800px;font-size:40px;line-height:1.3}
      .p1 .ground{position:absolute;left:0;bottom:0;width:1080px;height:250px;background:var(--grass-x)}
      .p1 .pillars{position:absolute;left:84px;bottom:86px;font-size:30px;color:var(--cream);opacity:.85}`,
    html: `<div class="post p1">
      <div class="logo">${svg(LOGO.primary.cream)}</div>
      <div class="stack"><h1>The rain is back. So are <em>the moles.</em></h1>
      <p class="sub">Fall rain pulls earthworms toward the surface, and moles follow them right into your lawn.</p></div>
      ${mounds('#0E2A28', [[-60, 1010, 300], [250, 1040, 180], [430, 990, 340], [770, 1030, 220], [960, 1000, 280]])}
      <div class="ground"></div>
      <p class="body pillars">Chemical-free&nbsp;&nbsp;·&nbsp;&nbsp;Safe for pets and kids&nbsp;&nbsp;·&nbsp;&nbsp;Veteran-owned</p>
    </div>`,
  },
  {
    id: '02_no-hibernation',
    css: `
      .p2{background:var(--cream);color:var(--grass)}
      .p2 .stack{position:absolute;left:84px;top:150px;width:912px;display:flex;flex-direction:column} .p2 .tag{font-family:Lexend;font-weight:700;font-size:30px;color:var(--rust);text-transform:uppercase;margin-bottom:28px}
      .p2 h1{font-size:112px}
      .p2 .rule{font-family:Lexend;font-weight:700;font-size:30px;color:var(--rust);text-transform:uppercase;margin:72px 0 24px}
      .p2 .sub{width:840px;font-size:46px;line-height:1.25}
      .p2 .logo{position:absolute;left:84px;bottom:90px;width:250px}
      .p2 .mark{position:absolute;right:84px;bottom:90px;width:140px}`,
    html: `<div class="post p2">
      <div class="stack"><h1>Moles don't hibernate. <span style="color:var(--rust)">Neither do we.</span></h1>
      <p class="sub" style="margin-top:56px">Western Washington winters are mild, so moles keep digging all year. Our techs are on routes all winter too.</p></div>
      <div class="logo">${svg(LOGO.stacked.grass)}</div>
      <div class="mark">${svg(LOGO.mark.rust)}</div>
    </div>`,
  },
  {
    id: '03_neighbors',
    css: `
      .p3{background:var(--blue);color:var(--cream)}
      .p3 .logo{position:absolute;left:84px;top:96px;width:200px}
      .p3 .stack{position:absolute;left:84px;top:330px;width:912px;display:flex;flex-direction:column;gap:48px}
      .p3 h1{font-size:104px;text-wrap:initial}
      .p3 h1 em{font-style:normal;color:var(--gold)}
      .p3 .sub{width:800px;font-size:40px;line-height:1.3;opacity:.92}
      .p3 .ground{position:absolute;left:0;bottom:0;width:1080px;height:130px;background:#0E1420}`,
    html: `<div class="post p3">
      <div class="logo">${svg(LOGO.stacked.cream)}</div>
      <div class="stack"><h1>Your neighbors<br>have a mole guy.<br><em>Now you<br>do too.</em></h1>
      <p class="sub">Chemical-free mole control for Western Washington lawns, from a local, veteran&#8209;owned crew.</p></div>
      ${mounds('#0E1420', [[-40, 1150, 200], [190, 1180, 150], [360, 1130, 240], [630, 1170, 170], [820, 1140, 230], [1010, 1175, 150]])}
      <div class="ground"></div>
    </div>`,
  },
];
