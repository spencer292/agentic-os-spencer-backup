// One-off: enable Cory Ventura in OptimoRoute for 2026-10-30 only (cory-fri.mjs needs him available).
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('../../../../../../.env', 'utf8').split(/\r?\n/).map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
const r = await fetch(`https://api.optimoroute.com/v1/update_drivers_parameters?key=${env.OPTIMOROUTE_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: [{ driver: { serial: 'Cory Ventura' }, date: '2026-10-30', enabled: true }] }) });
console.log(JSON.stringify(await r.json()));
