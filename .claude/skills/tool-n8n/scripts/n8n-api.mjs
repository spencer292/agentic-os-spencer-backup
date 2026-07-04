#!/usr/bin/env node
// Minimal n8n Public API client. Reads N8N_BASE_URL + N8N_API_KEY from the nearest .env
// (walks up from cwd). Creates workflows INACTIVE by design.
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

const env = loadEnv();
const BASE = (env.N8N_BASE_URL || '').replace(/\/$/, '');
const KEY = env.N8N_API_KEY || '';
if (!BASE || !KEY) {
  console.error('Missing N8N_BASE_URL or N8N_API_KEY in .env (create the key: n8n -> Settings -> n8n API).');
  process.exit(1);
}

async function api(method, p, body) {
  const res = await fetch(`${BASE}/api/v1${p}`, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { console.error(`HTTP ${res.status}:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2)); process.exit(1); }
  return data;
}

const [cmd, a, b] = process.argv.slice(2);
const out = (o) => console.log(JSON.stringify(o, null, 2));

switch (cmd) {
  case 'test': {
    const d = await api('GET', '/workflows?limit=1');
    console.log(`Connected to ${BASE} — ${d.data ? 'OK' : 'unexpected response'}`);
    break;
  }
  case 'list': {
    const d = await api('GET', '/workflows?limit=100');
    for (const w of d.data) console.log(`${w.id}  ${w.active ? 'ACTIVE  ' : 'inactive'}  ${w.name}`);
    if (!d.data.length) console.log('(no workflows yet)');
    break;
  }
  case 'get': out(await api('GET', `/workflows/${a}`)); break;
  case 'create': {
    const wf = JSON.parse(fs.readFileSync(a, 'utf8'));
    const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || {} };
    const d = await api('POST', '/workflows', body);
    console.log(`Created INACTIVE: ${d.id}  ${d.name}`);
    console.log(`Review: ${BASE}/workflow/${d.id}`);
    break;
  }
  case 'update': {
    const wf = JSON.parse(fs.readFileSync(b, 'utf8'));
    const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || {} };
    const d = await api('PUT', `/workflows/${a}`, body);
    console.log(`Updated: ${d.id}  ${d.name}`);
    console.log(`Review: ${BASE}/workflow/${d.id}`);
    break;
  }
  case 'activate': out(await api('POST', `/workflows/${a}/activate`)); break;
  case 'deactivate': out(await api('POST', `/workflows/${a}/deactivate`)); break;
  case 'executions': {
    const d = await api('GET', `/executions?limit=20${a ? `&workflowId=${a}` : ''}`);
    for (const e of d.data) console.log(`${e.id}  ${e.status ?? (e.finished ? 'success' : 'error')}  wf=${e.workflowId}  ${e.startedAt}`);
    if (!d.data.length) console.log('(no executions yet)');
    break;
  }
  default:
    console.log('Usage: n8n-api.mjs test|list|get <id>|create <file.json>|update <id> <file.json>|activate <id>|deactivate <id>|executions [workflowId]');
}
