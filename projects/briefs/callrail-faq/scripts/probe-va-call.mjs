// Probe what CallRail's API exposes for recent Voice Assist calls:
// all default fields + every optional field that might carry VA intake data.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const key = process.env.CALLRAIL_API_KEY.trim();
const ACCT = 'ACC019dc0126ade7956850fbd40239646af';

const api = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } });
  if (!res.ok) return { __error: res.status + ' ' + (await res.text()).slice(0, 150) };
  return res.json();
};

// Optional fields to try (VA/CI-related guesses + documented extras)
const EXTRAS = 'transcription,call_highlights,call_summary,keywords_spotted,conversational_transcript,voice_assist,voice_assist_summary,lead_status,note,tags,qualification,form_data,milestones,speaker_percent';

const calls = await api(`a/${ACCT}/calls.json`, { start_date: '2026-07-18', end_date: '2026-07-21', per_page: '10', fields: 'recording_duration' });
const recent = (calls.calls || []).filter((c) => (c.duration || 0) > 60).slice(0, 3);
console.log('Probing', recent.length, 'recent calls\n');

for (const c of recent) {
  const full = await api(`a/${ACCT}/calls/${c.id}.json`, { fields: EXTRAS });
  console.log('=== CALL', c.id, c.start_time, c.customer_name, '===');
  for (const [k, v] of Object.entries(full)) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`  ${k}: ${s.length > 300 ? s.slice(0, 300) + `...[${s.length} chars]` : s}`);
  }
  console.log('');
}
