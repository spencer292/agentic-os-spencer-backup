#!/usr/bin/env node
// Throwaway probe: what does get_routes actually return on this account, and does any
// endpoint expose a driver's start location? READ-ONLY.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const env = {};
for (const l of fs.readFileSync(path.join(REPO, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;

for (const date of ['2026-08-10', '2026-08-11', '2026-08-12']) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  console.log(`\n=== get_routes ${date} === success=${r.success} routes=${(r.routes || []).length}`);
  if (r.routes?.length) {
    const rt = r.routes[0];
    console.log('route keys:', Object.keys(rt).join(', '));
    const { stops, ...rest } = rt;
    console.log('route (no stops):', JSON.stringify(rest).slice(0, 700));
    if (stops?.length) console.log('first stop keys:', Object.keys(stops[0]).join(', '), '\nfirst stop:', JSON.stringify(stops[0]).slice(0, 500));
    console.log('drivers today:', r.routes.map(x => x.driverSerial || x.driverName).join(' | '));
    break;
  } else if (!r.success) console.log(JSON.stringify(r).slice(0, 300));
}
