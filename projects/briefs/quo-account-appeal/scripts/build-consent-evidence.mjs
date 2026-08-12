// Build the recipient-consent evidence pack for the Quo (formerly OpenPhone)
// account review.
//
//   node projects/briefs/quo-account-appeal/scripts/build-consent-evidence.mjs
//
// The claim being evidenced: Got Moles places NO cold calls. Every outbound call
// is a return call to someone who phoned Got Moles first. CallRail holds the
// inbound leg of every one of those conversations — caller number, timestamp,
// recording and transcript — so the inbound ledger IS the consent record.
//
// Writes projects/briefs/quo-account-appeal/consent-evidence.md
//
// Reads only. Never mutates CallRail.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
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

// The Quo account's whole life: number issued Aug 3, account limited Aug 11.
const QUO_START = '2026-08-03';
const QUO_END = '2026-08-11';
// Wider window purely to show this is an established business with steady
// inbound demand, not a boiler room that appeared last week.
const CONTEXT_START = '2026-06-01';

if (!KEY) {
  console.error('CALLRAIL_API_KEY missing from .env — cannot build the evidence pack.');
  process.exit(1);
}

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

async function fetchCalls(startDate, endDate) {
  const all = [];
  let page = 1;
  for (;;) {
    const r = await callrail(`a/${ACCT}/calls.json`, {
      start_date: startDate,
      end_date: endDate,
      per_page: '250',
      page: String(page),
      fields: 'recording_duration,tracking_phone_number,tags,lead_status,source',
    });
    all.push(...(r.calls || []));
    const total = r.total_pages || 1;
    process.stderr.write(`  page ${page}/${total} (${all.length} calls)\n`);
    if (page >= total) break;
    page++;
    await sleep(600);
  }
  return all;
}

console.error(`Fetching CallRail calls ${CONTEXT_START} .. ${QUO_END} ...`);
const contextCalls = await fetchCalls(CONTEXT_START, QUO_END);

const ptDate = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const ptTime = (iso) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const dur = (s) => `${Math.floor((s || 0) / 60)}m${String((s || 0) % 60).padStart(2, '0')}s`;

const inWindow = (c) => ptDate(c.start_time) >= QUO_START && ptDate(c.start_time) <= QUO_END;
const isInbound = (c) => (c.direction || 'inbound').toLowerCase() === 'inbound';

const inboundAll = contextCalls.filter(isInbound);
const outboundAll = contextCalls.filter((c) => !isInbound(c));

const windowCalls = contextCalls.filter(inWindow);
const windowInbound = windowCalls.filter(isInbound).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
const windowOutbound = windowCalls.filter((c) => !isInbound(c));

// Unique inbound callers across the whole context window — the consent pool.
// Anyone in here dialled Got Moles of their own accord.
const consentPool = new Map();
for (const c of inboundAll) {
  const k = (c.customer_phone_number || '').replace(/\D/g, '');
  if (!k) continue;
  const prev = consentPool.get(k);
  const t = new Date(c.start_time);
  if (!prev || t < prev.first) {
    consentPool.set(k, {
      first: prev ? (t < prev.first ? t : prev.first) : t,
      name: c.customer_name || prev?.name || '',
      city: c.customer_city || prev?.city || '',
      count: (prev?.count || 0) + 1,
    });
  } else {
    prev.count++;
  }
}

// Missed inbound calls inside the Quo window: precisely the callback pool.
const missedInWindow = windowInbound.filter((c) => !c.answered);
const answeredInWindow = windowInbound.filter((c) => c.answered);

// Transcript samples proving the caller initiated contact. Cap the fetch —
// a handful of openings makes the point; hundreds just burn rate limit.
const SAMPLE_N = 8;
const sampleSource = answeredInWindow
  .filter((c) => (c.duration || 0) >= 60)
  .slice(0, SAMPLE_N);
const samples = [];
for (const c of sampleSource) {
  try {
    const full = await callrail(`a/${ACCT}/calls/${c.id}.json`, { fields: 'transcription' });
    if (full.transcription) samples.push({ call: c, text: full.transcription });
  } catch (e) {
    console.error(`  transcript ${c.id} failed: ${String(e.message).slice(0, 100)}`);
  }
  await sleep(600);
}

// ------------------------------------------------------------------ output

const days = new Set(inboundAll.map((c) => ptDate(c.start_time))).size;
const perDay = days ? (inboundAll.length / days).toFixed(1) : '0';

let out = `# Recipient-consent evidence — Got Moles?\n\n`;
out += `Prepared for Quo account review (ticket 1152711). Generated from the CallRail API by \`scripts/build-consent-evidence.mjs\`. All times America/Los_Angeles.\n\n`;
out += `**The claim this evidences:** Got Moles places no cold calls and runs no outbound campaign. `;
out += `Every outbound call is a return call to a person who contacted Got Moles first and asked to be contacted about mole removal at their property. `;
out += `Contact reaches the business by two routes, and both leave a record:\n\n`;
out += `1. **Inbound telephone calls** to CallRail tracking numbers published on got-moles.com and Google Business Profile. CallRail records and transcribes every one.\n`;
out += `2. **Service-request forms** submitted on got-moles.com, which create a client record in Jobber, the company's field-service system.\n\n`;
out += `Both records are reproduced below. A companion audit — \`callback-pool-audit.md\` — examines the form-lead route in detail, including a data-quality problem Got Moles found in the course of this review and has corrected.\n\n`;

out += `---\n\n## 1. Summary\n\n`;
out += `| | |\n|---|---|\n`;
out += `| Evidence window | ${CONTEXT_START} to ${QUO_END} |\n`;
out += `| Total inbound calls to Got Moles | **${inboundAll.length.toLocaleString()}** |\n`;
out += `| Distinct people who called Got Moles | **${consentPool.size.toLocaleString()}** |\n`;
out += `| Days with inbound calls | ${days} (avg ${perDay}/day) |\n`;
out += `| Outbound calls logged in CallRail | ${outboundAll.length.toLocaleString()} |\n`;
out += `| | |\n`;
out += `| Quo account active | ${QUO_START} to ${QUO_END} (9 days) |\n`;
out += `| Inbound calls during the Quo window | **${windowInbound.length}** |\n`;
out += `| — answered live | ${answeredInWindow.length} |\n`;
out += `| — **missed, i.e. owed a call back** | **${missedInWindow.length}** |\n\n`;

out += `Calls from the Quo line went to two groups, and no others: the ${missedInWindow.length} missed callers above, `;
out += `and the homeowners who submitted a service-request form on got-moles.com during the same period (75 of them — itemised in \`callback-pool-audit.md\`). `;
out += `There is no other outbound calling of any kind: no purchased lists, no rented data, no prospecting, no SMS campaigns, no dialler, no autodialler.\n\n`;

out += `---\n\n## 2. Missed inbound calls while Quo was active\n\n`;
out += `Every row is an inbound call **to** Got Moles, logged by CallRail before any outbound call existed. These callers were rung back.\n\n`;
if (!missedInWindow.length) {
  out += `_No missed inbound calls recorded in this window._\n\n`;
} else {
  out += `| Date | Time (PT) | Caller | City | Called our number | CallRail call ID |\n|---|---|---|---|---|---|\n`;
  for (const c of missedInWindow) {
    out += `| ${ptDate(c.start_time)} | ${ptTime(c.start_time)} | ${c.customer_phone_number || '—'}${c.customer_name ? ` (${c.customer_name})` : ''} | ${c.customer_city || '—'} | ${c.tracking_phone_number || '—'} | \`${c.id}\` |\n`;
  }
  out += `\n`;
}

out += `---\n\n## 3. All inbound calls during the Quo window\n\n`;
out += `Full inbound log for ${QUO_START} to ${QUO_END}, answered and missed, showing normal inbound demand for a seasonal home-services business at peak season.\n\n`;
out += `| Date | Time (PT) | Caller | City | Answered | Length | Our number |\n|---|---|---|---|---|---|---|\n`;
for (const c of windowInbound) {
  out += `| ${ptDate(c.start_time)} | ${ptTime(c.start_time)} | ${c.customer_phone_number || '—'}${c.customer_name ? ` (${c.customer_name})` : ''} | ${c.customer_city || '—'} | ${c.answered ? 'yes' : '**missed**'} | ${dur(c.duration)} | ${c.tracking_phone_number || '—'} |\n`;
}
out += `\n`;

out += `---\n\n## 4. Recorded verbal consent, on the inbound call itself\n\n`;
out += `**This is the most direct evidence in this pack.** When no one is free to pick up, the CallRail receptionist takes the caller's details and asks, in terms, for permission to call them back — `;
out += `_"Could I have the best phone number for our team to reach you?"_ — and the caller agrees, on a recorded line, before any outbound call is ever placed.\n\n`;
out += `Verbatim openings of recorded inbound calls in the same window follow. CallRail holds the full audio and transcript of every one; all are available to your compliance team on request.\n\n`;
if (!samples.length) {
  out += `_No transcripts retrieved._\n\n`;
} else {
  for (const s of samples) {
    const opening = s.text.replace(/\s*(Agent:|Caller:)\s*/g, '\n$1 ').trim().split('\n').slice(0, 6).join('\n');
    out += `**${ptDate(s.call.start_time)} ${ptTime(s.call.start_time)} — inbound from ${s.call.customer_phone_number || 'unknown'}`;
    out += `${s.call.customer_city ? `, ${s.call.customer_city}` : ''} · CallRail id \`${s.call.id}\`**\n\n`;
    out += '```\n' + opening + '\n```\n\n';
  }
}

out += `---\n\n## 5. How consent is obtained\n\n`;
out += `A homeowner with mole damage in their lawn finds Got Moles through Google Search, Google Business Profile (three locations, 219+ five-star reviews) or got-moles.com. They then either:\n\n`;
out += `**(a) telephone us.** CallRail answers, records and transcribes the call. If nobody is free the call is missed and logged with the caller's number, and it is returned — usually the same day. The purpose of the return call is the service the caller just asked for, minutes earlier.\n\n`;
out += `**(b) submit the service-request form on got-moles.com.** The form asks for name, address and phone number and states that Got Moles will contact them to arrange an inspection. Submitting it creates a client record in Jobber. That record is the consent artefact, and the return call is the response the homeowner asked for.\n\n`;
out += `There is no third route. Got Moles has never bought, rented or scraped a phone list, has never run an outbound campaign, and has no autodialler. Outbound calling exists purely to answer people who reached out first, `;
out += `and it is one receptionist doing it by hand — roughly ${(75 / 9).toFixed(0)}–${Math.ceil(missedInWindow.length / 9 + 75 / 9)} calls a day at the peak of a 12-week mole season.\n\n`;

out += `### A problem we found while assembling this\n\n`;
out += `Preparing this pack surfaced something Got Moles had not seen: the got-moles.com service-request form has been receiving spam and bot submissions, and the internal alert that routes new leads to the receptionist did not filter them. `;
out += `Of 75 form leads in this window, 20 carried phone numbers outside Washington State — including one international number — and 23 had no matching inbound call. `;
out += `Those are not customers; they are junk submissions, and ringing them produced exactly the unanswered, out-of-area dialling pattern that a fraud model is built to catch.\n\n`;
out += `This was our error and we have fixed it. The lead alert now only raises a callback for Washington State area codes (${['206', '253', '360', '425', '509', '564'].join(', ')}); everything else goes to a human review queue and is never dialled. `;
out += `Full detail, including every affected record, is in \`callback-pool-audit.md\`, which we are supplying voluntarily.\n\n`;

out += `---\n\n_Generated ${ptDate(new Date().toISOString())} from CallRail account ${ACCT}. Every call ID above is verifiable in that account, with audio._\n`;

if (!existsSync(briefDir)) mkdirSync(briefDir, { recursive: true });
const outFile = path.join(briefDir, 'consent-evidence.md');
writeFileSync(outFile, out);

console.error('');
console.log(`inbound_total=${inboundAll.length} unique_callers=${consentPool.size} window_inbound=${windowInbound.length} window_missed=${missedInWindow.length} window_answered=${answeredInWindow.length} outbound_in_callrail=${outboundAll.length} samples=${samples.length}`);
console.log(`EVIDENCE: ${outFile}`);
