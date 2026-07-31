// close-rate-diag.mjs — sanity checks on the call→job phone match (is the May/June rate real
// or a matching artifact?). Read-only, works off the cached pulls.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const briefDir = path.resolve(here, '..');
const cacheDir = path.join(briefDir, 'data');
const cf = readdirSync(cacheDir).filter((f) => f.startsWith('_close-rate-cache_')).sort().pop();
const { jobs, calls, quotes } = JSON.parse(readFileSync(path.join(cacheDir, cf), 'utf8'));
const bf = readdirSync(cacheDir).filter((f) => f.startsWith('_client-phonebook_')).sort().pop();
const book = JSON.parse(readFileSync(path.join(cacheDir, bf), 'utf8'));

const TZ = 'America/Los_Angeles';
const ptDate = (i) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(i));
const ptMonth = (i) => ptDate(i).slice(0, 7);
const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '—');

// 1. do jobs even carry a phone number?
const noPhone = jobs.filter((j) => !(j.client?.phones || []).some((p) => digits(p.number).length >= 10));
console.log(`Jobs created in window: ${jobs.length} | with no usable client phone: ${noPhone.length} (${pct(noPhone.length, jobs.length)})`);
console.log('  by month:');
for (const m of [...new Set(jobs.map((j) => ptMonth(j.createdAt)))].sort()) {
  const a = jobs.filter((j) => ptMonth(j.createdAt) === m);
  const n = a.filter((j) => !(j.client?.phones || []).some((p) => digits(p.number).length >= 10));
  console.log(`    ${m}  jobs ${String(a.length).padStart(4)}  no-phone ${String(n.length).padStart(3)} (${pct(n.length, a.length)})`);
}

// 2. monthly call volume vs jobs traced
const inbound = calls.filter((c) => String(c.direction || '').includes('inbound'));
const callPhones = new Map();
for (const c of inbound) { const d = digits(c.customer_phone_number); if (d.length >= 10) { if (!callPhones.has(d)) callPhones.set(d, []); callPhones.get(d).push(c); } }
console.log('\nMonthly: inbound calls | unique callers | jobs created | jobs traced to ANY tracked call');
for (const m of [...new Set([...inbound.map((c) => ptMonth(c.start_time)), ...jobs.map((j) => ptMonth(j.createdAt))])].sort()) {
  const mc = inbound.filter((c) => ptMonth(c.start_time) === m);
  const uniq = new Set(mc.map((c) => digits(c.customer_phone_number)).filter((d) => d.length >= 10));
  const mj = jobs.filter((j) => ptMonth(j.createdAt) === m);
  const traced = mj.filter((j) => (j.client?.phones || []).some((p) => callPhones.has(digits(p.number))));
  console.log(`  ${m}  calls ${String(mc.length).padStart(4)}  uniq ${String(uniq.size).padStart(4)}  jobs ${String(mj.length).padStart(4)}  traced ${String(traced.length).padStart(4)} (${pct(traced.length, mj.length)})`);
}

// 3. lag: for traced jobs, days from first call to job creation
const lags = [];
for (const j of jobs) {
  for (const p of (j.client?.phones || [])) {
    const d = digits(p.number); const cs = callPhones.get(d);
    if (!cs) continue;
    const first = cs.map((c) => c.start_time).sort()[0];
    lags.push({ job: j.jobNumber, days: Math.round((new Date(j.createdAt) - new Date(first)) / 86400000), month: ptMonth(j.createdAt) });
    break;
  }
}
const buckets = { 'same day': 0, '1-3d': 0, '4-14d': 0, '15-60d': 0, '>60d': 0, 'job BEFORE call': 0 };
for (const l of lags) {
  if (l.days < 0) buckets['job BEFORE call']++;
  else if (l.days === 0) buckets['same day']++;
  else if (l.days <= 3) buckets['1-3d']++;
  else if (l.days <= 14) buckets['4-14d']++;
  else if (l.days <= 60) buckets['15-60d']++;
  else buckets['>60d']++;
}
console.log(`\nLag from first tracked call → job creation (n=${lags.length}):`);
for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(16)} ${String(v).padStart(4)}  ${pct(v, lags.length)}`);

// 4. client-record creation date vs call date — is the CallRail sync the thing creating clients?
const clientCreated = new Map();
for (const c of book) for (const p of (c.phones || [])) { const d = digits(p.number); if (d.length >= 10 && (!clientCreated.has(d) || new Date(c.createdAt) < new Date(clientCreated.get(d)))) clientCreated.set(d, c.createdAt); }
console.log('\nOf unique callers each month, how many have a Jobber client record created within 2 days of the call (= auto-sync intake):');
for (const m of [...new Set(inbound.map((c) => ptMonth(c.start_time)))].sort()) {
  const uniq = [...new Set(inbound.filter((c) => ptMonth(c.start_time) === m).map((c) => digits(c.customer_phone_number)).filter((d) => d.length >= 10))];
  let sync = 0, none = 0, older = 0;
  for (const d of uniq) {
    const cc = clientCreated.get(d);
    if (!cc) { none++; continue; }
    const firstCall = callPhones.get(d).map((c) => c.start_time).sort()[0];
    const gap = Math.abs(new Date(cc) - new Date(firstCall)) / 86400000;
    if (gap <= 2) sync++; else if (new Date(cc) < new Date(firstCall)) older++;
  }
  console.log(`  ${m}  uniq ${String(uniq.length).padStart(4)}  intake-created ${String(sync).padStart(4)} (${pct(sync, uniq.length)})  pre-existing ${String(older).padStart(4)}  no record ${String(none).padStart(4)}`);
}

// 5. quote-side view of the same months (are May leads showing up as quotes?)
console.log('\nQuotes created per month (window months only) and their status now:');
for (const m of ['2026-05', '2026-06', '2026-07']) {
  const qs = quotes.filter((q) => ptMonth(q.createdAt) === m);
  const t = {}; for (const q of qs) t[q.quoteStatus] = (t[q.quoteStatus] || 0) + 1;
  console.log(`  ${m}  ${String(qs.length).padStart(4)}  ${Object.entries(t).map(([k, v]) => `${k}:${v}`).join('  ')}`);
}
