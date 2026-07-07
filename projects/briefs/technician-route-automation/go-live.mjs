// GO LIVE: flips the weekly parent to real writes and activates the scheduled automation.
// Run yourself:  node projects/briefs/technician-route-automation/go-live.mjs
// Effect: scheduled runs (5am + 6pm Pacific) write real Jobber changes for tomorrow..+7,
// capped at 500 writes/day, freeze-today protected, logging each run to the Notion Route Sync Log.
import fs from 'node:fs';
import path from 'node:path';
function loadEnv() { let dir = process.cwd(); for (let i = 0; i < 6; i++) { const p = path.join(dir, '.env'); if (fs.existsSync(p)) { const env = {}; for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); } return env; } const up = path.dirname(dir); if (up === dir) break; dir = up; } return {}; }
const env = loadEnv();
const BASE = (env.N8N_BASE_URL || '').replace(/\/$/, '');
const NKEY = env.N8N_API_KEY || '';
const H = { 'X-N8N-API-KEY': NKEY, 'Content-Type': 'application/json' };
const CHILD = 'gr8kf904tjC2ckcA', PARENT = 'XLhh2TB89NwSlBRX';
const FILE = 'C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/n8n-parent.json';

let raw = fs.readFileSync(FILE, 'utf8');
const before = raw;
raw = raw.replace('body.dryRun !== undefined ? body.dryRun : true', 'body.dryRun !== undefined ? body.dryRun : false');
raw = raw.replace('body.maxWrites !== undefined ? body.maxWrites : 0', 'body.maxWrites !== undefined ? body.maxWrites : 500');
if (raw === before) { console.error('!! Could not find the dryRun/maxWrites defaults to flip. Aborting — tell Claude.'); process.exit(1); }
const wf = JSON.parse(raw);

const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || {} };
let r = await fetch(`${BASE}/api/v1/workflows/${PARENT}`, { method: 'PUT', headers: H, body: JSON.stringify(body) });
console.log('update parent (dryRun=false, maxWrites=500):', r.status);
if (!r.ok) { console.error(await r.text()); process.exit(1); }

for (const id of [CHILD, PARENT]) {
  r = await fetch(`${BASE}/api/v1/workflows/${id}/activate`, { method: 'POST', headers: H });
  console.log('activate ' + id + ':', r.status);
}
fs.writeFileSync(FILE, JSON.stringify(wf, null, 2));
console.log('\n✅ LIVE. Scheduled 5am + 6pm Pacific. Writes tomorrow..+7 (freeze-today protected), 500/day cap, Notion-logged each run.');
console.log('To pause later: deactivate the "Route Sync WEEKLY (parent)" workflow in n8n.');
