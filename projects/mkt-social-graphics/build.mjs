// build.mjs: render Got Moles social posts (1080x1350, Facebook 4:5) from HTML using the real
// brand SVGs and self-hosted fonts. No AI imagery.
//   node projects/mkt-social-graphics/build.mjs <folder>   (folder holds posts.mjs)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const fontDir = path.join(root, 'projects/briefs/website-rebuild-rebrand/site/public/fonts');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);

const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(fontDir, f)).toString('base64')}`;
const CSS = `
@font-face{font-family:Lexend;font-weight:700;src:url(${font('lexend-bold.woff2')})}
@font-face{font-family:Zilla;font-weight:400;src:url(${font('zilla-slab-regular.woff2')})}
@font-face{font-family:Zilla;font-weight:600;src:url(${font('zilla-slab-semibold.woff2')})}
:root{--grass:#184241;--grass-d:#133634;--grass-x:#0E2A28;--blue:#182034;--cream:#FFF1D9;--gold:#E68C04;--rust:#8F2A2D}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:Zilla,serif;-webkit-font-smoothing:antialiased}
.post{position:relative;width:1080px;height:1350px;overflow:hidden}
h1{font-family:Lexend;font-weight:700;text-transform:uppercase;line-height:.95;text-wrap:balance}
.sub{font-family:Zilla;font-weight:600}
.body{font-family:Zilla;font-weight:400}
svg{display:block}
`;

const folder = path.resolve(process.argv[2] || here);
const { posts } = await import(pathToFileURL(path.join(folder, 'posts.mjs')));
for (const p of posts) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${p.css || ''}</style></head><body><div class="post">${p.html}</div></body></html>`;
  const htmlFile = path.join(folder, `${p.id}.html`);
  writeFileSync(htmlFile, html);
  const png = path.join(folder, `${p.id}.png`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1080,1350', '--virtual-time-budget=3000', `--screenshot=${png}`, pathToFileURL(htmlFile).href], { stdio: 'ignore' });
  console.log('rendered', path.relative(root, png));
}
