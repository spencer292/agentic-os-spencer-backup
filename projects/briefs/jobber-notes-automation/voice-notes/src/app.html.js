// app.html.js — the whole technician-facing app, served as one document.
// Design constraints, in priority order: readable in direct sun, operable one-handed with
// cold or gloved fingers, and honest about state when signal drops in a rural yard.

export const APP_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#14532d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Got Moles — Visit Notes</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎙️</text></svg>">
<style>
  *,*::before,*::after{box-sizing:border-box}
  :root{
    --bg:#f6f7f5; --card:#fff; --ink:#111614; --muted:#5c6660; --line:#d8ded9;
    --brand:#14532d; --brand-ink:#fff; --warn:#a15c00; --warn-bg:#fff5e5;
    --bad:#a11a1a; --bad-bg:#fdeceb; --ok:#14532d; --ok-bg:#e7f3ea;
    --tap:60px;
  }
  html,body{margin:0;padding:0}
  body{
    background:var(--bg); color:var(--ink);
    font:500 17px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    -webkit-text-size-adjust:100%; overscroll-behavior-y:contain;
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  header{
    position:sticky;top:0;z-index:10;background:var(--brand);color:var(--brand-ink);
    padding:14px 16px;display:flex;align-items:center;gap:12px;
    padding-top:calc(14px + env(safe-area-inset-top));
  }
  header h1{font-size:17px;margin:0;font-weight:700;letter-spacing:.2px;flex:1}
  header .sub{font-size:13px;opacity:.85;font-weight:500}
  .back{background:none;border:0;color:inherit;font-size:26px;line-height:1;padding:4px 10px 4px 0;min-height:var(--tap);cursor:pointer}
  main{padding:14px;max-width:640px;margin:0 auto}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
  button{font:inherit;cursor:pointer}
  .btn{
    display:block;width:100%;min-height:var(--tap);border-radius:12px;border:2px solid var(--brand);
    background:var(--brand);color:var(--brand-ink);font-weight:700;font-size:18px;padding:14px
  }
  .btn.ghost{background:var(--card);color:var(--brand)}
  .btn[disabled]{opacity:.45}
  .job{
    display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--card);
    border:1px solid var(--line);border-left:5px solid var(--brand);border-radius:12px;
    padding:14px;margin-bottom:10px;min-height:var(--tap);color:inherit
  }
  .job .n{font-weight:700;font-size:17px}
  .job .a{color:var(--muted);font-size:14px;margin-top:2px}
  .job .chev{margin-left:auto;color:var(--muted);font-size:22px}
  .job.done{border-left-color:#8aa79a;opacity:.62}
  .pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 8px;border-radius:99px;background:var(--ok-bg);color:var(--ok);margin-left:8px}
  label{display:block;font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px}
  input,textarea{
    width:100%;font:inherit;padding:14px;border:2px solid var(--line);border-radius:12px;
    background:#fff;color:var(--ink);min-height:var(--tap)
  }
  textarea{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:17px;line-height:1.7;min-height:210px}
  input:focus,textarea:focus{outline:3px solid #9fc4ad;border-color:var(--brand)}
  .rec{
    width:170px;height:170px;border-radius:50%;margin:6px auto 4px;display:flex;
    align-items:center;justify-content:center;flex-direction:column;gap:4px;
    border:4px solid var(--brand);background:var(--card);color:var(--brand);font-weight:800;font-size:19px
  }
  .rec.on{background:var(--bad);border-color:var(--bad);color:#fff;animation:pulse 1.4s infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(161,26,26,.45)}50%{box-shadow:0 0 0 20px rgba(161,26,26,0)}}
  .timer{text-align:center;font-variant-numeric:tabular-nums;font-weight:700;color:var(--muted);margin-bottom:8px}
  .msg{padding:12px 14px;border-radius:12px;margin-bottom:12px;font-size:15px;font-weight:600}
  .msg.warn{background:var(--warn-bg);color:var(--warn)}
  .msg.bad{background:var(--bad-bg);color:var(--bad)}
  .msg.ok{background:var(--ok-bg);color:var(--ok)}
  .chips{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 0}
  .chip{font-size:13px;font-weight:700;padding:6px 11px;border-radius:99px;background:var(--ok-bg);color:var(--ok)}
  .chip.miss{background:var(--warn-bg);color:var(--warn)}
  .quiet{color:var(--muted);font-size:14px}
  pre.last{white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:var(--muted);margin:6px 0 0;line-height:1.6}
  details summary{min-height:44px;display:flex;align-items:center;font-weight:700;color:var(--muted);font-size:14px}
  .spin{display:inline-block;width:17px;height:17px;border:3px solid #ffffff66;border-top-color:#fff;border-radius:50%;animation:sp .8s linear infinite;vertical-align:-3px;margin-right:8px}
  @keyframes sp{to{transform:rotate(360deg)}}
  .datebar{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  .datebar button{
    width:52px;min-height:52px;border-radius:12px;border:2px solid var(--line);
    background:var(--card);color:var(--brand);font-size:26px;font-weight:700;line-height:1
  }
  .datebar div{flex:1;text-align:center;font-weight:700;font-size:16px}
  .offline{background:var(--bad);color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700}
  .hide{display:none!important}
</style>
</head>
<body>
<div id="offline" class="offline hide">No signal — recordings are saved on this phone</div>
<header>
  <button class="back hide" id="back" aria-label="Back">‹</button>
  <div style="flex:1">
    <h1 id="title">Got Moles</h1>
    <div class="sub" id="sub">Visit notes</div>
  </div>
</header>
<main id="main"></main>

<script>
const $ = s => document.querySelector(s);
const main = $('#main');
function today(){ return new Date().toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10); }
const state = { token: localStorage.getItem('gm_token') || '', tech: localStorage.getItem('gm_tech') || '', date: today(), jobs: [], job: null, blob: null, mime: '', result: null, sentJobs: new Set() };

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function setHead(t, s, back){ $('#title').textContent = t; $('#sub').textContent = s; $('#back').classList.toggle('hide', !back); }
// "Already sent" is remembered per day so a tech can see at a glance which stops are done.
function loadSent(){ state.sentJobs = new Set(JSON.parse(localStorage.getItem('gm_sent_' + state.date) || '[]')); }
function markSent(id){ state.sentJobs.add(id); localStorage.setItem('gm_sent_'+state.date, JSON.stringify([...state.sentJobs])); }
function shiftDate(days){
  const d = new Date(state.date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  state.date = d.toISOString().slice(0,10);
  loadSent();
  renderJobs();
}
function dateLabel(){
  const d = new Date(state.date + 'T12:00:00Z');
  const wd = d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'});
  return state.date === today() ? wd + ' (today)' : wd;
}

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ...(opts.headers||{}), Authorization: 'Bearer ' + state.token } });
  if (res.status === 401) { logout(); throw new Error('Session expired — sign in again'); }
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || ('Error ' + res.status));
  return d;
}
function logout(){ localStorage.removeItem('gm_token'); localStorage.removeItem('gm_tech'); state.token=''; state.tech=''; renderLogin(); }

// ── login ──────────────────────────────────────────────────────────────────
function renderLogin(){
  setHead('Got Moles', 'Visit notes', false);
  main.innerHTML = \`<div class="card">
    <label for="code">Your code</label>
    <input id="code" type="tel" inputmode="numeric" autocomplete="one-time-code" placeholder="4 digits">
    <div id="err"></div>
    <button class="btn" id="go" style="margin-top:12px">Sign in</button>
    <p class="quiet" style="margin-bottom:0">Ask Spencer for your code. You only enter it once on this phone.</p>
  </div>\`;
  $('#go').onclick = async () => {
    const code = $('#code').value.trim();
    $('#err').innerHTML = '';
    $('#go').disabled = true;
    try {
      const d = await (await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code }) })).json();
      if (!d.token) throw new Error(d.error || 'That code did not work');
      state.token = d.token; state.tech = d.name;
      localStorage.setItem('gm_token', d.token); localStorage.setItem('gm_tech', d.name);
      renderJobs();
    } catch (e) { $('#err').innerHTML = '<div class="msg bad" style="margin-top:12px">' + esc(e.message) + '</div>'; }
    $('#go').disabled = false;
  };
  $('#code').addEventListener('keydown', e => { if (e.key === 'Enter') $('#go').click(); });
}

// ── job list ───────────────────────────────────────────────────────────────
const dateBar = () => \`<div class="datebar">
    <button id="dprev" aria-label="Previous day">‹</button>
    <div id="dlbl">\${esc(dateLabel())}</div>
    <button id="dnext" aria-label="Next day">›</button>
  </div>\`;

function wireDateBar(){
  const p = $('#dprev'), n = $('#dnext');
  if (p) p.onclick = () => shiftDate(-1);
  if (n) n.onclick = () => shiftDate(1);
}

async function renderJobs(){
  setHead(state.tech || 'Jobs', dateLabel(), false);
  main.innerHTML = dateBar() + '<div class="card quiet">Loading jobs…</div>';
  wireDateBar();
  await flushOutbox();
  try {
    const d = await api('/api/jobs?date=' + state.date);
    state.jobs = d.jobs;
    const body = !d.jobs.length
      ? '<div class="card"><b>No visits assigned to you on this day.</b><p class="quiet" style="margin-bottom:0">Use ‹ › above to check another day, or check the schedule in Jobber.</p></div>'
      : d.jobs.map((j,i) => \`<button class="job \${state.sentJobs.has(j.jobId)?'done':''}" data-i="\${i}">
          <div><div class="n">#\${esc(j.jobNumber)} \${esc(j.client)}\${state.sentJobs.has(j.jobId)?'<span class="pill">note sent</span>':''}</div>
          <div class="a">\${esc(j.address || 'No address')}</div></div><div class="chev">›</div></button>\`).join('')
        + '<p class="quiet" style="text-align:center">' + d.jobs.length + ' visits · tap a job to record</p>';
    main.innerHTML = dateBar() + body + '<button class="btn ghost" id="out" style="margin-top:8px">Sign out</button>';
    wireDateBar();
    main.querySelectorAll('.job').forEach(b => b.onclick = () => renderRecord(state.jobs[+b.dataset.i]));
    $('#out').onclick = logout;
  } catch (e) {
    main.innerHTML = dateBar() + '<div class="msg bad">'+esc(e.message)+'</div><button class="btn" onclick="location.reload()">Try again</button>';
    wireDateBar();
  }
}

// ── record ─────────────────────────────────────────────────────────────────
let rec = null, chunks = [], t0 = 0, tick = null;

function renderRecord(job){
  state.job = job; state.blob = null; state.result = null;
  setHead('#' + job.jobNumber + ' ' + job.client, job.address || '', true);
  $('#back').onclick = renderJobs;
  main.innerHTML = \`
    <div class="card">
      <button class="rec" id="rec"><span id="recIcon">●</span><span id="recLbl">Record</span></button>
      <div class="timer" id="timer">Tap to start · tap again to stop</div>
      <p class="quiet" style="text-align:center;margin:0">
        Say: moles caught · misses · activity · what you changed · traps on the ground now · when to come back
      </p>
    </div>
    \${job.lastNote ? \`<details class="card"><summary>Last note on this job</summary><pre class="last">\${esc(job.lastNote)}</pre></details>\` : ''}
    <div id="out"></div>\`;
  $('#rec').onclick = toggleRec;
}

async function toggleRec(){
  const btn = $('#rec');
  if (rec && rec.state === 'recording') { rec.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true } });
    const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/aac'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    state.mime = rec.mimeType || mime || 'audio/webm';
    chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      clearInterval(tick);
      stream.getTracks().forEach(t => t.stop());
      btn.classList.remove('on'); $('#recLbl').textContent = 'Record'; $('#recIcon').textContent = '●';
      state.blob = new Blob(chunks, { type: state.mime });
      if (state.blob.size < 1200) { $('#timer').textContent = 'That was too short — try again'; return; }
      $('#timer').textContent = 'Recorded ' + fmt(Date.now() - t0);
      sendAudio();
    };
    rec.start();
    t0 = Date.now();
    btn.classList.add('on'); $('#recLbl').textContent = 'Stop'; $('#recIcon').textContent = '■';
    tick = setInterval(() => { $('#timer').textContent = fmt(Date.now() - t0); }, 200);
  } catch (e) {
    $('#out').innerHTML = '<div class="msg bad">Cannot use the microphone. Allow mic access for this site in your phone settings, then reload.</div>';
  }
}
const fmt = ms => { const s = Math.floor(ms/1000); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };

async function sendAudio(){
  $('#out').innerHTML = '<div class="card quiet"><span class="spin" style="border-color:#ccc;border-top-color:#14532d"></span>Writing up your note…</div>';
  const ext = /mp4|aac/.test(state.mime) ? 'm4a' : 'webm';
  const fd = new FormData();
  fd.append('audio', state.blob, 'note.' + ext);
  fd.append('mime', (state.mime || 'audio/webm').split(';')[0]);
  fd.append('jobId', state.job.jobId);
  try {
    const d = await api('/api/transcribe', { method: 'POST', body: fd });
    state.result = d;
    renderResult(d);
  } catch (e) {
    $('#out').innerHTML = '<div class="msg bad">'+esc(e.message)+'</div><button class="btn" id="retry">Try again</button>';
    $('#retry').onclick = sendAudio;
  }
}

function renderResult(d){
  const f = d.fields || {};
  const chip = (label, val, ok) => \`<span class="chip \${ok?'':'miss'}">\${label}: \${ok?esc(val):'—'}</span>\`;
  const warn = (d.warnings||[]).length
    ? '<div class="msg warn"><b>Check before sending</b><ul style="margin:6px 0 0;padding-left:20px;font-weight:500">' + d.warnings.map(w => '<li>'+esc(w.msg)+'</li>').join('') + '</ul></div>'
    : '<div class="msg ok">✓ Reads clean — every field the report needs is here</div>';
  $('#out').innerHTML = warn + \`
    <div class="card">
      <label for="note">Note for Jobber — edit if anything is off</label>
      <textarea id="note" spellcheck="false">\${esc(d.note)}</textarea>
      <div class="chips">
        \${chip('Moles', f.moles, f.moles !== null && f.moles !== undefined)}
        \${chip('Miss', (f.misses||0) + (f.missKind ? ' '+f.missKind : ''), f.misses !== null && f.misses !== undefined)}
        \${chip('Activity', f.activity, !!f.activity)}
        \${chip('Traps', f.inventory, !!f.inventory)}
        \${chip('Next', f.nextAction, !!f.nextAction)}
      </div>
    </div>
    <details class="card"><summary>What you said</summary><pre class="last">\${esc(d.transcript)}</pre></details>
    <button class="btn" id="send">Send to Jobber</button>
    <button class="btn ghost" id="again" style="margin-top:10px">Record again</button>\`;
  $('#again').onclick = () => renderRecord(state.job);
  $('#send').onclick = doSend;
  $('#note').addEventListener('input', recheck);
}

let recheckT = null;
function recheck(){
  clearTimeout(recheckT);
  recheckT = setTimeout(async () => {
    try {
      const d = await api('/api/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ note: $('#note').value }) });
      const f = d.fields || {};
      const chips = document.querySelector('.chips');
      const chip = (label, val, ok) => \`<span class="chip \${ok?'':'miss'}">\${label}: \${ok?esc(val):'—'}</span>\`;
      if (chips) chips.innerHTML = chip('Moles', f.moles, f.moles!==null&&f.moles!==undefined)
        + chip('Miss', (f.misses||0)+(f.missKind?' '+f.missKind:''), f.misses!==null&&f.misses!==undefined)
        + chip('Activity', f.activity, !!f.activity) + chip('Traps', f.inventory, !!f.inventory)
        + chip('Next', f.nextAction, !!f.nextAction);
    } catch {}
  }, 500);
}

async function doSend(){
  const btn = $('#send');
  const message = $('#note').value.trim();
  if (!message) return;
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Sending…';
  const payload = { jobId: state.job.jobId, message, transcript: state.result?.transcript || '' };
  try {
    await api('/api/note', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    markSent(state.job.jobId);
    $('#out').innerHTML = '<div class="msg ok">✓ Sent to Jobber — #'+esc(state.job.jobNumber)+' '+esc(state.job.client)+'</div><button class="btn" id="nx">Next job</button>';
    $('#nx').onclick = renderJobs;
  } catch (e) {
    queue(payload);
    $('#out').innerHTML = '<div class="msg warn">Saved on this phone — it will send by itself when you get signal. You can carry on.</div><button class="btn" id="nx">Next job</button>';
    $('#nx').onclick = renderJobs;
    markSent(state.job.jobId);
  }
}

// ── offline outbox ─────────────────────────────────────────────────────────
const OUT = 'gm_outbox';
const readOut = () => JSON.parse(localStorage.getItem(OUT) || '[]');
const writeOut = a => localStorage.setItem(OUT, JSON.stringify(a));
function queue(p){ const a = readOut(); a.push({ ...p, at: Date.now() }); writeOut(a); }
async function flushOutbox(){
  let a = readOut();
  if (!a.length) return;
  const keep = [];
  for (const item of a) {
    try { await api('/api/note', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(item) }); }
    catch { keep.push(item); }
  }
  writeOut(keep);
}
window.addEventListener('online', () => { $('#offline').classList.add('hide'); flushOutbox(); });
window.addEventListener('offline', () => $('#offline').classList.remove('hide'));
if (!navigator.onLine) $('#offline').classList.remove('hide');

$('#back').onclick = renderJobs;
loadSent();
state.token ? renderJobs() : renderLogin();
</script>
</body>
</html>`;
