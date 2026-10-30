// callrail-meta-trackers.mjs — list CallRail trackers that look like Facebook/Meta, with their
// number, status, source and call history. Read-only.
//   node projects/briefs/meta-ads/scripts/callrail-meta-trackers.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const env = {};
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const KEY = env.CALLRAIL_API_KEY || env.CALLRAIL_API_TOKEN || env.CALLRAIL_TOKEN;
const H = { Authorization: `Token token="${KEY}"` };
const get = async (p) => { const r = await fetch(`https://api.callrail.com/v3/${p}`, { headers: H }); if (!r.ok) throw new Error(`${r.status} ${p}`); return r.json(); };

const acct = (await get('a.json')).accounts[0].id;
const { trackers } = await get(`a/${acct}/trackers.json?per_page=250`);
for (const t of trackers.filter((x) => /face|meta|insta|social|\bfb\b/i.test(`${x.name} ${JSON.stringify(x.source || {})}`))) {
  const first = await get(`a/${acct}/calls.json?tracker_id=${t.id}&date_range=all_time&per_page=1&sort=start_time&order=asc&fields=start_time`);
  const last = await get(`a/${acct}/calls.json?tracker_id=${t.id}&date_range=all_time&per_page=1&sort=start_time&order=desc&fields=start_time`);
  console.log(JSON.stringify({
    name: t.name, status: t.status, type: t.type, numbers: t.tracking_numbers, source: t.source,
    destination: t.destination_number, created: t.created_at, totalCalls: first.total_records,
    firstCall: first.calls?.[0]?.start_time, lastCall: last.calls?.[0]?.start_time,
  }, null, 1));
}
