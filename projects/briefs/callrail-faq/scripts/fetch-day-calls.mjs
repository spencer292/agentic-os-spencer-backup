// Assemble everything needed to grade one day of phone calls.
//
//   node projects/briefs/callrail-faq/scripts/fetch-day-calls.mjs [YYYY-MM-DD]
//
// Defaults to today in America/Los_Angeles. Writes a single markdown briefing to
//   projects/briefs/callrail-faq/call-grading/_briefings/{date}.md
// and prints that path. The briefing carries:
//   - every CallRail call for the day, full transcript, with a guess at who answered
//   - the service-day sheet's answer for each caller's zip (so day claims can be checked)
//   - every Jobber quote created that day (so promised quotes can be verified)
//   - duplicate-call detection (one conversation logged on two tracking numbers)
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ptParts = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const DATE = process.argv[2] || ptParts(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) {
  console.error(`Bad date "${DATE}" — expected YYYY-MM-DD`);
  process.exit(1);
}

const warnings = [];

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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

let calls = [];
if (!KEY) {
  warnings.push('CALLRAIL_API_KEY missing from .env — no calls could be fetched.');
} else {
  const list = await callrail(`a/${ACCT}/calls.json`, {
    start_date: DATE, end_date: DATE, per_page: '250',
    fields: 'recording_duration,tracking_phone_number,tags',
  });
  const nodes = (list.calls || []).slice().reverse(); // chronological
  for (const c of nodes) {
    let full = {};
    try {
      full = await callrail(`a/${ACCT}/calls/${c.id}.json`, { fields: 'transcription,call_highlights' });
    } catch (e) {
      warnings.push(`Transcript fetch failed for ${c.id}: ${String(e.message).slice(0, 120)}`);
    }
    calls.push({
      id: c.id,
      start: c.start_time,
      duration: c.duration || 0,
      answered: c.answered,
      direction: c.direction,
      name: c.customer_name,
      city: c.customer_city,
      phone: c.customer_phone_number,
      tracking: c.tracking_phone_number,
      tags: (c.tags || []).map((t) => t.name),
      transcription: full.transcription || null,
      highlights: full.call_highlights || null,
    });
    await sleep(550);
  }
}

// -------------------------------------------------------- who answered it

function whoAnswered(t) {
  if (!t) return { who: 'UNKNOWN', why: 'no transcript' };
  const head = t.slice(0, 400).toLowerCase();
  if (/outside of business hours|voice assist|automated assistant/.test(head))
    return { who: 'AFTER-HOURS / VOICE ASSIST', why: 'automated greeting' };
  if (/this is mo\b|this is mohamm|this is muhamm/.test(head)) return { who: 'MO', why: 'self-identified' };
  if (/this is spencer/.test(head)) return { who: 'SPENCER', why: 'self-identified' };
  const m = head.match(/this is (\w+)/);
  if (m) return { who: m[1].toUpperCase(), why: 'self-identified' };
  return { who: 'UNKNOWN', why: 'no self-identification in the opening' };
}

// ------------------------------------------------- service day, by zip

const zipDay = new Map();
try {
  const sheet = readFileSync(path.join(briefDir, 'service-day-lookup/service-day-sheet.md'), 'utf8');
  let day = null;
  for (const line of sheet.split(/\r?\n/)) {
    const h = line.match(/^##\s+(Monday|Tuesday|Wednesday|Thursday|Friday)\b/);
    if (h) { day = h[1]; continue; }
    const r = line.match(/^\|\s*(\d{5})\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (r && day) {
      const zip = r[1];
      const entry = { day, cities: r[2].trim(), also: r[3].trim(), tech: r[4].trim() };
      if (zipDay.has(zip)) zipDay.get(zip).push(entry);
      else zipDay.set(zip, [entry]);
    }
  }
  if (!zipDay.size) warnings.push('Service-day sheet parsed to zero zips — day claims cannot be checked.');
} catch {
  warnings.push('service-day-sheet.md not readable — day claims cannot be checked.');
}

const zipsInTranscript = (t) => [...new Set((t || '').match(/\b9[458]\d{3}\b/g) || [])];

// ------------------------------------------------------------- Jobber

let quotes = [];
try {
  const gql = `query { quotes(first: 40, sort: {key: CREATED_AT, direction: DESCENDING}) { nodes { quoteNumber createdAt sentAt quoteStatus amounts { total depositAmount discountAmount } lineItems(first: 6) { nodes { name quantity unitPrice totalPrice } } client { name } property { address { street city postalCode } } } } }`;
  const raw = execFileSync(
    process.execPath,
    [path.join(root, '.claude/skills/tool-jobber/scripts/jobber-api.mjs'), 'query', gql],
    { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 120000 }
  );
  const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
  quotes = (parsed?.quotes?.nodes || []).filter((q) => ptParts(new Date(q.createdAt)) === DATE);
} catch (e) {
  warnings.push(`Jobber quote lookup failed — promised quotes cannot be verified: ${String(e.message).slice(0, 160)}`);
}

// --------------------------------------------------------- duplicates

// Same conversation logged twice on two tracking numbers. The two copies are NOT
// byte-identical: one usually carries the "this call may be recorded" preamble, and the
// transcriber genuinely disagrees with itself word to word ("I had been" vs "I had"), so
// substring matching fails. Compare 5-word shingles by Jaccard similarity instead.
const shingles = (s, n = 5) => {
  const w = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '));
  return set;
};
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit++;
  return hit / (a.size + b.size - hit);
};

const dupes = [];
for (let i = 0; i < calls.length; i++) {
  for (let j = i + 1; j < calls.length; j++) {
    const a = calls[i], b = calls[j];
    if (!a.transcription || !b.transcription) continue;
    if (Math.abs(new Date(a.start) - new Date(b.start)) > 5 * 60 * 1000) continue;
    if (a.phone !== b.phone) continue;
    const sim = jaccard(shingles(a.transcription), shingles(b.transcription));
    if (sim >= 0.4) dupes.push([a, b, sim]);
  }
}

// ------------------------------------------------------------- output

const fmt = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const dur = (s) => `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;

let out = `# Call briefing — ${DATE}\n\n`;
out += `Generated by \`fetch-day-calls.mjs\`. All times America/Los_Angeles. **Evidence only — no grading.**\n\n`;

if (warnings.length) {
  out += `## ⚠ Warnings — say these in the report\n\n`;
  warnings.forEach((w) => { out += `- ${w}\n`; });
  out += `\n`;
}

const byWho = new Map();
calls.forEach((c) => {
  const w = whoAnswered(c.transcription).who;
  byWho.set(w, (byWho.get(w) || 0) + 1);
});

out += `## Roll call\n\n`;
out += `${calls.length} recorded call${calls.length === 1 ? '' : 's'}`;
out += byWho.size ? ` — ${[...byWho].map(([w, n]) => `${w}: ${n}`).join(', ')}` : '';
out += `\n\n`;
if (dupes.length) {
  out += `**${dupes.length} likely duplicate${dupes.length === 1 ? '' : 's'}** (same conversation on two tracking numbers — count once):\n`;
  dupes.forEach(([a, b, sim]) => { out += `- ${fmt(a.start)} ${a.id} (${a.tracking}) ≈ ${fmt(b.start)} ${b.id} (${b.tracking}) — ${a.name}, ${Math.round(sim * 100)}% match\n`; });
  out += `\n`;
}

out += `| # | Time | Len | Caller | City | Answered by | Tags |\n|---|---|---|---|---|---|---|\n`;
calls.forEach((c, i) => {
  out += `| ${i + 1} | ${fmt(c.start)} | ${dur(c.duration)} | ${c.name || '—'} | ${c.city || '—'} | ${whoAnswered(c.transcription).who} | ${c.tags.join(', ') || '—'} |\n`;
});

out += `\n## Jobber quotes created ${DATE}\n\n`;
if (!quotes.length) {
  out += `_None found (or the lookup failed — check warnings)._\n`;
} else {
  out += `| # | Created | Sent | Status | Total | Deposit | Line items | Client | Property |\n|---|---|---|---|---|---|---|---|---|\n`;
  quotes.slice().reverse().forEach((q) => {
    const li = (q.lineItems?.nodes || []).map((l) => `${l.name} ×${l.quantity} @ $${l.unitPrice}`).join('; ');
    const a = q.property?.address || {};
    out += `| ${q.quoteNumber} | ${fmt(q.createdAt)} | ${q.sentAt ? fmt(q.sentAt) : '**NOT SENT**'} | ${q.quoteStatus} | $${q.amounts?.total} | $${q.amounts?.depositAmount} | ${li} | ${q.client?.name || '—'} | ${[a.street, a.city, a.postalCode].filter(Boolean).join(', ')} |\n`;
  });
}

out += `\n---\n\n## Transcripts\n`;
calls.forEach((c, i) => {
  const w = whoAnswered(c.transcription);
  out += `\n### Call ${i + 1} — ${fmt(c.start)} · ${dur(c.duration)} · ${c.name || 'unknown'} (${c.city || '—'})\n\n`;
  out += `- Answered by: **${w.who}** _(${w.why})_\n`;
  out += `- Caller phone: ${c.phone || '—'} · tracking: ${c.tracking || '—'} · CallRail id: \`${c.id}\`\n`;
  if (c.tags.length) out += `- Tags: ${c.tags.join(', ')}\n`;
  const zs = zipsInTranscript(c.transcription);
  if (zs.length) {
    out += `- Zips mentioned, and the sheet's answer:\n`;
    zs.forEach((z) => {
      const e = zipDay.get(z);
      out += e
        ? `  - **${z}** → ${e.map((x) => `${x.day} (${x.tech})`).join(' + ')} — ${e[0].cities}\n`
        : `  - **${z}** → NOT IN THE GRID (out of area, or the grid needs a look)\n`;
    });
  }
  if (c.highlights?.length) out += `- CallRail highlights: ${c.highlights.join(' · ')}\n`;
  out += `\n\`\`\`\n`;
  out += (c.transcription || '(no transcript available)').replace(/\s*(Agent:|Caller:)\s*/g, '\n$1 ').trim();
  out += `\n\`\`\`\n`;
});

const outDir = path.join(briefDir, 'call-grading/_briefings');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${DATE}.md`);
writeFileSync(outFile, out);

console.log(`calls=${calls.length} quotes=${quotes.length} dupes=${dupes.length} warnings=${warnings.length}`);
console.log(`BRIEFING: ${outFile}`);
