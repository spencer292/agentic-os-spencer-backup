// Verify CallRail API access. Prints account/company info and masked key name only —
// never the key value.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const KEY_NAMES = ['CALLRAIL_API_KEY', 'CALLRAIL_KEY', 'CALLRAIL_TOKEN', 'CALLRAIL_API_TOKEN'];
const keyName = KEY_NAMES.find((n) => process.env[n]);
if (!keyName) {
  console.log('FAIL: no CallRail key found in .env (looked for: ' + KEY_NAMES.join(', ') + ')');
  process.exit(1);
}
const key = process.env[keyName].trim().replace(/^["']|["']$/g, '');
console.log(`Key found: ${keyName} (${key.slice(0, 4)}...${key.slice(-4)}, ${key.length} chars)`);

const api = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};

// 1. Accounts
const accounts = await api('a.json');
console.log(`\nAccounts (${accounts.total_records}):`);
for (const a of accounts.accounts) console.log(`  - ${a.id}: ${a.name}`);

const acct = accounts.accounts[0].id;

// 2. Companies
const companies = await api(`a/${acct}/companies.json`);
console.log(`\nCompanies (${companies.total_records}):`);
for (const c of companies.companies) console.log(`  - ${c.id}: ${c.name} (${c.status})`);

// 3. Recent calls — check volume, duration, recording + transcript availability
const calls = await api(`a/${acct}/calls.json`, {
  start_date: '2026-06-20',
  end_date: '2026-07-20',
  per_page: '250',
  fields: 'recording,recording_duration,call_highlights',
});
const list = calls.calls || [];
const over90 = list.filter((c) => (c.duration || 0) > 90);
const recorded = over90.filter((c) => c.recording);
console.log(`\nLast 30 days: ${calls.total_records} total calls (page 1 sample: ${list.length})`);
console.log(`  >90s: ${over90.length} of sample | with recording: ${recorded.length}`);

// 4. Probe transcript availability on one recorded call
if (recorded.length) {
  const id = recorded[0].id;
  let ok = false;
  for (const probe of [
    { p: `a/${acct}/calls/${id}.json`, params: { fields: 'transcription' }, pick: (j) => j.transcription },
    { p: `a/${acct}/calls/${id}/transcription.json`, params: {}, pick: (j) => j.transcription || j },
  ]) {
    try {
      const j = await api(probe.p, probe.params);
      const t = probe.pick(j);
      if (t) {
        const text = typeof t === 'string' ? t : JSON.stringify(t);
        console.log(`\nTranscript AVAILABLE via ${probe.p} — sample: ${text.slice(0, 200)}...`);
        ok = true;
        break;
      }
    } catch (e) {
      console.log(`  (probe ${probe.p}: ${String(e.message).slice(0, 120)})`);
    }
  }
  if (!ok) console.log('\nNo API transcript found — will fall back to downloading recordings + local transcription.');
} else {
  console.log('\nNo recorded calls in sample — check whether call recording is enabled.');
}
console.log('\nDONE');
