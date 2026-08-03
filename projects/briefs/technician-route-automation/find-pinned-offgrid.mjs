#!/usr/bin/env node
// Every visit whose COMMITTED day disagrees with its grid day. These are the stops that look
// misplaced in OptimoRoute but are not grid errors — the customer has an arrival window on that
// day and push-week's pin rule is holding them there deliberately.
//
// Built 2026-08-01 after Aaron Rutledge (#8206) and Oscar Alvarado (#8222) were each reported as
// needing a "zip move" when both zips were already correct. Moving one of these is a decision to
// void a promised window, and the customer has to be told — the pipeline cannot do that.
//
// Usage: node find-pinned-offgrid.mjs --visits=<snapshot.json> --grid=<grid.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=')[1];
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, arg('visits')), 'utf8'));
const G = JSON.parse(fs.readFileSync(path.resolve(__dirname, arg('grid')), 'utf8'));
const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const rows = [];
for (const v of V) {
  if (v.isComplete) continue;
  const jn = String(v.job?.jobNumber);
  const zip = (v.property?.address?.postalCode || '').trim().slice(0, 5);
  const ov = G.jobOverrides?.[jn], z = G.zips[zip];
  const want = (ov && (ov.days || (ov.day && [ov.day]))) || (z && (z.days || (z.day && [z.day])));
  if (!want) continue;
  const startHM = pt(v.startAt).slice(11, 16);
  const winH = v.endAt ? (new Date(v.endAt) - new Date(v.startAt)) / 3600000 : null;
  const isSet = v.job?.startAt ? pt(v.job.startAt).slice(0, 10) === pt(v.startAt).slice(0, 10) : false;
  const committed = startHM !== '00:00' && winH !== null && winH <= 6;
  if (!committed && !isSet) continue;
  const day = DOW[new Date(pt(v.startAt).slice(0, 10) + 'T12:00:00Z').getUTCDay()];
  if (want.includes(day)) continue;
  rows.push({
    jn, title: v.title, city: v.property?.address?.city, zip,
    on: `${pt(v.startAt).slice(0, 10)} (${day})`,
    window: `${startHM}-${winH !== null ? pt(v.endAt).slice(11, 16) : '?'}`,
    want: want.join('/'), wantTech: ov?.tech || z?.tech, kind: isSet ? 'SET' : 'committed',
  });
}

rows.sort((a, b) => a.on.localeCompare(b.on) || a.jn.localeCompare(b.jn));
console.log(`visits held off their grid day by a customer promise: ${rows.length}\n`);
for (const r of rows)
  console.log(`  #${r.jn.padEnd(5)} ${(r.title || '').slice(0, 26).padEnd(28)} ${r.city || ''} ${r.zip}`
    + `\n         on ${r.on} ${r.window}  [${r.kind}]   grid wants ${r.want}/${r.wantTech}`);
console.log('\nMoving any of these voids the customer\'s window. Nothing here is a grid error.');
