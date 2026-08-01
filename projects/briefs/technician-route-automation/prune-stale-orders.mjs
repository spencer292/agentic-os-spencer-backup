#!/usr/bin/env node
// Delete OptimoRoute orders in a window that no longer correspond to a live Jobber visit.
//
// push-week only ever creates/syncs — it has no way to retire an order, so a visit that was
// cancelled, completed early or moved out of the window leaves its stop behind in OptimoRoute.
// Those are the "orphans" drift-check reports: they consume route capacity and drive time for
// customers nobody is visiting (7 of them across 08-03..08-07 on 2026-07-31).
//
// Safety: only touches orderNos matching this automation's own pattern <jobNumber>-<visitId>.
// Anything else in the window is foreign — reported, never deleted (brief rule, 2026-07-10).
//
// Usage: node prune-stale-orders.mjs dry|live <from> <to> --visits=<snapshot.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;

const mode = process.argv[2];
const from = process.argv[3], to = process.argv[4];
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!['dry', 'live'].includes(mode) || !from || !to || !vArg) {
  console.log('Usage: prune-stale-orders.mjs dry|live <from> <to> --visits=<snapshot.json>');
  process.exit(1);
}
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));

// live = every not-yet-complete visit in the snapshot; these are the orders that SHOULD exist
const live = new Set();
for (const v of V) {
  if (v.isComplete) continue;
  let num; try { num = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch {}
  if (num) live.add(`${v.job?.jobNumber}-${num}`);
}
console.log(`snapshot: ${live.size} live visits ${from}..${to}`);

// pull every order OptimoRoute holds in the window
const orders = [];
let after = null;
do {
  const body = { dateRange: { from, to }, includeOrderData: true };
  if (after) body.after_tag = after;
  const r = await (await fetch(`https://api.optimoroute.com/v1/search_orders?key=${K}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })).json();
  if (r.success === false) { console.error('search_orders failed:', JSON.stringify(r).slice(0, 300)); process.exit(1); }
  orders.push(...(r.orders || []));
  after = r.after_tag || null;
} while (after);
console.log(`optimoroute: ${orders.length} orders in window`);

const OURS = /^\d+-\d+$/;
const stale = [], foreign = [];
for (const o of orders) {
  // search_orders nests the order body under `data` — o.orderNo is undefined at the top level,
  // which silently classified all 434 orders as "foreign" on the first run.
  const no = String((o.data && o.data.orderNo) || o.orderNo || '');
  if (!OURS.test(no)) { foreign.push(no); continue; }
  if (!live.has(no)) stale.push(no);
}
console.log(`\nstale (ours, no live Jobber visit): ${stale.length}`);
for (const s of stale.slice(0, 20)) console.log(`   ${s}`);
if (stale.length > 20) console.log(`   ... and ${stale.length - 20} more`);
if (foreign.length) console.log(`foreign orders left untouched: ${foreign.length} — ${foreign.slice(0, 5).join(', ')}`);

// A prune this large means the snapshot is wrong, not that the board emptied. Refuse rather than
// strip a week out of OptimoRoute on a bad file.
if (stale.length > orders.length * 0.5) {
  console.error(`\nABORT: ${stale.length} of ${orders.length} orders look stale — that is a bad snapshot, not a real prune.`);
  process.exit(1);
}
if (!stale.length) { console.log('\nNothing to prune.'); process.exit(0); }
if (mode === 'dry') { console.log('\nDRY — nothing deleted.'); process.exit(0); }

let ok = 0, fail = 0;
for (const no of stale) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/delete_order?key=${K}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: no }),
  })).json();
  if (r.success) ok++; else { fail++; if (fail < 6) console.log('  FAIL', no, r.code || '', r.message || ''); }
  await new Promise(r2 => setTimeout(r2, 120));
}
console.log(`\ndeleted ${ok}, failed ${fail}`);
