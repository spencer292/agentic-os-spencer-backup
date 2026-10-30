// Walk the AI Video Bootcamp classroom in the tool-browser Chrome window and save,
// per lesson: the written description, video link/length, and the text of every
// attached PDF (Transcript, Lesson Guide, ...). Read-only: navigates and opens the
// in-page PDF viewer exactly as a member would, then saves the signed file it shows.
//
//   node projects/briefs/ai-video-ads/harvest/harvest-skool.mjs [courseName ...]
//
// Output: projects/briefs/ai-video-ads/skool-corpus/ (gitignored). Re-runnable:
// lessons already saved are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GROUP = 'https://www.skool.com/aivideobootcamp';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dir, '..', 'skool-corpus');
const SKIP_TITLES = /Affiliate|Golden Ticket|^.{0,4}Level \d/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'x';

class CDP {
  constructor(u) { this.u = u; this.id = 0; this.p = new Map(); this.h = []; }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.u);
      this.ws.onopen = res;
      this.ws.onerror = () => rej(new Error('WebSocket connection to Chrome failed'));
      this.ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && this.p.has(msg.id)) {
          const { res: r, rej: j } = this.p.get(msg.id); this.p.delete(msg.id);
          msg.error ? j(new Error(msg.error.message)) : r(msg.result);
        } else if (msg.method) this.h.forEach((f) => f(msg));
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.p.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
}

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = targets.find((t) => t.type === 'page' && t.url.includes('skool.com')) || targets.find((t) => t.type === 'page');
const cdp = new CDP(page.webSocketDebuggerUrl);
await cdp.connect();
await cdp.send('Page.enable');

async function ev(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

async function goto(url, mdId) {
  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const ok = await ev(`(()=>{try{const p=JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps;return document.readyState==='complete' && (${JSON.stringify(mdId || '')}==='' || p.selectedModule===${JSON.stringify(mdId || '')})}catch(e){return false}})()`).catch(() => false);
    if (ok) return;
  }
  throw new Error('timeout loading ' + url);
}

const pageProps = () => ev(`JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps`);

// Skool rich text: "[v2]" + ProseMirror-style JSON. Flatten to plain text with links.
function richText(desc) {
  if (!desc) return '';
  if (!desc.startsWith('[v2]')) return desc;
  let nodes; try { nodes = JSON.parse(desc.slice(4)); } catch { return desc; }
  const walk = (n) => {
    if (n.type === 'text') {
      const link = (n.marks || []).find((m) => m.type === 'link');
      return link && link.attrs.href !== n.text ? `${n.text} (${link.attrs.href})` : n.text;
    }
    const inner = (n.content || []).map(walk).join('');
    if (n.type === 'listItem') return '- ' + inner + '\n';
    if (n.type === 'hardBreak') return '\n';
    return ['paragraph', 'heading'].includes(n.type) ? inner + '\n\n' : inner;
  };
  return nodes.map(walk).join('').trim();
}

// Open one resource in the viewer by clicking its title in the lesson's Resources list,
// wait for the signed files.skool.com URL, then close the viewer.
async function openResource(title) {
  const pt = await ev(`(()=>{const t=${JSON.stringify(title)};
    const els=[...document.querySelectorAll('span,a,div')].filter(e=>e.children.length===0&&e.innerText&&e.innerText.trim()===t);
    const vis=els.map(e=>[e,e.getBoundingClientRect()]).filter(([e,r])=>r.width>0&&r.height>0);
    if(!vis.length) return null; const [e,r]=vis[vis.length-1]; e.scrollIntoView({block:'center'});
    const r2=e.getBoundingClientRect(); return {x:r2.x+r2.width/2,y:r2.y+r2.height/2};})()`);
  if (!pt) return null;
  await sleep(300);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: pt.x, y: pt.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
  }
  let url = null;
  for (let i = 0; i < 20 && !url; i++) {
    await sleep(500);
    const found = await ev(`([...document.querySelectorAll('iframe,embed,object,img,video,source')].map(e=>e.src||e.data||'').filter(s=>s.startsWith('https://files.skool.com/')))`);
    url = found.map((s) => s.split('#')[0]).find((s) => !seenUrls.has(s)) || null;
  }
  if (url) seenUrls.add(url);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(400);
  return url;
}
const seenUrls = new Set();

async function openResourceRetry(title) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const url = await openResource(title);
    if (url) return url;
    await sleep(1500);
  }
  return null;
}

async function saveFile(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

function pdfText(file) {
  try { return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
  catch (e) { return `[pdftotext failed: ${e.message}]`; }
}

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
await goto(`${GROUP}/classroom`);
const courses = (await pageProps()).allCourses
  .map((c) => ({ name: c.name, title: c.metadata?.title || c.name }))
  .filter((c) => !SKIP_TITLES.test(c.title))
  .filter((c) => !only.length || only.includes(c.name));

const index = fs.existsSync(path.join(OUT, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')) : {};
const log = (s) => { console.log(s); fs.appendFileSync(path.join(OUT, 'harvest.log'), s + '\n'); };

for (const [ci, c] of courses.entries()) {
  await goto(`${GROUP}/classroom/${c.name}`);
  const tree = (await pageProps()).course;
  const lessons = [];
  const walk = (n, section) => {
    const kids = n.children || [];
    if (!kids.length && n !== tree) lessons.push({ id: n.course.id, title: n.course.metadata?.title || '', section });
    kids.forEach((k) => walk(k, n === tree ? (k.course.metadata?.title || '') : section));
  };
  walk(tree, '');
  const cdir = path.join(OUT, `${String(ci + 1).padStart(2, '0')}-${slug(c.title)}`);
  fs.mkdirSync(path.join(cdir, 'pdf'), { recursive: true });
  log(`== ${c.title} (${lessons.length} lessons)`);

  for (const [li, l] of lessons.entries()) {
    const base = `${String(li + 1).padStart(2, '0')}-${slug(l.title)}`;
    const mdFile = path.join(cdir, base + '.md');
    if (fs.existsSync(mdFile) && !fs.readFileSync(mdFile, 'utf8').includes('[could not open')) continue;
    try {
      await goto(`${GROUP}/classroom/${c.name}?md=${l.id}`, l.id);
      await sleep(2000); // let the lesson hydrate before clicking resources
      seenUrls.clear();
      const meta = await ev(`(()=>{const p=JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps;
        const f=(n)=>{if(n.course.id===p.selectedModule)return n;for(const k of n.children||[]){const r=f(k);if(r)return r}};
        const n=f(p.course);return n?n.course.metadata:{}})()`);
      let resources = []; try { resources = JSON.parse(meta.resources || '[]'); } catch {}
      const parts = [
        `# ${l.title}`, '',
        `- Course: ${c.title}`, `- Section: ${l.section}`,
        `- Lesson URL: ${GROUP}/classroom/${c.name}?md=${l.id}`,
        `- Video: ${meta.videoLink || (meta.videoId ? 'skool-hosted' : 'none')}${meta.videoLenMs ? ` (${Math.round(meta.videoLenMs / 60000)} min)` : ''}`,
        '', '## Description', '', richText(meta.desc) || '(none)', '',
      ];
      for (const r of resources) {
        if (r.link || r.url) { parts.push(`## Resource link: ${r.title}`, '', r.link || r.url, ''); continue; }
        if (!r.file_id) continue;
        const fname = `${base}--${slug(r.title || r.file_name)}${path.extname(r.file_name || '') || '.pdf'}`;
        const fpath = path.join(cdir, 'pdf', fname);
        let body;
        if (!fs.existsSync(fpath)) {
          const url = await openResourceRetry(r.title);
          if (!url) { parts.push(`## ${r.title}`, '', `[could not open ${r.file_name}]`, ''); log(`  ! ${l.title}: no viewer url for ${r.title}`); continue; }
          await saveFile(url, fpath);
        }
        body = /pdf/i.test(r.file_content_type || fname) ? pdfText(fpath) : `[${r.file_content_type} saved as pdf/${fname}]`;
        parts.push(`## ${r.title} (${r.file_name})`, '', body.trim(), '');
      }
      fs.writeFileSync(mdFile, parts.join('\n'));
      index[l.id] = { course: c.title, section: l.section, title: l.title, file: path.relative(OUT, mdFile), resources: resources.map((r) => r.title) };
      fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
      log(`  ok ${base} [${resources.map((r) => r.title).join(', ')}]`);
      await sleep(800);
    } catch (e) {
      log(`  ! ${l.title}: ${e.message}`);
    }
  }
}
log('done');
process.exit(0);
