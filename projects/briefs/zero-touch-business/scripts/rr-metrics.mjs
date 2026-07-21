// rr-metrics.mjs — read Route Ready click counters from the route-ready-metrics
// KV namespace (written by the site Worker's redirect handler). Prints JSON:
// per-path 7-day and lifetime click totals. Read-only.
// Usage: node projects/briefs/zero-touch-business/scripts/rr-metrics.mjs
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');

function readEnv() {
  const envPath = resolve(repoRoot, '.env');
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = readEnv();
const TOKEN = env.CLOUDFLARE_API_TOKEN;
const ACCT = env.CLOUDFLARE_ACCOUNT_ID;
if (!TOKEN || !ACCT) { console.log(JSON.stringify({ error: 'Cloudflare creds missing in .env' })); process.exit(0); }

const api = (path) =>
  fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}${path}`, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });

const nsList = await (await api('/storage/kv/namespaces?per_page=100')).json();
const ns = nsList.success ? nsList.result.find((n) => n.title === 'route-ready-metrics') : null;
if (!ns) { console.log(JSON.stringify({ error: 'route-ready-metrics KV namespace not found — no clicks recorded yet or deploy has not run since tracking was added' })); process.exit(0); }

const keys = await (await api(`/storage/kv/namespaces/${ns.id}/keys?prefix=clicks:&limit=1000`)).json();
if (!keys.success) { console.log(JSON.stringify({ error: 'key list failed: ' + JSON.stringify(keys.errors).slice(0, 200) })); process.exit(1); }

const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const totals = {};
for (const k of keys.result) {
  // key format: clicks:<path>:<YYYY-MM-DD>
  const m = k.name.match(/^clicks:(.+):(\d{4}-\d{2}-\d{2})$/);
  if (!m) continue;
  const [, path, day] = m;
  const val = parseInt(await (await api(`/storage/kv/namespaces/${ns.id}/values/${encodeURIComponent(k.name)}`)).text(), 10) || 0;
  totals[path] = totals[path] || { last_7_days: 0, lifetime: 0 };
  totals[path].lifetime += val;
  if (day >= cutoff) totals[path].last_7_days += val;
}
console.log(JSON.stringify({ checked_at: new Date().toISOString(), clicks: totals }, null, 2));
