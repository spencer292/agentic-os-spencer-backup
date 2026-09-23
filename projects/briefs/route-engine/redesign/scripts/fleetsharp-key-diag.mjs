#!/usr/bin/env node
// Diagnose the saved FleetSharp/Linxup credential WITHOUT printing it: shape only, then try it as a
// bearer token against a read-only endpoint. Masks any token-like string in responses.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2]; }
const k = (env.FLEETSHARP_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const mask = s => s.replace(/[A-Za-z0-9\-_\.]{40,}/g, '<token>');
const parts = k.split('.');
console.log('len', k.length, 'dot-segments', parts.length, 'segment lengths', parts.map(p => p.length).join(','), 'jwt-like', parts.length === 3 && /^eyJ/.test(k));
if (parts.length === 3) {
  try {
    const hdr = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const pl = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    console.log('header', JSON.stringify(hdr));
    console.log('payload keys', Object.keys(pl).join(','), 'exp', pl.exp ? new Date(pl.exp * 1000).toISOString() : 'none', 'iat', pl.iat ? new Date(pl.iat * 1000).toISOString() : 'none', 'iss', pl.iss || 'none');
  } catch { console.log('three segments but not decodable as JWT'); }
}
const tries = [
  ['bearer v3 trackers', 'https://api.linxup.com/pullapi/api/v3/trackers', { headers: { Authorization: 'Bearer ' + k } }],
  ['x-api-key v3 trackers', 'https://api.linxup.com/pullapi/api/v3/trackers', { headers: { 'x-api-key': k } }],
  ['bearer v3 trips (1 day)', 'https://api.linxup.com/pullapi/api/v3/trips?startDate=' + Date.UTC(2026, 8, 16) + '&endDate=' + Date.UTC(2026, 8, 17), { headers: { Authorization: 'Bearer ' + k } }],
];
for (const [name, url, init] of tries) {
  try { const r = await fetch(url, init); const t = mask((await r.text()).slice(0, 300)); console.log(name, '->', r.status, t); }
  catch (e) { console.log(name, '-> error', e.message); }
}
