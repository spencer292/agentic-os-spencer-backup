// render-dashboard.mjs — turns data/dashboard.json into a single self-contained HTML file.
//   node projects/briefs/daily-dashboard/scripts/render-dashboard.mjs
// Output: projects/briefs/daily-dashboard/dashboard.html  (+ a copy on the Desktop)
//
// No network, no libraries, no build step: every number is baked in and every chart is inline
// SVG, so the file works offline from a double-click and keeps working if this repo moves.
// Palette is the validated data-viz default (adjacent-pair CVD and normal-vision floors cleared
// in both light and dark) — do not substitute hexes without re-running the validator.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const briefDir = path.resolve(here, '..');
const dataFile = path.join(briefDir, 'data', 'dashboard.json');
if (!existsSync(dataFile)) {
  console.error('No data/dashboard.json — run pull-dashboard-data.mjs first.');
  process.exit(1);
}
const d = JSON.parse(readFileSync(dataFile, 'utf8'));

// ---------- formatting ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
const money = (v) => (v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US'));
const money0 = (v) => (v >= 10000 ? '$' + Math.round(v / 1000) + 'k' : money(v));
const pct = (v) => (v == null ? '—' : v + '%');
const dayLabel = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
// "Sep 26" reads as the 26th of September, not September 2026 — so months never carry a 2-digit
// year. The reference chart spans four consecutive months, where the year is never in doubt.
const monthShort = (m) => new Date(m + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
const monthLong = (m) => new Date(m + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// Answer rate is the one number with a real threshold behind it, so it gets a status color.
// Status never travels alone: the badge always carries its own text.
const rateStatus = (r) => (r == null ? 'none' : r >= 90 ? 'good' : r >= 80 ? 'warning' : 'critical');

const M = d.metrics;
const P = d.projection;

// ================= charts (inline SVG, drawn here so the page needs no JS to render) =================

// 30-day calls, answered + missed stacked. 2px gap between the two fills, 4px rounded top on the
// upper segment only — the stack reads as one column anchored to the baseline.
function callsChart(series) {
  const W = 940, H = 190, padL = 34, padR = 8, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(4, ...series.map((s) => s.calls));
  const step = iw / series.length;
  const bw = Math.max(6, step - 5);
  const y = (v) => padT + ih - (v / max) * ih;
  let bars = '', ticks = '';
  series.forEach((s, i) => {
    const x = padL + i * step + (step - bw) / 2;
    const aH = (s.answered / max) * ih;
    const mH = (s.missed / max) * ih;
    const base = padT + ih;
    // missed sits on top of answered, separated by a 2px surface gap
    if (s.answered > 0) bars += `<rect class="mk" data-t="${s.date}|${s.calls} calls · ${s.answered} answered · ${s.missed} missed" x="${x.toFixed(1)}" y="${(base - aH).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, aH).toFixed(1)}" rx="${mH > 0 ? 0 : 3}" fill="var(--s1)"/>`;
    if (s.missed > 0) bars += `<rect class="mk" data-t="${s.date}|${s.calls} calls · ${s.answered} answered · ${s.missed} missed" x="${x.toFixed(1)}" y="${(base - aH - mH - 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, mH).toFixed(1)}" rx="3" fill="var(--miss)"/>`;
    if (i % 5 === 0 || i === series.length - 1) ticks += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${dayLabel(s.date)}</text>`;
  });
  let grid = '';
  for (const g of [0, 0.5, 1]) {
    const gy = padT + ih - g * ih;
    grid += `<line class="gr" x1="${padL}" x2="${W - padR}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}"/>`;
    grid += `<text class="ax" x="${padL - 6}" y="${(gy + 4).toFixed(1)}" text-anchor="end">${Math.round(g * max)}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Inbound calls per day, last 30 days, answered and missed">${grid}${bars}${ticks}</svg>`;
}

// 30-day invoiced revenue. One series, so no legend — the section title names it.
function revenueChart(series) {
  const W = 940, H = 150, padL = 44, padR = 8, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(500, ...series.map((s) => s.revenue));
  const step = iw / series.length;
  const bw = Math.max(6, step - 5);
  let bars = '', ticks = '';
  series.forEach((s, i) => {
    const x = padL + i * step + (step - bw) / 2;
    const h = (s.revenue / max) * ih;
    if (s.revenue > 0) bars += `<rect class="mk" data-t="${s.date}|${money(s.revenue)} invoiced" x="${x.toFixed(1)}" y="${(padT + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="3" fill="var(--s1)"/>`;
    if (i % 5 === 0 || i === series.length - 1) ticks += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${dayLabel(s.date)}</text>`;
  });
  let grid = '';
  for (const g of [0, 0.5, 1]) {
    const gy = padT + ih - g * ih;
    grid += `<line class="gr" x1="${padL}" x2="${W - padR}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}"/>`;
    grid += `<text class="ax" x="${padL - 6}" y="${(gy + 4).toFixed(1)}" text-anchor="end">${money0(g * max)}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Invoiced revenue per day, last 30 days">${grid}${bars}${ticks}</svg>`;
}

// Today's calls by hour, business hours only. Two series, legend shared with the 30-day chart.
function hoursChart(hours) {
  const shown = hours.filter((h) => h.hour >= 6 && h.hour <= 20);
  const W = 940, H = 130, padL = 28, padR = 8, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(2, ...shown.map((h) => h.answered + h.missed));
  const step = iw / shown.length;
  const bw = Math.max(10, step - 8);
  let bars = '', ticks = '';
  const base = padT + ih;
  shown.forEach((h, i) => {
    const x = padL + i * step + (step - bw) / 2;
    const aH = (h.answered / max) * ih, mH = (h.missed / max) * ih;
    if (h.answered > 0) bars += `<rect class="mk" data-t="${((h.hour % 12) || 12) + (h.hour < 12 ? 'am' : 'pm')}|${h.answered} answered · ${h.missed} missed" x="${x.toFixed(1)}" y="${(base - aH).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, aH).toFixed(1)}" rx="${mH > 0 ? 0 : 3}" fill="var(--s1)"/>`;
    if (h.missed > 0) bars += `<rect class="mk" data-t="${((h.hour % 12) || 12) + (h.hour < 12 ? 'am' : 'pm')}|${h.answered} answered · ${h.missed} missed" x="${x.toFixed(1)}" y="${(base - aH - mH - 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, mH).toFixed(1)}" rx="3" fill="var(--miss)"/>`;
    ticks += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${(h.hour % 12) || 12}${h.hour < 12 ? 'a' : 'p'}</text>`;
  });
  const gy = padT;
  const grid = `<line class="gr" x1="${padL}" x2="${W - padR}" y1="${base}" y2="${base}"/>`
    + `<line class="gr" x1="${padL}" x2="${W - padR}" y1="${gy}" y2="${gy}"/>`
    + `<text class="ax" x="${padL - 6}" y="${gy + 4}" text-anchor="end">${max}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Today's inbound calls by hour">${grid}${bars}${ticks}</svg>`;
}

// Month projection: one horizontal stack, three parts, each directly labelled. The aqua slot sits
// below 3:1 on the light surface, so visible labels are not optional here — they are the relief.
function projectionBar(p) {
  const parts = [
    { k: 'Invoiced so far', v: p.invoiced_mtd, c: 'var(--s1)', tag: 'known' },
    { k: 'Recurring left to bill', v: p.recurring_to_bill, c: 'var(--s2)', tag: 'estimate' },
    { k: 'Everything else to come', v: p.other_to_come, c: 'var(--s3)', tag: 'estimate' },
  ];
  const total = Math.max(1, parts.reduce((s, x) => s + x.v, 0));
  const W = 940, H = 46;
  let x = 0, bars = '';
  parts.forEach((part, i) => {
    const w = (part.v / total) * W;
    const draw = Math.max(0, w - (i < parts.length - 1 ? 2 : 0)); // 2px surface gap between fills
    const r = i === 0 ? '4' : i === parts.length - 1 ? '4' : '0';
    bars += `<rect class="mk" data-t="${esc(part.k)}|${money(part.v)} · ${Math.round((part.v / total) * 100)}% of the projection" x="${x.toFixed(1)}" y="0" width="${draw.toFixed(1)}" height="${H}" rx="${r}" fill="${part.c}"/>`;
    x += w;
  });
  const legend = parts.map((part) => `<div class="pl"><span class="sw" style="background:${part.c}"></span>
      <div><div class="pl-k">${esc(part.k)} <span class="tag tag-${part.tag}">${part.tag}</span></div>
      <div class="pl-v">${money(part.v)}</div></div></div>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="projbar" role="img" aria-label="Projected month revenue, split into invoiced, recurring still to bill, and run-rate">${bars}</svg>
    <div class="proj-legend">${legend}</div>`;
}

// Last 3 completed months against this month's projection. The projected bar is hatched, not
// solid — an estimate should never look like a measurement sitting next to three facts.
function monthsChart(reference, projected, thisMonth) {
  const rows = [...reference.map((r) => ({ label: monthShort(r.month), v: r.total, est: false })),
    { label: monthShort(thisMonth) + ' (proj)', v: projected, est: true }];
  const W = 940, H = 170, padL = 52, padR = 8, padT = 16, padB = 30;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(1000, ...rows.map((r) => r.v)) * 1.12;
  const step = iw / rows.length;
  const bw = Math.min(150, step - 26);
  let bars = '', labels = '';
  rows.forEach((r, i) => {
    const x = padL + i * step + (step - bw) / 2;
    const h = (r.v / max) * ih;
    const yy = padT + ih - h;
    const fill = r.est ? 'url(#hatch)' : 'var(--s1)';
    bars += `<rect class="mk" data-t="${esc(r.label)}|${money(r.v)}${r.est ? ' projected' : ' invoiced'}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="4" fill="${fill}"${r.est ? ' stroke="var(--s1)" stroke-width="2"' : ''}/>`;
    labels += `<text class="vl" x="${(x + bw / 2).toFixed(1)}" y="${(yy - 6).toFixed(1)}" text-anchor="middle">${money0(r.v)}</text>`;
    labels += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(r.label)}</text>`;
  });
  const base = padT + ih;
  const grid = `<line class="gr" x1="${padL}" x2="${W - padR}" y1="${base}" y2="${base}"/>`;
  const defs = `<defs><pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="var(--s1-soft)"/><line x1="0" y1="0" x2="0" y2="8" stroke="var(--s1)" stroke-width="4"/></pattern></defs>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Invoiced revenue for the last three months against this month's projection">${defs}${grid}${bars}${labels}</svg>`;
}

// ================= page pieces =================

function tile(label, value, sub, status) {
  const cls = status ? ` tile-${status}` : '';
  return `<div class="tile${cls}"><div class="t-l">${esc(label)}</div><div class="t-v">${value}</div>${sub ? `<div class="t-s">${sub}</div>` : ''}</div>`;
}

const compareRows = [
  ['Phone calls', (m) => n(m.calls_total)],
  ['&nbsp;&nbsp;Answered', (m) => n(m.calls_answered)],
  ['&nbsp;&nbsp;Missed', (m) => n(m.calls_missed), 'bad'],
  ['&nbsp;&nbsp;Answer rate', (m) => pct(m.answer_rate)],
  ['Visits completed', (m) => n(m.visits_completed)],
  ['Quotes sent', (m) => n(m.quotes_sent)],
  ['&nbsp;&nbsp;Value quoted', (m) => money(m.quotes_sent_value)],
  ['Quotes converted', (m) => n(m.quotes_converted)],
  ['&nbsp;&nbsp;Value won', (m) => money(m.quotes_converted_value)],
  ['New clients', (m) => n(m.new_clients)],
  ['Jobs created', (m) => n(m.jobs_created)],
  ['Invoiced', (m) => money(m.revenue_invoiced)],
];

// The column ranges are printed because they overlap in a way that looks wrong at a glance: the
// week starts Sunday, so in the first days of a month week-to-date legitimately exceeds
// month-to-date. Showing the actual span turns "that's a bug" into "of course".
const range = (a, b) => (a === b ? dayLabel(a) : `${dayLabel(a)} – ${dayLabel(b)}`);
const compareTable = `<table class="grid">
  <thead><tr><th>Metric</th>
    <th>Today<span class="hsub">${range(d.today, d.today)}</span></th>
    <th>Yesterday<span class="hsub">${range(d.yesterday, d.yesterday)}</span></th>
    <th>Week to date<span class="hsub">${range(d.week_start, d.today)}</span></th>
    <th>Month to date<span class="hsub">${range(d.month_start, d.today)}</span></th></tr></thead>
  <tbody>${compareRows.map(([label, fn, flag]) => `<tr${flag === 'bad' ? ' class="r-bad"' : ''}>
    <td class="rl">${label}</td><td>${fn(M.today)}</td><td>${fn(M.yesterday)}</td><td>${fn(M.wtd)}</td><td>${fn(M.mtd)}</td></tr>`).join('')}
  </tbody></table>`;

const fieldRows = d.field.techs.map((t) => {
  const p = t.scheduled ? (t.complete / t.scheduled) * 100 : 0;
  return `<div class="tech">
    <div class="tech-n">${esc(t.tech)}</div>
    <div class="track"><div class="fill" style="width:${p.toFixed(1)}%"></div></div>
    <div class="tech-c">${t.complete}<span class="muted">/${t.scheduled}</span></div>
  </div>`;
}).join('') || '<p class="empty">No visits scheduled today.</p>';

const collectionsRows = d.collections.top.length
  ? `<table class="grid compact"><thead><tr><th>Client</th><th>Invoice</th><th>Issued</th><th class="num">Balance</th></tr></thead>
     <tbody>${d.collections.top.map((c) => `<tr><td class="rl">${esc(c.client)}</td><td class="muted">#${esc(c.invoice)}</td><td class="muted">${esc(c.issued || '—')}</td><td class="num">${money(c.balance)}</td></tr>`).join('')}</tbody></table>`
  : '<p class="empty">Nothing past due.</p>';

const closeRows = d.close_rate.length
  ? `<table class="grid compact"><thead><tr><th>Salesperson</th><th class="num">Sent</th><th class="num">Converted</th><th class="num">Close rate</th><th class="num">Value won</th></tr></thead>
     <tbody>${d.close_rate.map((r) => `<tr><td class="rl">${esc(r.who)}</td><td class="num">${n(r.sent)}</td><td class="num">${n(r.converted)}</td><td class="num">${pct(r.rate)}</td><td class="num">${money(r.value)}</td></tr>`).join('')}</tbody></table>`
  : '<p class="empty">No quotes sent in the last 30 days.</p>';

const qfRows = d.qf.overrun.length
  ? `<table class="grid compact"><thead><tr><th>Client</th><th class="num">Job</th><th class="num">Visits</th><th class="num">Over</th><th>Started</th></tr></thead>
     <tbody>${d.qf.overrun.slice(0, 20).map((q) => `<tr><td class="rl">${esc(q.client)}</td><td class="num muted">#${esc(q.job)}</td><td class="num">${q.visits}</td><td class="num bad">+${q.over}</td><td class="muted">${esc(q.started || '—')}</td></tr>`).join('')}</tbody></table>
     ${d.qf.overrun.length > 20 ? `<p class="empty">…and ${d.qf.overrun.length - 20} more.</p>` : ''}`
  : '<p class="empty">No Quick Fix job is past its 5 visits.</p>';

const netNew = d.tmcp.net_new_mtd;

// ================= document =================
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Got Moles — Daily Check-In</title>
<style>
:root{
  color-scheme: light dark;
  --page:#f9f9f7; --surface:#fcfcfb; --line:#e6e5e1;
  --ink:#0b0b0b; --ink2:#52514e; --ink3:#84837d;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --miss:#e34948;
  --s1-soft:#dbe8f8; --track:#eceae5;
  --good:#0ca30c; --warning:#fab219; --critical:#d03b3b;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --page:#0d0d0d; --surface:#1a1a19; --line:#2e2e2c;
    --ink:#ffffff; --ink2:#c3c2b7; --ink3:#8d8c84;
    --s1:#3987e5; --s2:#d95926; --s3:#199e70; --miss:#e66767;
    --s1-soft:#16273a; --track:#2a2a28;
  }
}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);
  font:15px/1.5 ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;padding:0 0 56px}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
header{padding:30px 0 22px}
h1{margin:0;font-size:26px;font-weight:650;letter-spacing:-.02em}
.stamp{color:var(--ink2);font-size:13px;margin-top:5px}
.stamp b{color:var(--ink);font-weight:600}
h2{font-size:13px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink2);margin:0 0 12px}
section{background:var(--surface);border:1px solid var(--line);border-radius:12px;
  padding:20px;margin-bottom:16px}
.sub{color:var(--ink2);font-size:13px;margin:-4px 0 14px}

/* hero tiles */
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.t-l{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink2)}
.t-v{font-size:34px;font-weight:660;letter-spacing:-.03em;margin-top:6px;line-height:1.05;
  font-variant-numeric:tabular-nums}
.t-s{font-size:13px;color:var(--ink2);margin-top:5px}
.tile-good .t-v{color:var(--good)} .tile-warning .t-v{color:var(--warning)}
.tile-critical .t-v{color:var(--critical)}

/* tables */
table.grid{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
table.grid th{font-size:12px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;
  color:var(--ink2);text-align:right;padding:0 0 9px;border-bottom:1px solid var(--line)}
table.grid th:first-child{text-align:left}
.hsub{display:block;font-weight:400;text-transform:none;letter-spacing:0;
  color:var(--ink3);font-size:11px;margin-top:2px}
table.grid td{padding:8px 0;text-align:right;border-bottom:1px solid var(--line);font-size:15px}
table.grid td.rl{text-align:left;color:var(--ink2)}
table.grid tr:last-child td{border-bottom:0}
table.grid.compact td,table.grid.compact th{font-size:14px}
table.grid td.num{text-align:right}
table.grid th.num{text-align:right}
.r-bad td:not(.rl){color:var(--critical);font-weight:600}
.muted{color:var(--ink3)} .bad{color:var(--critical);font-weight:600}
.scroll{overflow-x:auto}

/* charts */
svg{display:block;width:100%;height:auto;overflow:visible}
.gr{stroke:var(--line);stroke-width:1}
.ax{fill:var(--ink3);font-size:11px}
.vl{fill:var(--ink2);font-size:12px;font-weight:600}
.mk{cursor:default}
.legend{display:flex;gap:18px;margin:0 0 12px;font-size:13px;color:var(--ink2)}
.legend span.sw,.sw{width:11px;height:11px;border-radius:3px;display:inline-block;
  margin-right:7px;vertical-align:-1px;flex:0 0 auto}

/* projection */
.projbar{height:46px;margin-bottom:14px}
.proj-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
.pl{display:flex;gap:9px;align-items:flex-start}
.pl .sw{margin-top:4px}
.pl-k{font-size:13px;color:var(--ink2)}
.pl-v{font-size:19px;font-weight:640;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.tag{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  padding:1px 5px;border-radius:4px;vertical-align:1px}
.tag-known{background:var(--s1-soft);color:var(--s1)}
.tag-estimate{background:var(--track);color:var(--ink3)}
.hero{font-size:44px;font-weight:680;letter-spacing:-.035em;margin:2px 0 4px;
  font-variant-numeric:tabular-nums}

/* field board */
.tech{display:grid;grid-template-columns:140px 1fr 64px;gap:12px;align-items:center;
  padding:7px 0;border-bottom:1px solid var(--line)}
.tech:last-child{border-bottom:0}
.tech-n{font-size:14px}
.tech-c{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.track{height:12px;background:var(--track);border-radius:6px;overflow:hidden}
.fill{height:100%;background:var(--s1);border-radius:6px}
.empty{color:var(--ink3);font-size:14px;margin:4px 0 0}

.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.two > section{margin-bottom:0}
@media(max-width:820px){.two{grid-template-columns:1fr}
  .tech{grid-template-columns:100px 1fr 56px}}

footer{color:var(--ink3);font-size:12px;padding:8px 0 0;line-height:1.7}
code{background:var(--track);padding:1px 6px;border-radius:4px;font-size:12px}

#tip{position:fixed;pointer-events:none;opacity:0;transition:opacity .1s;
  background:var(--ink);color:var(--page);padding:7px 10px;border-radius:7px;
  font-size:12.5px;line-height:1.45;z-index:9;max-width:240px;box-shadow:0 4px 14px rgba(0,0,0,.18)}
#tip b{display:block;font-weight:650;margin-bottom:1px}
</style>
</head>
<body>
<div id="tip"></div>
<div class="wrap">

<header>
  <h1>Daily check-in</h1>
  <div class="stamp"><b>${esc(d.generated_at_pt)}</b> · numbers are live as of this pull ·
    double-click <code>Refresh-Dashboard.bat</code> to re-pull</div>
</header>

<div class="tiles">
  ${tile('Calls today', n(M.today.calls_total), `${n(M.yesterday.calls_total)} yesterday`)}
  ${tile('Answered', n(M.today.calls_answered), pct(M.today.answer_rate) + ' answer rate', rateStatus(M.today.answer_rate))}
  ${tile('Missed', n(M.today.calls_missed), `${n(M.yesterday.calls_missed)} yesterday`, M.today.calls_missed === 0 ? 'good' : M.today.answer_rate < 85 ? 'critical' : 'warning')}
  ${tile('Visits today', `${d.field.complete}<span class="muted" style="font-size:22px">/${d.field.scheduled}</span>`, 'done / scheduled')}
  ${tile('Quotes sent today', n(M.today.quotes_sent), money(M.today.quotes_sent_value) + ' quoted')}
  ${tile('TMCP jobs', n(d.tmcp.active), money(d.tmcp.mrr) + '/mo recurring')}
</div>

<section>
  <h2>Projected income — ${esc(monthLong(d.today.slice(0, 7)))}</h2>
  <div class="hero">${money(P.total)}</div>
  <p class="sub">Day ${P.day_of_month} of ${P.days_in_month} — but only <b>${pct(P.shape_frac)}</b> of a typical
    month's billing is done by now, not ${pct(P.days_frac)}. Invoicing here runs in batches, so the projection is
    ${money(P.invoiced_mtd)} already billed plus what an average month
    (${money(P.avg_month)}, from the last ${P.basis_months}) still has left to bill at this point in its shape.
    It gets more certain every day and lands on the real number by month end.</p>
  ${projectionBar(P)}
</section>

<section>
  <h2>This month against the last three</h2>
  <p class="sub">Solid bars are invoiced fact. The hatched bar is this month's projection — treat it as a direction, not a number.</p>
  ${monthsChart(d.reference, P.total, d.today.slice(0, 7))}
</section>

<section>
  <h2>Today · yesterday · week · month</h2>
  <div class="scroll">${compareTable}</div>
</section>

<section>
  <h2>Inbound calls — last 30 days</h2>
  <div class="legend">
    <span><span class="sw" style="background:var(--s1)"></span>Answered</span>
    <span><span class="sw" style="background:var(--miss)"></span>Missed</span>
  </div>
  ${callsChart(d.series)}
</section>

<section>
  <h2>Today by the hour</h2>
  <p class="sub">Where the misses land tells you whether it is a coverage problem or a volume problem.</p>
  <div class="legend">
    <span><span class="sw" style="background:var(--s1)"></span>Answered</span>
    <span><span class="sw" style="background:var(--miss)"></span>Missed</span>
  </div>
  ${hoursChart(d.hours)}
</section>

<div class="two">
  <section>
    <h2>Today's field board</h2>
    <p class="sub">${d.field.complete} of ${d.field.scheduled} visits closed out.</p>
    ${fieldRows}
  </section>
  <section>
    <h2>TMCP health</h2>
    <div class="tiles" style="grid-template-columns:1fr 1fr;margin:0">
      ${tile('Active jobs', n(d.tmcp.active), '')}
      ${tile('Recurring / mo', money(d.tmcp.mrr), '')}
      ${tile('New this month', n(d.tmcp.new_mtd), '')}
      ${tile('Net new', (netNew >= 0 ? '+' : '') + n(netNew), `${n(d.tmcp.ended_mtd)} ended`, netNew < 0 ? 'critical' : 'good')}
    </div>
  </section>
</div>

<section>
  <h2>Money at risk</h2>
  <p class="sub">${money(d.collections.total)} past due across ${n(d.collections.count)} invoices. Largest first.</p>
  <div class="scroll">${collectionsRows}</div>
</section>

<section>
  <h2>Quotes → close, last 30 days</h2>
  <p class="sub">Credited to whoever the quote is assigned to in Jobber. A job booked on the call with no
    quote never appears here, so a low count is not the same as a low close rate.</p>
  <div class="scroll">${closeRows}</div>
</section>

<section>
  <h2>Quick Fix past 5 visits</h2>
  <p class="sub">${n(d.qf.overrun.length)} of ${n(d.qf.active)} active Quick Fix jobs have run past the 5-visit series.
    Nothing in Jobber stops this — each one is a sales decision: add a visit, or sell the month or a TMCP.</p>
  <div class="scroll">${qfRows}</div>
</section>

<section>
  <h2>Invoiced per day — last 30 days</h2>
  ${revenueChart(d.series)}
</section>

<footer>
  Pulled from Jobber and CallRail at ${esc(d.generated_at_pt)} ·
  ${n(d.counts.calls)} calls, ${n(d.counts.invoices)} invoices, ${n(d.counts.quotes)} quotes,
  ${n(d.counts.visits)} visits, ${n(d.counts.jobs_active)} active jobs scanned.<br>
  Week starts Sunday, matching the Ninety scorecard. All dates are Pacific.
  Metric definitions match <code>ninety-weekly-push.mjs</code>, so this page and the Ninety board cannot disagree.
</footer>

</div>
<script>
// Hover layer. Every mark carries "title|detail" in data-t; the tooltip is the only JS on the page,
// so the numbers still render with scripting off.
(function(){
  var tip=document.getElementById('tip');
  function show(e){
    var t=e.target.getAttribute&&e.target.getAttribute('data-t');
    if(!t){hide();return;}
    var p=t.split('|');
    tip.innerHTML='<b>'+p[0]+'</b>'+(p[1]||'');
    tip.style.opacity='1';
    var x=e.clientX+14,y=e.clientY+16;
    var r=tip.getBoundingClientRect();
    if(x+r.width>window.innerWidth-8)x=e.clientX-r.width-14;
    if(y+r.height>window.innerHeight-8)y=e.clientY-r.height-14;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function hide(){tip.style.opacity='0';}
  document.addEventListener('mousemove',show);
  document.addEventListener('mouseleave',hide);
})();
</script>
</body>
</html>`;

const outFile = path.join(briefDir, 'dashboard.html');
writeFileSync(outFile, html);
console.log(`Wrote ${outFile}`);

// Drop a copy on the Desktop so the daily check-in is one double-click, not a folder hunt.
// On this machine the Desktop is redirected into OneDrive, so the plain path does not exist —
// check the redirected location first and fall back to the classic one.
const desktop = [
  path.join(os.homedir(), 'OneDrive', 'Desktop'),
  path.join(os.homedir(), 'Desktop'),
].find(existsSync);
if (desktop) {
  const dst = path.join(desktop, 'Got-Moles-Daily.html');
  copyFileSync(outFile, dst);
  console.log(`Copied  ${dst}`);

  // A launcher next to it, so a mid-day refresh is also one double-click. The in-repo .bat walks
  // up three folders to find the root; a Desktop copy has no such anchor, so the path is baked in
  // here at render time — which also means it self-heals if the repo ever moves.
  const repoRoot = path.resolve(briefDir, '../../..');
  const launcher = [
    '@echo off',
    'REM Refreshes the Got Moles daily dashboard, then opens it.',
    'REM Written by render-dashboard.mjs - edit that, not this.',
    `cd /d "${repoRoot}"`,
    'echo.',
    'echo   Refreshing from Jobber and CallRail. Takes a few minutes.',
    'echo.',
    'node "projects\\briefs\\daily-dashboard\\scripts\\pull-dashboard-data.mjs" || goto :failed',
    'node "projects\\briefs\\daily-dashboard\\scripts\\render-dashboard.mjs" || goto :failed',
    `start "" "${path.join(desktop, 'Got-Moles-Daily.html')}"`,
    'exit /b 0',
    ':failed',
    'echo.',
    'echo   Refresh FAILED - see the message above.',
    'echo   If it mentions the Jobber token, run this once and follow the browser prompt:',
    'echo     node .claude\\skills\\tool-jobber\\scripts\\jobber-api.mjs auth',
    'echo.',
    'pause',
    'exit /b 1',
    '',
  ].join('\r\n');
  const lp = path.join(desktop, 'Refresh-Got-Moles-Dashboard.bat');
  writeFileSync(lp, launcher);
  console.log(`Wrote   ${lp}`);
} else {
  console.log('No Desktop folder found — the dashboard is still written above.');
}
