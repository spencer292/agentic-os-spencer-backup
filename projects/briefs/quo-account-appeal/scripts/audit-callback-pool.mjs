// Audit the real callback pool for the Quo window (2026-08-03 .. 2026-08-11).
//
//   node projects/briefs/quo-account-appeal/scripts/audit-callback-pool.mjs
//
// Missed CallRail calls in that window were only 4, but Muhammad was told to ring
// back every new Jobber lead ("call back while they are still shopping" — the
// lead-alert cron). So the outbound pool is really the new-Jobber-client list.
// This classifies every one of those numbers by geography and checks whether the
// person had also phoned Got Moles first, which is what a carrier fraud model
// would be looking at.
//
// Writes projects/briefs/quo-account-appeal/callback-pool-audit.md
//
// Reads only. Never mutates Jobber or CallRail.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const briefDir = path.resolve(here, '..');

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const KEY = (process.env.CALLRAIL_API_KEY || '').trim();
const ACCT = 'ACC019dc0126ade7956850fbd40239646af';
const TZ = 'America/Los_Angeles';
const START = '2026-08-03';
const END = '2026-08-11';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Washington State area codes. Got Moles serves King, Pierce and Thurston counties
// only — anything outside this set cannot be a serviceable residential lead.
const WA_AREA = new Set(['206', '253', '360', '425', '509', '564']);

const ptDate = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

// ------------------------------------------------------------------ Jobber

function jobber(query) {
  const raw = execFileSync(
    process.execPath,
    [path.join(root, '.claude/skills/tool-jobber/scripts/jobber-api.mjs'), 'query', query],
    { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 180000 }
  );
  return JSON.parse(raw.slice(raw.indexOf('{')));
}

const clients = [];
let after = null;
for (let page = 0; page < 10; page++) {
  const cursor = after ? `, after: "${after}"` : '';
  const q = `query {
    clients(first: 50${cursor}, filter: {createdAt: {after: "${START}T00:00:00Z"}}) {
      pageInfo { hasNextPage endCursor }
      nodes { name createdAt phones { number } billingAddress { city postalCode } }
    }
  }`;
  const r = jobber(q);
  clients.push(...(r?.clients?.nodes || []));
  const pi = r?.clients?.pageInfo;
  if (!pi?.hasNextPage) break;
  after = pi.endCursor;
}
console.error(`Jobber clients created since ${START}: ${clients.length}`);

// ---------------------------------------------------------------- CallRail

async function callrail(p, params = {}, attempt = 0) {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${KEY}"` } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`${res.status} on ${p} after 4 retries`);
    await sleep(Math.min(30000, 2000 * 2 ** attempt));
    return callrail(p, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}`);
  return res.json();
}

// Every number that has ever phoned Got Moles in the last ~10 weeks.
const everCalled = new Set();
for (let page = 1; page <= 10; page++) {
  const r = await callrail(`a/${ACCT}/calls.json`, {
    start_date: '2026-06-01', end_date: END, per_page: '250', page: String(page),
  });
  (r.calls || []).forEach((c) => {
    const d = (c.customer_phone_number || '').replace(/\D/g, '');
    if (d) everCalled.add(d.replace(/^1/, ''));
  });
  if (page >= (r.total_pages || 1)) break;
  await sleep(600);
}
console.error(`Distinct numbers that phoned Got Moles since 2026-06-01: ${everCalled.size}`);

// ------------------------------------------------------------- classify

function classify(raw) {
  const d = (raw || '').replace(/\D/g, '');
  if (!d) return { bucket: 'NO NUMBER', area: '—', digits: '' };
  // International: leading + kept by Jobber, or a non-NANP length.
  const intl = /^\+/.test(raw || '') && !/^\+1/.test(raw || '');
  if (intl || (d.length > 11) || (d.length === 11 && !d.startsWith('1'))) {
    return { bucket: 'INTERNATIONAL', area: `+${d.slice(0, 3)}`, digits: d };
  }
  const nat = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (nat.length !== 10) return { bucket: 'MALFORMED', area: '—', digits: d };
  const area = nat.slice(0, 3);
  if (WA_AREA.has(area)) return { bucket: 'WASHINGTON', area, digits: nat };
  return { bucket: 'OUT OF STATE', area, digits: nat };
}

const rows = clients
  .filter((c) => ptDate(c.createdAt) >= START && ptDate(c.createdAt) <= END)
  .map((c) => {
    const num = c.phones?.[0]?.number || '';
    const k = classify(num);
    return {
      name: c.name,
      created: ptDate(c.createdAt),
      number: num,
      ...k,
      calledUs: k.digits ? everCalled.has(k.digits) : false,
      city: c.billingAddress?.city || '',
      zip: c.billingAddress?.postalCode || '',
    };
  })
  .sort((a, b) => a.created.localeCompare(b.created));

const tally = {};
rows.forEach((r) => { tally[r.bucket] = (tally[r.bucket] || 0) + 1; });
const suspect = rows.filter((r) => r.bucket !== 'WASHINGTON');
const neverCalled = rows.filter((r) => !r.calledUs);

// ------------------------------------------------------------------ output

let out = `# Callback-pool audit — Quo window ${START} to ${END}\n\n`;
out += `Generated by \`scripts/audit-callback-pool.mjs\`. Reads only.\n\n`;
out += `**Why this exists.** Only 4 inbound calls were missed in this window, so missed calls cannot account for the outbound volume from the Quo line. `;
out += `The real callback list was the new-lead feed: the \`lead-alerts\` cron emails Muhammad every new Jobber client with "call back while they are still shopping". `;
out += `This audits what was actually in that feed.\n\n`;

out += `## Summary\n\n`;
out += `| Bucket | Count |\n|---|---:|\n`;
Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { out += `| ${k} | ${v} |\n`; });
out += `| **Total new leads** | **${rows.length}** |\n\n`;
out += `- **${suspect.length}** of ${rows.length} leads carry a number that is **not a Washington area code** — outside every county Got Moles serves.\n`;
out += `- **${neverCalled.length}** of ${rows.length} leads had **never phoned Got Moles** on any tracking number, so no inbound call record exists for them.\n\n`;

if (suspect.length) {
  out += `## Non-Washington numbers in the callback feed\n\n`;
  out += `Each of these was pushed to the receptionist as a lead to ring back.\n\n`;
  out += `| Created | Name | Number | Area | Bucket | Had phoned us? |\n|---|---|---|---|---|---|\n`;
  suspect.forEach((r) => {
    out += `| ${r.created} | ${r.name} | ${r.number || '—'} | ${r.area} | ${r.bucket} | ${r.calledUs ? 'yes' : '**no**'} |\n`;
  });
  out += `\n`;
}

out += `## Full new-lead list\n\n`;
out += `| Created | Name | Number | Bucket | City | Had phoned us? |\n|---|---|---|---|---|---|\n`;
rows.forEach((r) => {
  out += `| ${r.created} | ${r.name} | ${r.number || '—'} | ${r.bucket} | ${r.city || '—'} | ${r.calledUs ? 'yes' : 'no'} |\n`;
});
out += `\n`;

out += `## What a carrier fraud model sees\n\n`;
out += `From the outside, with no visibility into CallRail or Jobber, the Quo line looked like this:\n\n`;
out += `- a phone number ${'`'}(253) 683-7555${'`'} **8 days old**\n`;
out += `- **one seat**, signing in from **Pakistan**\n`;
out += `- dialling numbers that had **never called that number** (${neverCalled.length} of ${rows.length} had no inbound record at all)\n`;
out += `- including **${suspect.length} numbers outside the business's own state**, some international\n`;
out += `- with the low answer rates and short durations that returning a cold lead always produces\n`;
out += `- **no A2P/10DLC registration**, no Free Caller Registry entry, no CNAM branding\n\n`;
out += `That is the signature of a boiler room. It is also exactly what a legitimate business looks like when its lead feed is unfiltered and its outbound number is brand new.\n\n`;

out += `## Remediation\n\n`;
out += `1. **Filter the lead feed by area code before it reaches the receptionist.** Only ${[...WA_AREA].join(', ')} should generate a callback task; everything else goes to a review queue for a human to look at.\n`;
out += `2. **Never dial an international number from the business line.** No Got Moles customer has a non-US number.\n`;
out += `3. **Set outbound caller ID to the number the customer contacted** so the callback shows a recognisable Washington number.\n`;
out += `4. **Register the outbound number** — Free Caller Registry, CNAM branding, and A2P/10DLC before any SMS.\n`;
out += `5. **Warm the number** — no new line goes from zero to full callback volume inside a week.\n\n`;

out += `---\n\n_Sources: Jobber clients created ${START}..${END}; CallRail account ${ACCT}, inbound calls 2026-06-01..${END}._\n`;

if (!existsSync(briefDir)) mkdirSync(briefDir, { recursive: true });
const outFile = path.join(briefDir, 'callback-pool-audit.md');
writeFileSync(outFile, out);

console.log(`leads=${rows.length} ${JSON.stringify(tally)} non_wa=${suspect.length} never_called_us=${neverCalled.length}`);
console.log(`AUDIT: ${outFile}`);
