// Download all CallRail transcripts for calls > 90s in a date range.
// Writes data/calls.jsonl (one call per line: metadata + transcript) and data/fetch-summary.json.
// Resumable: skips call IDs already present in calls.jsonl.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const dataDir = path.resolve(here, '../data');
const outFile = path.join(dataDir, 'calls.jsonl');

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const key = (process.env.CALLRAIL_API_KEY || '').trim();
if (!key) { console.error('CALLRAIL_API_KEY missing'); process.exit(1); }

const ACCT = 'ACC019dc0126ade7956850fbd40239646af';
const START = '2025-07-20';
const END = '2026-07-20';
const MIN_SECONDS = 90;
const THROTTLE_MS = 550; // ~110 req/min, under CallRail's 120/min limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, params = {}, attempt = 0) {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`${res.status} on ${p} after 5 retries`);
    const wait = Math.min(60000, 2000 * 2 ** attempt);
    console.log(`  ${res.status} — backing off ${wait / 1000}s`);
    await sleep(wait);
    return api(p, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Resume support
const done = new Set();
if (existsSync(outFile)) {
  for (const line of readFileSync(outFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch {}
  }
  console.log(`Resuming — ${done.size} calls already saved`);
}

// 1. Page through the full call list
console.log(`Listing calls ${START} → ${END} ...`);
const all = [];
let page = 1;
while (true) {
  const j = await api(`a/${ACCT}/calls.json`, {
    start_date: START, end_date: END, per_page: '250', page: String(page),
    fields: 'recording_duration',
  });
  all.push(...(j.calls || []));
  console.log(`  page ${page}/${j.total_pages} — ${all.length}/${j.total_records}`);
  if (page >= j.total_pages) break;
  page++;
  await sleep(THROTTLE_MS);
}

const eligible = all.filter((c) => (c.duration || 0) > MIN_SECONDS);
console.log(`\nTotal calls: ${all.length} | >${MIN_SECONDS}s: ${eligible.length} | already fetched: ${done.size}`);

// 2. Fetch transcript per eligible call
let saved = 0, noTranscript = 0, errors = 0;
for (let i = 0; i < eligible.length; i++) {
  const c = eligible[i];
  if (done.has(c.id)) continue;
  try {
    const full = await api(`a/${ACCT}/calls/${c.id}.json`, { fields: 'transcription,call_highlights' });
    const rec = {
      id: c.id,
      start: c.start_time,
      duration: c.duration,
      direction: c.direction,
      answered: c.answered,
      customer_name: c.customer_name,
      customer_city: c.customer_city,
      source: c.source,
      first_call: c.first_call,
      transcription: full.transcription || null,
      highlights: full.call_highlights || null,
    };
    if (!rec.transcription) noTranscript++;
    appendFileSync(outFile, JSON.stringify(rec) + '\n');
    saved++;
  } catch (e) {
    errors++;
    console.log(`  ERROR ${c.id}: ${String(e.message).slice(0, 120)}`);
  }
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${eligible.length} processed (saved ${saved}, no-transcript ${noTranscript}, errors ${errors})`);
  await sleep(THROTTLE_MS);
}

const summary = {
  range: { start: START, end: END },
  total_calls: all.length,
  eligible_over_90s: eligible.length,
  saved_this_run: saved,
  already_had: done.size,
  no_transcript: noTranscript,
  errors,
};
writeFileSync(path.join(dataDir, 'fetch-summary.json'), JSON.stringify(summary, null, 2));
console.log('\nSUMMARY: ' + JSON.stringify(summary));
console.log('DONE');
