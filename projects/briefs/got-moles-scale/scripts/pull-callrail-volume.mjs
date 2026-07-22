// pull-callrail-volume.mjs — monthly call volume + first-time-caller counts for
// the got-moles-scale diagnostic. Read-only; uses CallRail timeseries + summaries.
// Output: data/callrail-volume.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const key = (process.env.CALLRAIL_API_KEY || process.env.CALLRAIL_API_TOKEN || process.env.CALLRAIL_TOKEN || '').trim();
if (!key) { console.error('No CallRail key in .env'); process.exit(1); }

const api = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } });
  if (!res.ok) throw new Error(`${res.status} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};

const accounts = await api('a.json');
const acct = accounts.accounts[0].id;

// Month list: Aug 2024 -> current month
const months = [];
const d = new Date('2024-08-01T00:00:00Z');
const now = new Date();
while (d <= now) {
  const start = d.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  months.push({ month: start.slice(0, 7), start, end });
  d.setUTCMonth(d.getUTCMonth() + 1);
}

const out = [];
for (const m of months) {
  const s = await api(`a/${acct}/calls/summary.json`, {
    start_date: m.start, end_date: m.end,
    group_by: 'source',
  }).catch((e) => ({ error: String(e.message) }));
  if (s.error) { out.push({ month: m.month, error: s.error }); continue; }
  const total = s.total_results?.total_calls ?? s.grand_totals?.total_calls ?? null;
  const firstTime = s.total_results?.first_time_callers ?? s.grand_totals?.first_time_callers ?? null;
  const bySource = {};
  for (const row of s.results || []) {
    const label = row.key || row.source || 'unknown';
    bySource[label] = row.total_calls ?? row.totals?.total_calls ?? null;
  }
  out.push({ month: m.month, total_calls: total, first_time_callers: firstTime, by_source: bySource });
  await new Promise((r) => setTimeout(r, 600));
  console.log(`${m.month}: total=${total} first_time=${firstTime}`);
}

const dataDir = path.resolve(here, '..', 'data');
mkdirSync(dataDir, { recursive: true });
writeFileSync(path.join(dataDir, 'callrail-volume.json'), JSON.stringify(out, null, 2));
console.log(`Saved ${out.length} months -> data/callrail-volume.json`);
