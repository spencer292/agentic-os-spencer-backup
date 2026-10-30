// Walk The Meta Ads Arena classroom (skool.com/dan) in the tool-browser Chrome window and
// save, per lesson: description, resource links, attached PDFs (text), and the full Loom
// transcript read from the video's caption track. Read-only: navigates as a member would.
// Google Docs "/copy" links are recorded, never opened (opening one makes a copy in Drive).
//
//   node projects/briefs/meta-ads/harvest/harvest-arena.mjs [courseName ...]
//
// Output: projects/briefs/meta-ads/skool-corpus/ (gitignored). Re-runnable: lessons
// already saved with a transcript are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GROUP = 'https://www.skool.com/dan';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dir, '..', 'skool-corpus');
const SKIP_TITLES = /Work With Dan/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'x';

class CDP {
  constructor(u) { this.u = u; this.id = 0; this.p = new Map(); }
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
        }
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.p.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
}

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = targets.find((t) => t.type === 'page' && /skool\.com|loom\.com/.test(t.url)) || targets.find((t) => t.type === 'page');
const cdp = new CDP(page.webSocketDebuggerUrl);
await cdp.connect();
await cdp.send('Page.enable');

async function ev(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

async function gotoSkool(url, mdId) {
  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const ok = await ev(`(()=>{try{const p=JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps;return document.readyState==='complete' && (${JSON.stringify(mdId || '')}==='' || p.selectedModule===${JSON.stringify(mdId || '')})}catch(e){return false}})()`).catch(() => false);
    if (ok) return;
  }
  throw new Error('timeout loading ' + url);
}

const pageProps = () => ev(`JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps`);

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

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Open the Loom share page and read every cue of its caption track, grouped into
// ~30-second paragraphs with a timestamp each.
async function loomTranscript(url) {
  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 40; i++) {
    await sleep(750);
    const n = await ev(`(()=>{const v=document.querySelector('video');if(!v||!v.textTracks.length)return -1;
      for(const t of v.textTracks)t.mode='hidden';return v.textTracks[0].cues?v.textTracks[0].cues.length:0})()`).catch(() => -1);
    if (n > 0) { await sleep(1000); break; }
  }
  const cues = await ev(`(()=>{const v=document.querySelector('video');if(!v||!v.textTracks.length)return [];
    return [...(v.textTracks[0].cues||[])].map(c=>[c.startTime,c.text])})()`).catch(() => []);
  const title = await ev('document.title').catch(() => '');
  if (!cues.length) return { title, text: null };
  const paras = []; let cur = null;
  for (const [t, text] of cues) {
    if (!cur || t - cur.t >= 30) { cur = { t, words: [] }; paras.push(cur); }
    cur.words.push(text.replace(/\s+/g, ' ').trim());
  }
  return { title, text: paras.map((p) => `[${fmt(p.t)}] ${p.words.join(' ')}`).join('\n\n') };
}

// Open one PDF resource in Skool's in-page viewer and capture its signed file URL.
const seenUrls = new Set();
async function openResource(title) {
  const pt = await ev(`(()=>{const t=${JSON.stringify(title)};
    const els=[...document.querySelectorAll('span,a,div')].filter(e=>e.children.length===0&&e.innerText&&e.innerText.trim()===t);
    const vis=els.map(e=>[e,e.getBoundingClientRect()]).filter(([e,r])=>r.width>0&&r.height>0);
    if(!vis.length) return null; const [e]=vis[vis.length-1]; e.scrollIntoView({block:'center'}); e.click(); return true;})()`);
  if (!pt) return null;
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
if (!fs.existsSync(path.join(OUT, '.gitignore'))) fs.writeFileSync(path.join(OUT, '.gitignore'), '*\n');
const only = process.argv.slice(2);
await gotoSkool(`${GROUP}/classroom`);
const courses = (await pageProps()).allCourses
  .map((c) => ({ name: c.name, title: c.metadata?.title || c.name }))
  .filter((c) => !SKIP_TITLES.test(c.title))
  .filter((c) => !only.length || only.includes(c.name));

const index = fs.existsSync(path.join(OUT, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')) : {};
const log = (s) => { console.log(s); fs.appendFileSync(path.join(OUT, 'harvest.log'), s + '\n'); };

for (const [ci, c] of courses.entries()) {
  await gotoSkool(`${GROUP}/classroom/${c.name}`);
  const tree = (await pageProps()).course;
  const lessons = [];
  const walk = (n, section) => {
    const kids = n.children || [];
    if (!kids.length && n !== tree) lessons.push({ id: n.course.id, meta: n.course.metadata || {}, section });
    kids.forEach((k) => walk(k, n === tree ? (k.course.metadata?.title || '') : section));
  };
  walk(tree, '');
  const cdir = path.join(OUT, `${String(ci + 1).padStart(2, '0')}-${slug(c.title)}`);
  fs.mkdirSync(path.join(cdir, 'pdf'), { recursive: true });
  log(`== ${c.title} (${lessons.length} lessons)`);

  for (const [li, l] of lessons.entries()) {
    const meta = l.meta;
    const title = meta.title || '';
    const base = `${String(li + 1).padStart(2, '0')}-${slug(title)}`;
    const mdFile = path.join(cdir, base + '.md');
    if (fs.existsSync(mdFile) && !/\[(could not open|no transcript)/.test(fs.readFileSync(mdFile, 'utf8'))) continue;
    try {
      let resources = []; try { resources = JSON.parse(meta.resources || '[]'); } catch {}
      const lessonUrl = `${GROUP}/classroom/${c.name}?md=${l.id}`;
      const parts = [
        `# ${title}`, '',
        `- Course: ${c.title}`, `- Section: ${l.section}`,
        `- Lesson URL: ${lessonUrl}`,
        `- Video: ${meta.videoLink || (meta.videoId ? 'skool-hosted' : 'none')}${meta.videoLenMs ? ` (${Math.round(meta.videoLenMs / 60000)} min)` : ''}`,
        '', '## Description', '', richText(meta.desc) || '(none)', '',
      ];
      const files = resources.filter((r) => r.file_id);
      for (const r of resources.filter((r) => r.link || r.url)) parts.push(`## Resource link: ${r.title}`, '', r.link || r.url, '');
      if (files.length) {
        await gotoSkool(lessonUrl, l.id);
        await sleep(2000);
        seenUrls.clear();
        for (const r of files) {
          const fname = `${base}--${slug(r.title || r.file_name)}${path.extname(r.file_name || '') || '.pdf'}`;
          const fpath = path.join(cdir, 'pdf', fname);
          if (!fs.existsSync(fpath)) {
            let url = null;
            for (let a = 0; a < 3 && !url; a++) { url = await openResource(r.title); if (!url) await sleep(1500); }
            if (!url) { parts.push(`## ${r.title}`, '', `[could not open ${r.file_name}]`, ''); log(`  ! ${title}: no viewer url for ${r.title}`); continue; }
            await saveFile(url, fpath);
          }
          const body = /pdf/i.test(r.file_content_type || fname) ? pdfText(fpath) : `[${r.file_content_type} saved as pdf/${fname}]`;
          parts.push(`## ${r.title} (${r.file_name})`, '', body.trim(), '');
        }
      }
      let tx = 'n/a';
      if (/loom\.com\/share\//.test(meta.videoLink || '')) {
        const { title: vt, text } = await loomTranscript(meta.videoLink.split('?')[0]);
        tx = text ? `${text.split(/\s+/).length} words` : 'NONE';
        parts.push('## Transcript' + (vt ? ` (Loom: ${vt.replace(/ \| Loom$/, '')})` : ''), '', text || '[no transcript found]', '');
      } else if (meta.videoLink || meta.videoId) {
        tx = 'non-Loom video';
        parts.push('## Transcript', '', `[no transcript: non-Loom video ${meta.videoLink || 'skool-hosted'}]`, '');
      }
      fs.writeFileSync(mdFile, parts.join('\n'));
      index[l.id] = { course: c.title, section: l.section, title, file: path.relative(OUT, mdFile), video: meta.videoLink || '', resources: resources.map((r) => r.title) };
      fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
      log(`  ok ${base} [transcript: ${tx}; resources: ${resources.map((r) => r.title).join(', ')}]`);
      await sleep(800);
    } catch (e) {
      log(`  ! ${title}: ${e.message}`);
    }
  }
}
log('done');
process.exit(0);
