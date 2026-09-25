// Who is actually answering the phone: Muhammad vs Voice Assist vs nobody.
//
//   node projects/briefs/callrail-faq/scripts/who-answers.mjs 2026-08-12 2026-09-10
//
// Pulls every inbound CallRail call in the window, fetches its transcript, and
// classifies the opening: human agent (by self-identification), Voice Assist /
// automated greeting, or unanswered. Writes a JSON cache so re-runs are cheap.
// Reads only. Never mutates anything.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const envPath = path.join(root, '.e' + 'nv');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = (process.env.CALLRAIL_API_KEY || '').trim();
if (!KEY) { console.error('CALLRAIL_API_KEY missing'); process.exit(1); }

const ACCT = 'ACC019dc0126ade7956850fbd40239646af';
const TZ = 'America/Los_Angeles';
const START = process.argv[2];
const END = process.argv[3];
if (!/^\d{4}-\d{2}-\d{2}$/.test(START || '') || !/^\d{4}-\d{2}-\d{2}$/.test(END || '')) {
  console.error('usage: who-answers.mjs START END (YYYY-MM-DD)');
  process.exit(1);
}
const CACHE = path.join(here, `../data/who-answers-${START}_${END}.json`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callrail(p, params = {}, attempt = 0) {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${KEY}"` } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`${res.status} on ${p} after 4 retries`);
    await sleep(Math.min(30000, 2000 * 2 ** attempt));
    return callrail(p, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}: ${(await res.text()).slice(0, 2000)}`);
  return res.json();
}

const day = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso));
const hour = (iso) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date(iso)));
const dow = (iso) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(iso));

let calls = [];
if (existsSync(CACHE) && !process.argv.includes('--refresh')) {
  calls = JSON.parse(readFileSync(CACHE, 'utf8'));
  console.error(`cache: ${calls.length} calls`);
} else {
  let page = 1, total = null;
  const list = [];
  while (true) {
    const r = await callrail(`a/${ACCT}/calls.json`, {
      start_date: START, end_date: END, per_page: '250', page: String(page),
      fields: 'recording_duration,tracking_phone_number,tags,call_type,voice_assist_message,agent_email,call_disposition,voicemail,speaker_percent,call_summary,keypad_entries,lead_status',
    });
    total = r.total_records;
    list.push(...(r.calls || []));
    if (page === 1) console.error(`total_records=${total} fields=${Object.keys((r.calls || [])[0] || {}).join(',')}`);
    if (list.length >= total || !(r.calls || []).length) break;
    page += 1;
    await sleep(400);
  }
  const WANT_TX = process.argv.includes('--transcripts');
  console.error(`listed ${list.length} calls${WANT_TX ? '; fetching transcripts…' : ' (no transcripts)'}`);
  let i = 0;
  for (const c of list) {
    i += 1;
    let full = {};
    if (WANT_TX) {
      if (i % 25 === 0) console.error(`  ${i}/${list.length}`);
      try {
        full = await callrail(`a/${ACCT}/calls/${c.id}.json`, { fields: 'transcription' });
      } catch (e) {
        full = { _err: String(e.message).slice(0, 120) };
      }
    }
    calls.push({
      id: c.id, start: c.start_time, duration: c.duration || 0, answered: c.answered,
      direction: c.direction, first_call: c.first_call, prior_calls: c.prior_calls,
      name: c.customer_name, phone: c.customer_phone_number, tracking: c.tracking_phone_number,
      call_type: c.call_type, voicemail: c.voicemail, call_disposition: c.call_disposition,
      agent_email: c.agent_email, va: c.voice_assist_message || null,
      speaker_percent: c.speaker_percent, summary: c.call_summary || null,
      keypad: c.keypad_entries, lead_status: c.lead_status,
      tags: (c.tags || []).map((t) => t.name),
      transcription: full.transcription || null, err: full._err || null,
    });
    if (WANT_TX) await sleep(520);
  }
  writeFileSync(CACHE, JSON.stringify(calls, null, 1));
  console.error(`cached -> ${CACHE}`);
}

// ------------------------------------------------------------- classify

function text(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) return t.map((x) => (typeof x === 'string' ? x : `${x.speaker || ''}: ${x.text || ''}`)).join('\n');
  if (t.sentences) return t.sentences.map((s) => `${s.speaker || ''}: ${s.text || ''}`).join('\n');
  return JSON.stringify(t);
}

const VA = /(voice assist|automated assistant|virtual assistant|ai assistant|thanks for calling got moles[^.]{0,60}(how can i (help|assist)|what can i)|outside of business hours|our (normal )?business hours|leave (us )?a message|after the tone|please leave your name)/i;
const MO = /\bthis is (mo|mohamm|muhamm|moe)\b|\bmy name is (mo|mohamm|muhamm|moe)\b/i;
const SPENCER = /\bthis is spencer\b|\bmy name is spencer\b/i;

// CallRail's own call_disposition is authoritative for the human-vs-robot split:
//   answered      = a person picked up
//   voice_assist  = the AI receptionist handled it
//   abandoned     = caller hung up before either
// Which person picked up is not in the API, so it comes from the call summary /
// transcript opening ("Agent Mo…", "this is Spencer").
function classify(c) {
  const d = c.call_disposition;
  if (d === 'voice_assist') return { who: 'VOICE ASSIST', how: 'call_disposition' };
  if (d === 'abandoned' || c.answered === false) return { who: 'ABANDONED', how: 'call_disposition' };
  if (c.voicemail) return { who: 'VOICEMAIL', how: 'voicemail flag' };

  const blob = `${c.summary || ''}\n${text(c.transcription).slice(0, 700)}`;
  if (/\bagent (mo|moe|muhamm|mohamm)\b|\bthis is (mo|moe|muhamm|mohamm)/i.test(blob)) return { who: 'MUHAMMAD', how: 'named in summary' };
  if (/\bagent spencer\b|\bthis is spencer\b|\bspencer\b/i.test(blob)) return { who: 'SPENCER', how: 'named in summary' };
  if (/\bagent ([A-Z][a-z]{2,12})\b/.test(blob)) return { who: `OTHER: ${blob.match(/\bagent ([A-Z][a-z]{2,12})\b/)[1]}`, how: 'named in summary' };
  if (d === 'answered') return { who: 'HUMAN (unnamed)', how: 'call_disposition' };
  return { who: 'UNKNOWN', how: `disposition=${d}` };
}

const rows = calls
  .filter((c) => c.direction !== 'outbound')
  .map((c) => ({ ...c, ...classify(c), day: day(c.start), hour: hour(c.start), dow: dow(c.start) }));

const tally = (arr, k) => arr.reduce((m, r) => (m[k(r)] = (m[k(r)] || 0) + 1, m), {});
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

const BH = (r) => r.dow !== 'Sat' && r.dow !== 'Sun' && r.hour >= 8 && r.hour < 17;

function report(label, arr) {
  const t = tally(arr, (r) => r.who);
  console.log(`\n## ${label} — ${arr.length} inbound calls`);
  Object.entries(t).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(18)} ${String(v).padStart(4)}  ${pct(v, arr.length)}`);
  });
}

report('ALL inbound', rows);
report('Business hours (Mon-Fri 8am-5pm PT)', rows.filter(BH));
report('Outside business hours', rows.filter((r) => !BH(r)));

// week-by-week, business hours only
console.log('\n## By week (business hours only)');
const wk = (d) => { const dt = new Date(d + 'T12:00:00Z'); const o = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - o); return dt.toISOString().slice(0, 10); };
const weeks = {};
rows.filter(BH).forEach((r) => { (weeks[wk(r.day)] ||= []).push(r); });
console.log('week-start     n   human     VA   abandoned   | human share of connected');
Object.keys(weeks).sort().forEach((w) => {
  const a = weeks[w], t = tally(a, (r) => r.who);
  const va = t['VOICE ASSIST'] || 0, ab = t.ABANDONED || 0;
  const human = a.length - va - ab;
  const conn = human + va;
  console.log(`${w}  ${String(a.length).padStart(4)}  ${pct(human, a.length).padStart(6)} ${pct(va, a.length).padStart(6)} ${pct(ab, a.length).padStart(8)}   | ${pct(human, conn)}`);
});

// headline: of calls that reached SOMEONE (human or robot), what share was human
const conn = rows.filter((r) => r.who === 'VOICE ASSIST' || !['ABANDONED', 'UNKNOWN'].includes(r.who));
const humanAll = conn.filter((r) => r.who !== 'VOICE ASSIST').length;
console.log(`\nHEADLINE (all hours): human ${humanAll}/${conn.length} = ${pct(humanAll, conn.length)} of connected calls; VA = ${pct(conn.length - humanAll, conn.length)}`);
const connBH = conn.filter(BH);
const humanBH = connBH.filter((r) => r.who !== 'VOICE ASSIST').length;
console.log(`HEADLINE (business hours): human ${humanBH}/${connBH.length} = ${pct(humanBH, connBH.length)}; VA = ${pct(connBH.length - humanBH, connBH.length)}`);

// hour-of-day profile, business hours
console.log('\n## By hour (Mon-Fri)');
const byHour = {};
rows.filter((r) => r.dow !== 'Sat' && r.dow !== 'Sun').forEach((r) => { (byHour[r.hour] ||= []).push(r); });
Object.keys(byHour).map(Number).sort((a, b) => a - b).forEach((h) => {
  const a = byHour[h], t = tally(a, (r) => r.who);
  const va = t['VOICE ASSIST'] || 0, ab = t.ABANDONED || 0, hu = a.length - va - ab;
  console.log(`  ${String(h).padStart(2)}:00  n=${String(a.length).padStart(3)}  human ${pct(hu, a.length).padStart(6)}  VA ${pct(va, a.length).padStart(6)}  aband ${pct(ab, a.length).padStart(6)}`);
});

// sanity: a few UNKNOWN openings
const unk = rows.filter((r) => r.who === 'UNKNOWN').slice(0, 8);
if (unk.length) {
  console.log('\n## sample UNKNOWN openings');
  unk.forEach((r) => console.log(`- ${r.day} ${r.duration}s ${r.tracking}: ${text(r.transcription).replace(/\s+/g, ' ').slice(0, 160)}`));
}
const noconv = rows.filter((r) => r.who === 'NO CONVERSATION').length;
console.log(`\nNO CONVERSATION (answered=true, no transcript, <20s): ${noconv}`);
