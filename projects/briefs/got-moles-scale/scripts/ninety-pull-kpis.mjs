// Pull Ninety.io teams + full KPI/measurable list. Run from repo root:
//   node projects/briefs/got-moles-scale/scripts/ninety-pull-kpis.mjs
// Reads NINETY_API_TOKEN from the repo-root .env; never prints the token.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const env = readFileSync(join(root, '.env'), 'utf8');
const m = env.match(/^NINETY_API_TOKEN=(.+)$/m);
if (!m) {
  console.error('NINETY_API_TOKEN not found in .env');
  process.exit(1);
}
const token = m[1].trim().replace(/^["']|["']$/g, '');

const BASE = 'https://api.public.ninety.io/v1';
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

const teams = await call('GET', '/teams');
console.log(`Teams: ${JSON.stringify(teams).slice(0, 2000)}`);

// Page through all KPIs (active + archived not filtered — default query)
const all = [];
let pageIndex = 0;
for (;;) {
  const page = await call('POST', '/scorecard/kpis/query', { pageIndex, pageSize: 100 });
  const items = page?.items ?? page?.data ?? (Array.isArray(page) ? page : []);
  all.push(...items);
  if (!items.length || items.length < 100) break;
  pageIndex++;
  if (pageIndex > 20) break;
}

console.log(`\nKPIs found: ${all.length}`);
for (const k of all) {
  console.log(
    `- [${k.periodInterval ?? '?'}] "${k.title}" | unit=${k.unit ?? '?'} | owner=${k.userFullName ?? '?'} | type=${k.type ?? '?'} | id=${k._id ?? k.id}`
  );
}

const outDir = join(root, 'projects/briefs/got-moles-scale/data');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, '2026-07-22_ninety-kpis.json');
writeFileSync(outFile, JSON.stringify({ teams, kpis: all }, null, 2));
console.log(`\nSaved: ${outFile}`);
