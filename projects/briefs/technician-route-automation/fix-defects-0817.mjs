#!/usr/bin/env node
// CLEAR THE BOARD DEFECTS ON THE WEEK OF 2026-08-17, ahead of the five-way cut's route plan.
//
// 1. MISSING POSTAL CODE (real, fixed here). Every territory lookup keys off the zip, so a property
//    with no postal code resolves to no region: no owner, no route-day, silently dropped from the
//    plan. #8351 Lakemont Community Association is the live case.
//
// 2. WEEKEND VISITS (checked, none). Got Moles works Mon-Fri, so a Sat/Sun visit is a defect
//    (Spencer 2026-07-26) — but the three "Saturday 08-22" visits carried in the 08-12 review do
//    NOT exist. Jobber returns startAt in UTC and Pacific is UTC-7, so any visit starting after
//    17:00 PT reads as the NEXT DAY in the raw string: #8230 at 2026-08-22T01:00Z is Friday 08-21
//    18:00 PT. Deriving a weekday from `startAt.slice(0,10)` invents weekend work that is not
//    there, and would have "fixed" three visits by moving them off a day they were never on.
//    This script asserts the real count in Pacific instead of trusting the raw date.
//
// Usage: node fix-defects-0817.mjs dry|live

import '../route-engine/lib/write-gate.mjs';  // route-engine write gate — MUST be the first import (spec v2 Part 7 Step 1)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const mode = process.argv[2];
if (!['dry', 'live'].includes(mode)) { console.log('Usage: fix-defects-0817.mjs dry|live'); process.exit(1); }

const env = {};
for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
  fs.writeFileSync(ENV_PATH, fs.readFileSync(ENV_PATH, 'utf8').replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token));
}
const tok = tr.access_token;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Jobber throttles on query COST and answers THROTTLED rather than 429. A wide nested selection
// over a big page stays throttled however long you back off — keep pages small AND back off.
const gql = async (query, attempt = 0) => {
  const r = await fetch('https://api.getjobber.com/api/graphql', {
    method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  if (d.errors) {
    if (d.errors.some(e => e.extensions?.code === 'THROTTLED') && attempt < 8) {
      const wait = Math.min(60000, 2000 * 2 ** attempt);
      console.log(`  jobber throttled — backoff ${wait / 1000}s`);
      await sleep(wait); return gql(query, attempt + 1);
    }
    throw new Error(JSON.stringify(d.errors).slice(0, 400));
  }
  return d.data;
};

console.log(`FIX DEFECTS (${mode.toUpperCase()})  week of 2026-08-17\n`);

// ---------- 1. weekend check, in Pacific ----------
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'week-0817-live.json'), 'utf8'));
const ptOf = iso => new Date(new Date(iso).getTime() - 7 * 3600e3).toISOString();
const dowOf = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00:00Z').getUTCDay()];
const weekend = snap.filter(v => ['Sat', 'Sun'].includes(dowOf(ptOf(v.startAt).slice(0, 10))));
console.log('--- weekend visits (Pacific) ---');
console.log(`  ${weekend.length} found${weekend.length ? ': ' + weekend.map(v => '#' + v.job.jobNumber).join(', ') : ' — board is clean Mon-Fri'}`);
const late = snap.filter(v => ptOf(v.startAt).slice(11, 16) >= '17:30');
console.log(`  ${late.length} visit(s) start after 17:30 PT (${late.map(v => '#' + v.job.jobNumber).join(', ')}) — the route plan re-times these into the work window`);

// ---------- 2. missing postal code ----------
console.log('\n--- missing postal code ---');
const ZIPFIX = [{ job: 8351, zip: '98006', why: 'Lakemont Blvd SE, Bellevue — Lakemont is 98006 (Bellevue South -> Tavis)' }];
let zipped = 0, failed = 0;
for (const z of ZIPFIX) {
  // Resolve the property through the visit already held in the week snapshot: a date-filtered
  // visits query would have to page the whole week to find one job, at real throttle cost.
  const hit = snap.find(x => x.job?.jobNumber === z.job);
  if (!hit) { console.log(`  #${z.job} not in the week snapshot — skipping`); continue; }
  const v = (await gql(`query { visit(id: "${hit.id}") { property { id address { street city postalCode } } } }`)).visit;
  const a = v.property.address;
  console.log(`  #${z.job} ${a.street}, ${a.city} — postalCode "${a.postalCode || ''}" -> "${z.zip}"   ${z.why}`);
  if (a.postalCode) { console.log('     already set — no write'); continue; }
  if (mode !== 'live') continue;
  // propertyEdit takes `input: PropertyEditInput`, not `attributes` — the visit mutations' shape
  // does not carry over here.
  const r = await gql(`mutation { propertyEdit(propertyId: "${v.property.id}", input: { address: { postalCode: "${z.zip}" } }) { userErrors { message } property { address { postalCode } } } }`);
  const errs = r.propertyEdit?.userErrors || [];
  if (errs.length) { console.log(`     FAILED: ${errs.map(e => e.message).join('; ')}`); failed++; }
  else { console.log(`     -> ${r.propertyEdit.property.address.postalCode}`); zipped++; }
}

console.log(`\n${mode === 'live' ? 'DONE' : 'DRY RUN'}: ${zipped} postal code(s) set, ${failed} failed, ${weekend.length} weekend defect(s) outstanding.`);
