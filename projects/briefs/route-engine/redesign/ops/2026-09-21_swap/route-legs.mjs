// READ-ONLY: print one driver's route for one date with per-leg distance/time, to see where the kilometres go.
// usage: node route-legs.mjs 2026-09-21 "Spencer Hill"
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8');
const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const [date, driver] = process.argv.slice(2);
const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?date=${date}&key=${K}`)).json();
const rt = (r.routes || []).find(x => x.driverName === driver);
if (!rt) { console.log('no route for', driver, 'on', date); process.exit(0); }
console.log(`${driver} ${date}: ${rt.stops.length} stops, ${rt.duration} min, ${rt.distance} km, start ${rt.routeStart || rt.start || '?'}`);
console.log('#   leg km  leg min  arrival  address');
for (const s of rt.stops) console.log(`${String(s.stopNumber).padStart(2)}  ${(Number(s.distance || 0) / 1000).toFixed(1).padStart(6)}  ${String(Math.round(Number(s.travelTime || 0) / 60)).padStart(7)}  ${String(s.scheduledAtDt || '').slice(11, 16)}  ${(s.address || s.locationName || '').slice(0, 70)}`);
console.log('note: leg = from the previous stop (stop 1 = from the start location); the return leg to the end location is not listed per stop.');
const legs = rt.stops.reduce((a, s) => a + Number(s.distance || 0), 0) / 1000;
console.log(`sum of listed legs ${legs.toFixed(0)} km vs route.distance ${rt.distance} km -> unlisted return leg about ${(Number(rt.distance) - legs).toFixed(0)} km`);
