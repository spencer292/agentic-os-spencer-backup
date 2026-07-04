#!/usr/bin/env node
// Minimal OptimoRoute REST client. Reads OPTIMOROUTE_API_KEY from the nearest .env.
// Reads are open; the SKILL gates mutations behind explicit user confirmation.
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = path.join(dir, '.env');
    if (fs.existsSync(p)) {
      const env = {};
      for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) env[m[1]] = m[2].trim();
      }
      return env;
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return {};
}

const KEY = loadEnv().OPTIMOROUTE_API_KEY;
if (!KEY) {
  console.error('Missing OPTIMOROUTE_API_KEY in .env (OptimoRoute app: Administration -> Settings -> WS API).');
  process.exit(1);
}
const BASE = 'https://api.optimoroute.com/v1';

async function call(endpoint, body, extraQuery = '') {
  const url = `${BASE}/${endpoint}?key=${encodeURIComponent(KEY)}${extraQuery}`;
  const res = await fetch(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    console.error(`FAILED (HTTP ${res.status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);
const [cmd, a, b] = process.argv.slice(2);
const out = (o) => console.log(JSON.stringify(o, null, 2));

switch (cmd) {
  case 'test': {
    await call('get_routes', null, `&date=${today()}`);
    console.log('Connected — API key valid.');
    break;
  }
  case 'routes': {
    const d = await call('get_routes', null, `&date=${a || today()}`);
    out(d);
    break;
  }
  case 'raw': {
    if (!a) { console.error('Usage: raw <endpoint> [json-file]'); process.exit(1); }
    const body = b ? JSON.parse(fs.readFileSync(b, 'utf8')) : null;
    out(await call(a.replace(/^\//, ''), body));
    break;
  }
  default:
    console.log('Usage: optimoroute-api.mjs test|routes [YYYY-MM-DD]|raw <endpoint> [json-file]');
}
