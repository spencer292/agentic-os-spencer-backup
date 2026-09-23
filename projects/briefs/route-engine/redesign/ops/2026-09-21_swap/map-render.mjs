#!/usr/bin/env node
/**
 * map-render.mjs — builds leveled-map.html.
 *
 * Self-contained: the data is inlined rather than fetched, so the file works opened straight from
 * disk. Leaflet comes from cdnjs, tiles from OpenStreetMap. Colours are tokens on :root with a dark
 * mode, so it reads either way.
 */

const TEMPLATE = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Route Map 21 to 25 September</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
:root{
  --bg:#f6f7f9; --panel:#ffffff; --ink:#15181d; --muted:#5b6472; --line:#dfe3e9;
  --accent:#1f6feb; --warn:#b4530a; --chip:#eef1f5;
  --t1:#e4572e; --t2:#2e86ab; --t3:#5b8c3e; --t4:#8e5bb5; --t5:#c08a00; --t6:#c2255c; --t7:#4f6d7a;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#11141a; --panel:#181d25; --ink:#e7eaef; --muted:#9aa4b2; --line:#2a313c;
    --accent:#6ea8fe; --warn:#e8a15c; --chip:#222936;
    --t1:#ff7f56; --t2:#59b4d9; --t3:#8bc269; --t4:#b98ce0; --t5:#f2c744; --t6:#f06595; --t7:#8fb0bf;
  }
}
:root[data-theme="dark"]{
  --bg:#11141a; --panel:#181d25; --ink:#e7eaef; --muted:#9aa4b2; --line:#2a313c;
  --accent:#6ea8fe; --warn:#e8a15c; --chip:#222936;
  --t1:#ff7f56; --t2:#59b4d9; --t3:#8bc269; --t4:#b98ce0; --t5:#f2c744; --t6:#f06595; --t7:#8fb0bf;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
#wrap{display:grid;grid-template-columns:330px 1fr;height:100%}
#side{background:var(--panel);border-right:1px solid var(--line);overflow-y:auto;padding:16px}
#map{height:100%}
h1{font-size:17px;margin:0 0 2px}
.sub{color:var(--muted);font-size:12px;margin:0 0 14px}
h2{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px}
.seg{display:flex;gap:4px;flex-wrap:wrap}
.seg button{flex:1 1 auto;padding:7px 8px;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:7px;cursor:pointer;font-size:12px}
.seg button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.legend{display:flex;flex-direction:column;gap:5px}
.legend label{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px}
.dot{width:12px;height:12px;border-radius:50%;flex:none}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
th,td{text-align:right;padding:3px 4px;border-bottom:1px solid var(--line)}
th:first-child,td:first-child{text-align:left}
td.over{color:var(--warn);font-weight:600}
.chip{display:inline-block;background:var(--chip);border-radius:999px;padding:2px 8px;font-size:11px;color:var(--muted);margin-right:4px}
.blk{border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px}
.note{color:var(--muted);font-size:11px;margin-top:10px}
.sw{display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:-1px;margin-right:5px}
@media (max-width:820px){#wrap{grid-template-columns:1fr;grid-template-rows:auto 62vh}#side{border-right:0;border-bottom:1px solid var(--line)}}
</style>
</head>
<body>
<div id="wrap">
  <aside id="side">
    <h1>Route map, 21 to 25 September</h1>
    <p class="sub">Proposal only. Nothing has been changed.</p>

    <h2>Stage</h2>
    <div class="seg" id="stage">
      <button data-v="0" aria-pressed="false">As booked</button>
      <button data-v="1" aria-pressed="false">Day levelled</button>
      <button data-v="2" aria-pressed="true">Edge shifted</button>
    </div>

    <h2>Day</h2>
    <div class="seg" id="day"></div>

    <h2>Technicians</h2>
    <div class="legend" id="legend"></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px;cursor:pointer">
      <input type="checkbox" id="onlyMoved"> Only customers changing technician
    </label>

    <h2>Hours and stops</h2>
    <table id="hours"></table>

    <h2>Blocks that move</h2>
    <div id="blocks"></div>
    <p class="note">A ringed marker is a customer changing technician: the ring is the technician losing them, the fill is the one taking them. Squares are home addresses. Spencer's is assumed.</p>
  </aside>
  <div id="map"></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
const DATA = __DATA__;
const PAL = ['--t1','--t2','--t3','--t4','--t5','--t6','--t7'];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888888';
const colorOf = {};
DATA.techs.forEach((t,i) => { colorOf[t] = PAL[i % PAL.length]; });
let stage = 2, day = 'all', onlyMoved = false;
const off = new Set();

const map = L.map('map', { preferCanvas: true }).setView([47.45, -122.15], 9);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const layer = L.layerGroup().addTo(map);
const homeLayer = L.layerGroup().addTo(map);

const techOf = s => stage === 2 ? s.t2 : s.t0;
const dayOf = s => stage === 0 ? s.d0 : stage === 1 ? s.d1 : s.d2;
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

function draw() {
  layer.clearLayers();
  homeLayer.clearLayers();
  for (const s of DATA.stops) {
    const t = techOf(s);
    if (off.has(t)) continue;
    if (day !== 'all' && dayOf(s) !== day) continue;
    if (onlyMoved && !s.moved) continue;
    const fill = css(colorOf[t] || '--t7');
    const ring = s.moved ? css(colorOf[s.t0] || '--t7') : fill;
    L.circleMarker([s.lat, s.lng], {
      radius: s.moved ? 6 : 4,
      weight: s.moved ? 3 : 1,
      color: ring, fillColor: fill, fillOpacity: s.moved ? 0.95 : 0.8,
    }).bindPopup(
      '<b>' + esc(s.client) + '</b><br>' + esc(s.city) + ' ' + esc(s.zip) + '<br>job ' + esc(s.job) +
      '<br>booked: ' + esc(s.t0) + ', ' + esc(DATA.labels[s.d0]) +
      '<br>levelled: ' + esc(s.t1) + ', ' + esc(DATA.labels[s.d1]) +
      '<br>edge shifted: ' + esc(s.t2) + ', ' + esc(DATA.labels[s.d2]) +
      (s.moved ? '<br><b>changes technician</b>' : '')
    ).addTo(layer);
  }
  for (const t of Object.keys(DATA.homes)) {
    if (off.has(t)) continue;
    const h = DATA.homes[t];
    L.marker([h.lat, h.lng], { icon: L.divIcon({ className: '', iconSize: [14, 14], html: '<div style="width:14px;height:14px;background:' + css(colorOf[t] || '--t7') + ';border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.45)"></div>' }) })
      .bindTooltip(esc(t) + ' home' + (t === 'Spencer Hill' ? ' (assumed)' : '')).addTo(homeLayer);
  }
  hours();
}

function hours() {
  const hk = stage === 0 ? 'h0' : stage === 1 ? 'h1' : 'h2';
  const sk = stage === 0 ? 's0' : stage === 1 ? 's1' : 's2';
  let html = '<tr><th>Technician</th>' + DATA.dates.map(d => '<th>' + DATA.labels[d].slice(0, 3) + '</th>').join('') + '</tr>';
  for (const t of DATA.techs) {
    const row = DATA.perTech[t];
    if (!row) continue;
    html += '<tr><td><span class="sw" style="background:' + css(colorOf[t]) + '"></span>' + esc(t.trim()) + '</td>' +
      DATA.dates.map(d => {
        const c = row[d] || {};
        const h = c[hk] || 0;
        return '<td class="' + (h > 9 ? 'over' : '') + '">' + (h ? h.toFixed(1) : '') + '<span style="color:var(--muted)"> ' + (c[sk] || '') + '</span></td>';
      }).join('') + '</tr>';
  }
  const f = stage === 0 ? DATA.fleet.stage0 : stage === 1 ? DATA.fleet.stage1 : DATA.fleet.stage2;
  html += '<tr><td><b>Fleet</b></td><td colspan="5"><span class="chip">' + f.overtimeHours + ' h over cap</span><span class="chip">' + Math.round(f.km) + ' km</span></td></tr>';
  document.getElementById('hours').innerHTML = html;
}

document.getElementById('day').innerHTML =
  '<button data-v="all" aria-pressed="true">All</button>' +
  DATA.dates.map(d => '<button data-v="' + d + '" aria-pressed="false">' + DATA.labels[d].slice(0, 3) + '</button>').join('');
document.getElementById('legend').innerHTML = DATA.techs.map(t =>
  '<label><input type="checkbox" data-t="' + esc(t) + '" checked><span class="dot" style="background:' + css(colorOf[t]) + '"></span>' + esc(t.trim()) + '</label>').join('');
document.getElementById('blocks').innerHTML = DATA.blocks.length
  ? DATA.blocks.map(b => '<div class="blk"><b>' + esc(b.name) + '</b><br>' + b.customers + ' customer' + (b.customers > 1 ? 's' : '') + ', ' + esc(b.fromTech.trim()) + ' to ' + esc(b.toTech.trim()) + '<br><span class="chip">' + b.kmSaved + ' km saved</span></div>').join('')
  : '<p class="note">No blocks move.</p>';

function seg(id, set) {
  document.getElementById(id).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const x of e.currentTarget.children) x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    set(b.dataset.v);
    draw();
  });
}
seg('stage', v => { stage = Number(v); });
seg('day', v => { day = v; });
document.getElementById('legend').addEventListener('change', e => {
  const t = e.target.dataset.t;
  if (!t) return;
  if (e.target.checked) off.delete(t); else off.add(t);
  draw();
});
document.getElementById('onlyMoved').addEventListener('change', e => { onlyMoved = e.target.checked; draw(); });

draw();
const pts = DATA.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.05));
</script>
</body>
</html>`;

export function renderMap(data) {
  return TEMPLATE.replace('__DATA__', JSON.stringify(data).replace(/</g, '\\u003c'));
}
