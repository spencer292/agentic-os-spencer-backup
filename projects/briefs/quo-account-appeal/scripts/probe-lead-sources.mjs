// Probe: where did the outbound callback volume actually come from during the
// Quo window (2026-08-03 .. 2026-08-11)? Missed CallRail calls alone were only 4,
// so the rest must be web-form / Jobber leads. Quantify each source.
//
//   node projects/briefs/quo-account-appeal/scripts/probe-lead-sources.mjs
//
// Reads only.

import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const KEY = (process.env.CALLRAIL_API_KEY || '').trim();
const ACCT = 'ACC019dc0126ade7956850fbd40239646af';
const START = '2026-08-03';
const END = '2026-08-11';

async function cr(ep, params = {}) {
  const url = new URL(`https://api.callrail.com/v3/a/${ACCT}/${ep}.json`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${KEY}"` } });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

// --- CallRail form submissions and texts -----------------------------------
for (const ep of ['form_submissions', 'text-messages']) {
  const r = await cr(ep, { start_date: START, end_date: END, per_page: '250' });
  if (!r.ok) {
    console.log(`${ep}: HTTP ${r.status} — ${r.body.slice(0, 160)}`);
    continue;
  }
  const j = JSON.parse(r.body);
  const arr = j.form_submissions || j.text_messages || j.conversations || [];
  console.log(`${ep}: total_records=${j.total_records ?? 'n/a'} returned=${arr.length}`);
  if (arr.length) {
    const keys = Object.keys(arr[0]).slice(0, 14).join(', ');
    console.log(`  fields: ${keys}`);
    const s = arr[0];
    console.log(`  sample: ${JSON.stringify({
      submitted: s.submitted_at || s.created_at,
      phone: s.customer_phone_number,
      name: s.customer_name,
      source: s.source || s.form_url,
    })}`);
  }
}

// --- lead-alert fires (Jobber web/form leads pushed to Muhammad) ------------
const runsDir = path.join(root, 'projects/briefs/lead-alerts/runs');
let alertRows = [];
for (const f of readdirSync(runsDir).filter((f) => f.endsWith('.jsonl'))) {
  const day = f.replace('.jsonl', '');
  if (day < START || day > END) continue;
  for (const line of readFileSync(path.join(runsDir, f), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      alertRows.push({ day, ...o });
    } catch {
      /* tolerate partial lines */
    }
  }
}
console.log(`\nlead-alert fires ${START}..${END}: ${alertRows.length}`);
const byDay = {};
alertRows.forEach((r) => { byDay[r.day] = (byDay[r.day] || 0) + 1; });
console.log(`  by day: ${JSON.stringify(byDay)}`);
if (alertRows.length) {
  console.log(`  fields: ${Object.keys(alertRows[0]).join(', ')}`);
  console.log(`  sample: ${JSON.stringify(alertRows[0]).slice(0, 300)}`);
}
