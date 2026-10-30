// Pull English subtitles from Skool-hosted (Mux) lesson videos in the Arena, for lessons
// harvest-arena.mjs marked "non-Loom video ... skool-hosted". Plays the video muted with
// subtitles showing and steps the playhead through the file so every caption segment loads.
//
//   node projects/briefs/meta-ads/harvest/harvest-skool-video.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GROUP = 'https://www.skool.com/dan';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dir, '..', 'skool-corpus');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = targets.find((t) => t.type === 'page' && t.url.includes('skool.com')) || targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { const [r, j] = pending.get(msg.id); pending.delete(msg.id); msg.error ? j(new Error(msg.error.message)) : r(msg.result); } };
await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('CDP connect failed')); });
const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, [r, j]); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

const index = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
const todo = Object.entries(index).filter(([, v]) => {
  const f = path.join(OUT, v.file);
  return fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('[no transcript: non-Loom video skool-hosted]');
});
console.log(`${todo.length} skool-hosted lessons to transcribe`);

const FIND_VIDEO = `(()=>{const vids=[];const scan=(r)=>{r.querySelectorAll('video').forEach(x=>vids.push(x));r.querySelectorAll('*').forEach(e=>{if(e.shadowRoot)scan(e.shadowRoot)})};scan(document);window.__v=vids[0]||null;return !!window.__v})()`;

for (const [mdId, v] of todo) {
  const courseName = await (async () => {
    await send('Page.navigate', { url: `${GROUP}/classroom` }); await sleep(3000);
    return ev(`JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps.allCourses.find(c=>(c.metadata?.title||c.name)===${JSON.stringify(v.course)})?.name`);
  })();
  await send('Page.navigate', { url: `${GROUP}/classroom/${courseName}?md=${mdId}` });
  await sleep(5000);
  // Click the poster's play button so the player mounts its <video>.
  const pt = await ev(`(()=>{const b=[...document.querySelectorAll('div,img')].map(e=>[e,e.getBoundingClientRect()]).filter(([e,r])=>r.width>500&&r.height>250&&r.y>150).sort((a,b)=>a[1].width*a[1].height-b[1].width*b[1].height)[0];
    if(!b)return null;const r=b[1];return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  // The play button is an SVG overlay; CDP mouse events don't reach it, a bubbling click does.
  if (pt) await ev(`(()=>{const e=document.elementFromPoint(${pt.x},${pt.y});if(e)e.dispatchEvent(new MouseEvent('click',{bubbles:true}));return !!e})()`);
  let ok = false;
  for (let i = 0; i < 20 && !ok; i++) { await sleep(500); ok = await ev(FIND_VIDEO); }
  if (!ok) { console.log(`  ! ${v.title}: no video element`); continue; }
  const dur = await ev(`(async()=>{const v=window.__v;v.muted=true;for(let i=0;i<40&&!(v.duration>0);i++)await new Promise(r=>setTimeout(r,250));
    const t=[...v.textTracks].find(t=>t.kind==='subtitles');if(!t)return -1;t.mode='showing';await v.play().catch(()=>{});return v.duration})()`);
  if (dur < 0) { console.log(`  ! ${v.title}: no subtitle track`); continue; }
  for (let x = 0; x < dur; x += 45) {
    await ev(`(()=>{window.__v.currentTime=${x};window.__v.play().catch(()=>{})})()`);
    await sleep(2500);
  }
  const cues = await ev(`(()=>{const v=window.__v;v.pause();const t=[...v.textTracks].find(t=>t.kind==='subtitles');
    const seen=new Set();return [...(t.cues||[])].filter(c=>{const k=c.startTime+'|'+c.text;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.startTime-b.startTime).map(c=>[c.startTime,c.text])})()`);
  const paras = []; let cur = null;
  for (const [t, text] of cues) {
    if (!cur || t - cur.t >= 60) { cur = { t, words: [] }; paras.push(cur); }
    cur.words.push(text.replace(/\s+/g, ' ').trim());
  }
  const covered = cues.length ? cues[cues.length - 1][0] : 0;
  const body = paras.map((p) => `[${fmt(p.t)}] ${p.words.join(' ')}`).join('\n\n');
  const f = path.join(OUT, v.file);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('[no transcript: non-Loom video skool-hosted]',
    `(Skool-hosted video, ${fmt(dur)}; captions cover to ${fmt(covered)})\n\n${body}`));
  console.log(`  ok ${v.title}: ${cues.length} cues, ${body.split(/\s+/).length} words, to ${fmt(covered)} of ${fmt(dur)}`);
}
console.log('done');
process.exit(0);
