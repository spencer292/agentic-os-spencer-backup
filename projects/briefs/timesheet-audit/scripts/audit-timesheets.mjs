#!/usr/bin/env node
// audit-timesheets.mjs — check Gusto timesheet exports against Jobber visit completion stamps
// before Spencer approves payroll. See ../.claude/skills/ops-timesheet-audit/SKILL.md for the
// weekly procedure and ../punch-policy.md for the rule techs are told.
//
// Standalone by design (route-engine/redesign is a separate, unrelated project): the CSV parsing
// and NAME_MAP pattern below are copied from
// projects/briefs/route-engine/redesign/scripts/parse-gusto-hours.mjs, and the Jobber auth/query
// pattern is copied from projects/briefs/route-engine/redesign/scripts/pull-jobber.mjs. Neither is
// imported.
//
// Usage (from repo root):
//   node projects/briefs/timesheet-audit/scripts/audit-timesheets.mjs [--csv <path>] [--visits <path>] [--from YYYY-MM-DD --to YYYY-MM-DD]
//
// --csv defaults to the newest *time-tracking-hours*.csv in private/.
// Window defaults to the CSV filename's ...-YYYY-MM-DD-to-YYYY-MM-DD.csv range, falling back to
// the min/max row date in the CSV.
// Without --visits, completed Jobber visits for the window are pulled live and cached to
// private/visits-{from}-to-{to}.json.
//
// Never writes to Gusto or Jobber. Reports never carry a rate or a dollar figure — hours only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PROJECT_DIR = path.resolve(__dirname, '..');
const PRIVATE_DIR = path.join(PROJECT_DIR, 'private');
const REPORTS_DIR = path.join(PROJECT_DIR, 'reports');
const RULES_PATH = path.join(PROJECT_DIR, 'rules.json');
const ENV_PATH = path.join(ROOT, '.env');
fs.mkdirSync(PRIVATE_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const RULES = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

// ---------------- CLI ----------------
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq !== -1) { out[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; }
    else out[key] = true;
  }
  return out;
}
const ARGS = parseArgs(process.argv.slice(2));

// ---------------- small date/time helpers ----------------
// Anchor at noon UTC for pure calendar-date arithmetic so no local-TZ / DST slip creeps in.
const addDaysStr = (dateStr, n) => { const d = new Date(dateStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dowOf = dateStr => new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0=Sun..6=Sat
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const isWeekendStr = dateStr => { const d = dowOf(dateStr); return d === 0 || d === 6; };
const mondayOf = dateStr => { const x = new Date(dateStr + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const fmtHM = min => min == null ? null : `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Local-midnight-of-a-Pacific-calendar-date -> UTC ISO, without a tz library: try both standard
// offsets and keep whichever one actually formats back to that same Pacific date at hour 00.
function pacificMidnightUTC(dateStr) {
  for (const offset of ['-07:00', '-08:00']) {
    const d = new Date(`${dateStr}T00:00:00${offset}`);
    const p = pacificParts(d.toISOString());
    if (p.date === dateStr) return d.toISOString();
  }
  return new Date(`${dateStr}T00:00:00-08:00`).toISOString(); // shouldn't happen
}
function pacificParts(isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const map = {}; for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === '24' ? '00' : map.hour; // Intl quirk: midnight can print as "24"
  return { date: `${map.year}-${map.month}-${map.day}`, minutesOfDay: (+hour) * 60 + (+map.minute) };
}

// ---------------- Gusto CSV parsing (copied pattern from parse-gusto-hours.mjs) ----------------
const parseCsvLine = l => {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
};

function parseClockTime(s) {
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (!m) return null;
  let h = +m[1] % 12; if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + (+m[2]);
}
function parseBreakMinutes(breakStr) {
  const m = String(breakStr || '').match(/(\d{1,2}:\d{2}\s*[AP]M).*?-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!m) return 0;
  const s = parseClockTime(m[1]), e = parseClockTime(m[2]);
  return (s == null || e == null) ? 0 : Math.max(0, e - s);
}

function newestCsv() {
  const files = fs.readdirSync(PRIVATE_DIR).filter(f => /time-tracking-hours.*\.csv$/i.test(f)).sort();
  if (!files.length) { console.error(`No *time-tracking-hours*.csv found in ${PRIVATE_DIR}. Export it from Gusto (Time tools -> Time tracking -> Hours -> Export CSV) and drop it there.`); process.exit(1); }
  return path.join(PRIVATE_DIR, files[files.length - 1]);
}

function parseGustoCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const rows = [];
  let tech = null, header = null;
  for (const raw of lines) {
    const m = raw.match(/^"Hours for (.+)"$/);
    if (m) { tech = RULES.techNameMap[m[1]] || m[1]; header = null; continue; }
    if (!tech) continue;
    const cells = parseCsvLine(raw);
    if (cells[0] === 'Date') { header = cells; continue; }
    if (!header || !/^\d\d\/\d\d\/\d\d$/.test(cells[0])) continue;
    const rec = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
    const [mm, dd, yy] = cells[0].split('/');
    const date = `20${yy}-${mm}-${dd}`;
    const span = (rec['Hours'] || '').match(/^(\d{1,2}:\d\d [AP]M) - (\d{1,2}:\d\d [AP]M)/);
    const breaks = Object.keys(rec).filter(k => /^Breaks/.test(k)).map(k => rec[k]).filter(Boolean);
    const clockIn = span ? span[1] : null, clockOut = span ? span[2] : null;
    rows.push({
      tech, date,
      totalHours: +rec['Total hours'] || 0,
      regularHours: +rec['Regular hours'] || 0,
      overtime: +rec['Overtime'] || 0,
      clockIn, clockOut,
      clockInMin: parseClockTime(clockIn), clockOutMin: parseClockTime(clockOut),
      breaks, breakMin: breaks.reduce((s, b) => s + parseBreakMinutes(b), 0),
      note: rec['Notes'] || '',
      status: rec['Approval status'] || '',
    });
  }
  return rows;
}

function windowFromFilename(file) {
  const m = path.basename(file).match(/(\d{4}-\d{2}-\d{2})-to-(\d{4}-\d{2}-\d{2})/);
  return m ? { from: m[1], to: m[2] } : null;
}

// ---------------- correction-note time-mention matching ----------------
function extractTimeMentions(note) {
  const out = []; const re = /(\d{1,2}):(\d{2})\s*(am|pm)?/gi; let m;
  while ((m = re.exec(note))) out.push({ h: +m[1], m: +m[2], ap: m[3] ? m[3].toLowerCase() : null, raw: m[0] });
  return out;
}
const to24 = (h, m, ap) => { let hh = h % 12; if (ap === 'pm') hh += 12; return hh * 60 + m; };
function findBestTimeMention(note, g) {
  const mentions = extractTimeMentions(note);
  if (!mentions.length) return null;
  let best = null;
  for (const mn of mentions) {
    const candidates = mn.ap ? [to24(mn.h, mn.m, mn.ap)] : [to24(mn.h, mn.m, 'am'), to24(mn.h, mn.m, 'pm')];
    for (const cand of candidates) {
      for (const field of ['clockIn', 'clockOut']) {
        const actual = field === 'clockIn' ? g.clockInMin : g.clockOutMin;
        if (actual == null) continue;
        const diff = Math.abs(cand - actual);
        if (!best || diff < best.diffMin) best = { diffMin: diff, field, intendedMin: cand, actualMin: actual, label: mn.raw };
      }
    }
  }
  return best;
}

// ---------------- Jobber auth + visits pull (pattern copied from pull-jobber.mjs) ----------------
function readEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
  return env;
}
function saveEnvKey(k, v) { let t = fs.readFileSync(ENV_PATH, 'utf8'); const re = new RegExp('^' + k + '=.*$', 'm'); t = re.test(t) ? t.replace(re, k + '=' + v) : t + '\n' + k + '=' + v + '\n'; fs.writeFileSync(ENV_PATH, t); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function jobberToken(env) {
  if (!env.JOBBER_CLIENT_ID || !env.JOBBER_CLIENT_SECRET || !env.JOBBER_REFRESH_TOKEN) {
    throw new Error('JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET / JOBBER_REFRESH_TOKEN not set in .env — cannot pull live visits. Pass --visits <path> to run offline instead.');
  }
  const r = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.access_token) throw new Error(`Jobber token refresh failed: ${JSON.stringify(d).slice(0, 300)}`);
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  return d.access_token;
}

async function jobberQuery(token, q, v, a = 0) {
  let r;
  try {
    r = await fetch('https://api.getjobber.com/api/graphql', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
      body: JSON.stringify({ query: q, variables: v }),
    });
  } catch (e) {
    if (a < 6) { await sleep(3000 * 2 ** a); return jobberQuery(token, q, v, a + 1); }
    throw e;
  }
  const d = await r.json().catch(() => ({}));
  const throttled = r.status === 429 || (d.errors && JSON.stringify(d.errors).includes('THROTTLED'));
  if (throttled && a < 9) { const wait = Math.min(90000, 3000 * 2 ** a); console.log(`  … throttled — backing off ${wait / 1000}s`); await sleep(wait); return jobberQuery(token, q, v, a + 1); }
  if (d.errors) throw new Error(`Jobber GraphQL error: ${JSON.stringify(d.errors).slice(0, 500)}`);
  return d;
}

async function pullJobberVisits(fromDate, toDate) {
  const env = readEnv();
  const token = await jobberToken(env);
  const queryFrom = pacificMidnightUTC(addDaysStr(fromDate, -RULES.queryBufferDays));
  const queryTo = pacificMidnightUTC(addDaysStr(toDate, RULES.queryBufferDays + 1));
  const Q = `query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime,$n:Int!){
    visits(first:$n, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
      nodes{ id title startAt isComplete completedAt visitStatus
        job{ jobNumber }
        client{ name }
        assignedUsers(first:5){ nodes{ name{ full } } } }
      pageInfo{ hasNextPage endCursor }
      totalCount } }`;
  let rows = [], cursor = null, pages = 0;
  for (;;) {
    const d = await jobberQuery(token, Q, { a: cursor, after: queryFrom, before: queryTo, n: 50 });
    if (!d.data?.visits) throw new Error(`visits query returned no data: ${JSON.stringify(d).slice(0, 400)}`);
    for (const v of d.data.visits.nodes) {
      rows.push({
        id: v.id, title: v.title || '', startAt: v.startAt, isComplete: v.isComplete, completedAt: v.completedAt,
        visitStatus: v.visitStatus, jobNumber: v.job?.jobNumber ?? null, clientName: v.client?.name || null,
        techs: (v.assignedUsers?.nodes || []).map(u => u.name?.full).filter(Boolean),
      });
    }
    pages++;
    const p = d.data.visits.pageInfo;
    cursor = p.hasNextPage ? p.endCursor : null;
    if (pages === 1) console.log(`  pulling Jobber visits ${queryFrom} .. ${queryTo} (totalCount ${d.data.visits.totalCount})`);
    if (!cursor) break;
    await sleep(300);
  }
  console.log(`  pulled ${rows.length} visits over ${pages} page(s)`);
  return rows;
}

// ---------------- visit aggregation per tech per Pacific-date ----------------
function buildVisitAggregates(visits, fromDate, toDate) {
  // techDate: "Tech Name|YYYY-MM-DD" -> array of {minutesOfDay, completedAt}
  const byTechDate = new Map();
  for (const v of visits) {
    if (!v.isComplete || !v.completedAt) continue;
    const { date, minutesOfDay } = pacificParts(v.completedAt);
    if (date < fromDate || date > toDate) continue;
    for (const tech of v.techs || []) {
      const key = `${tech}|${date}`;
      if (!byTechDate.has(key)) byTechDate.set(key, []);
      byTechDate.get(key).push({ minutesOfDay, completedAt: v.completedAt });
    }
  }
  const agg = new Map(); // key -> stats
  const totalStopsByTech = new Map();
  for (const [key, stamps] of byTechDate) {
    const [tech] = key.split('|');
    totalStopsByTech.set(tech, (totalStopsByTech.get(tech) || 0) + stamps.length);
    stamps.sort((a, b) => a.minutesOfDay - b.minutesOfDay);
    let arr = [...stamps];
    const evening = [];
    while (arr.length > 1) {
      const last = arr[arr.length - 1], prev = arr[arr.length - 2];
      const gap = last.minutesOfDay - prev.minutesOfDay;
      if (last.minutesOfDay >= RULES.thresholds.eveningStampHour * 60 && gap > RULES.thresholds.eveningStampGapMin) evening.push(arr.pop());
      else break;
    }
    let maxGapMin = 0;
    for (let i = 1; i < arr.length; i++) maxGapMin = Math.max(maxGapMin, arr[i].minutesOfDay - arr[i - 1].minutesOfDay);
    agg.set(key, {
      stopsCount: stamps.length,
      firstStamp: arr.length ? arr[0].minutesOfDay : null,
      lastStamp: arr.length ? arr[arr.length - 1].minutesOfDay : null,
      maxGapMin,
      afternoonStamps: stamps.filter(s => s.minutesOfDay >= RULES.thresholds.afternoonStampHour * 60).length,
      eveningStamps: evening.map(e => e.minutesOfDay),
    });
  }
  return { agg, totalStopsByTech };
}

// ---------------- flag evaluation ----------------
function evaluateDay({ tech, date, g, v }) {
  const dow = DOW_NAMES[dowOf(date)];
  const weekend = isWeekendStr(date);
  const note = g?.note || '';
  const status = g?.status || '';
  const fixable = status !== 'Approved';
  const acceptedRe = new RegExp(RULES.acceptedNoteReasons.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  const punchOutRe = new RegExp(RULES.punchOutNoteRegex, 'i');
  const flags = [];
  const push = (type, detail, impactHours) => flags.push({ type, tech, date, dow, fixable, note: note || null, impactHours: impactHours == null ? null : +impactHours.toFixed(2), detail });

  if (g && v && g.clockOutMin != null && v.lastStamp != null) {
    const gap = g.clockOutMin - v.lastStamp;
    if (gap > RULES.thresholds.missedClockOutMin && !acceptedRe.test(note)) {
      push('MISSED_CLOCK_OUT', { clockOut: fmtHM(g.clockOutMin), lastStamp: fmtHM(v.lastStamp), gapMin: gap }, gap / 60);
    }
  }
  if (g && v && g.clockInMin != null && v.firstStamp != null) {
    const gap = g.clockInMin - v.firstStamp;
    if (gap > RULES.thresholds.lateClockInMin) push('LATE_CLOCK_IN', { clockIn: fmtHM(g.clockInMin), firstStamp: fmtHM(v.firstStamp), gapMin: gap }, -gap / 60);
  }
  if (g && v && g.clockInMin != null && v.firstStamp != null) {
    const gap = v.firstStamp - g.clockInMin;
    if (gap > RULES.thresholds.earlyClockInMin) push('EARLY_CLOCK_IN', { clockIn: fmtHM(g.clockInMin), firstStamp: fmtHM(v.firstStamp), gapMin: gap }, gap / 60);
  }
  if (g && note && (g.clockInMin != null || g.clockOutMin != null)) {
    const best = findBestTimeMention(note, g);
    if (best && best.diffMin > RULES.thresholds.correctionMismatchMin) {
      const impact = best.field === 'clockIn' ? (best.intendedMin - best.actualMin) / 60 : (best.actualMin - best.intendedMin) / 60;
      push('CORRECTION_NOT_APPLIED', { mentioned: best.label, field: best.field, actual: fmtHM(best.actualMin), diffMin: best.diffMin }, impact);
    }
  }
  if (g && v && note && punchOutRe.test(note) && g.clockOutMin != null && v.lastStamp != null) {
    if (g.clockOutMin < v.lastStamp - RULES.thresholds.correctionBeforeLastStampMin) {
      push('CORRECTION_BEFORE_LAST_STAMP', { clockOut: fmtHM(g.clockOutMin), lastStamp: fmtHM(v.lastStamp) }, -(v.lastStamp - g.clockOutMin) / 60);
    }
  }
  if (!weekend && v && v.stopsCount >= 1 && (!g || (g.totalHours || 0) === 0) && !RULES.holidays.includes(date)) {
    const impact = (v.firstStamp != null && v.lastStamp != null) ? -(v.lastStamp - v.firstStamp) / 60 : null;
    push('MISSING_PUNCH', { stops: v.stopsCount, firstStamp: fmtHM(v.firstStamp), lastStamp: fmtHM(v.lastStamp) }, impact);
  }
  if (g && (g.totalHours || 0) > 0 && (!v || v.stopsCount === 0)) {
    push('PAID_NO_STOPS', { paidHours: g.totalHours }, null);
  }
  if (g && g.totalHours >= RULES.thresholds.longDayHours) push('LONG_DAY', { paidHours: g.totalHours }, null);
  if (g && g.clockInMin != null && g.clockOutMin != null) {
    const span = (g.clockOutMin - g.clockInMin - (g.breakMin || 0)) / 60;
    if (Math.abs(span - g.totalHours) > RULES.thresholds.spanMismatchHours) push('SPAN_MISMATCH', { span: +span.toFixed(2), paidHours: g.totalHours, breakMin: g.breakMin }, g.totalHours - span);
  }
  if (weekend && g && (g.totalHours || 0) > 0) push('WEEKEND_PUNCH', { paidHours: g.totalHours }, null);
  if (g && status && status !== 'Approved' && (g.totalHours || 0) > 0) push('UNAPPROVED', { status }, null);

  return flags;
}

// ---------------- main ----------------
async function main() {
  const csvPath = ARGS.csv ? path.resolve(ARGS.csv) : newestCsv();
  console.log(`Gusto export: ${path.relative(ROOT, csvPath)}`);
  const gustoRows = parseGustoCsv(csvPath);
  if (!gustoRows.length) { console.error('No rows parsed from the Gusto CSV — check the format.'); process.exit(1); }

  let from = ARGS.from, to = ARGS.to;
  if (!from || !to) {
    const w = windowFromFilename(csvPath);
    if (w) { from = from || w.from; to = to || w.to; }
    else {
      const dates = gustoRows.map(r => r.date).sort();
      from = from || dates[0]; to = to || dates[dates.length - 1];
    }
  }
  console.log(`Window: ${from} to ${to}`);

  let visits;
  const visitsCachePath = path.join(PRIVATE_DIR, `visits-${from}-to-${to}.json`);
  if (ARGS.visits) {
    console.log(`Visits: offline fixture ${ARGS.visits}`);
    visits = JSON.parse(fs.readFileSync(path.resolve(ARGS.visits), 'utf8'));
  } else {
    console.log('Visits: pulling live from Jobber…');
    try {
      visits = await pullJobberVisits(from, to);
      fs.writeFileSync(visitsCachePath, JSON.stringify(visits, null, 1));
      console.log(`  cached -> ${path.relative(ROOT, visitsCachePath)}`);
    } catch (e) {
      console.error(`Live Jobber pull failed: ${e.message}`);
      process.exit(1);
    }
  }

  const { agg: visitAgg, totalStopsByTech } = buildVisitAggregates(visits, from, to);

  // techs to audit = Gusto techs with >=1 visit ever in the pulled set, plus salariedNoClock (Jobber-only)
  const gustoTechs = [...new Set(gustoRows.map(r => r.tech))];
  const skippedTechs = [];
  const auditTechs = [];
  for (const t of gustoTechs) {
    if ((totalStopsByTech.get(t) || 0) === 0) skippedTechs.push({ tech: t, note: 'no field visits found in window — likely office staff' });
    else auditTechs.push(t);
  }
  for (const t of RULES.salariedNoClock) if (!auditTechs.includes(t)) auditTechs.push(t);

  const dayRecords = [];
  for (const tech of auditTechs) {
    const salaried = RULES.salariedNoClock.includes(tech);
    for (let d = from; d <= to; d = addDaysStr(d, 1)) {
      const g = salaried ? null : gustoRows.find(r => r.tech === tech && r.date === d) || null;
      const v = visitAgg.get(`${tech}|${d}`) || null;
      if (!g && !v) continue;
      const flags = salaried ? [] : evaluateDay({ tech, date: d, g, v });
      // PAID_NO_STOPS only counts within the pulled visits window (always true here since we loop from..to)
      dayRecords.push({ tech, date: d, dow: DOW_NAMES[dowOf(d)], salaried, gusto: g, visit: v, flags });
    }
  }

  const allFlags = dayRecords.flatMap(r => r.flags);

  // ---------------- weekly table ----------------
  const weeks = [...new Set(dayRecords.map(r => mondayOf(r.date)))].sort();
  const weeklyRows = [];
  for (const tech of auditTechs) {
    const salaried = RULES.salariedNoClock.includes(tech);
    for (const wk of weeks) {
      const days = dayRecords.filter(r => r.tech === tech && mondayOf(r.date) === wk);
      if (!days.length) continue;
      const stops = days.reduce((s, r) => s + (r.visit?.stopsCount || 0), 0);
      if (salaried) { weeklyRows.push({ tech, week: wk, salaried: true, stops }); continue; }
      const paid = days.reduce((s, r) => s + (r.gusto?.totalHours || 0), 0);
      const ot = days.reduce((s, r) => s + (r.gusto?.overtime || 0), 0);
      const flaggedDays = days.filter(r => r.flags.length > 0);
      const overpaidFromFlags = flaggedDays.reduce((s, r) => s + r.flags.reduce((s2, f) => s2 + (f.impactHours > 0 ? f.impactHours : 0), 0), 0);
      const otCausedByFlag = ot > 0 && (paid - overpaidFromFlags) <= 40;
      weeklyRows.push({
        tech, week: wk, salaried: false, paid: +paid.toFixed(2), ot: +ot.toFixed(2), stops,
        stopsPerPaidHour: paid > 0 ? +(stops / paid).toFixed(2) : null,
        otPer100Stops: stops > 0 ? +((ot / stops) * 100).toFixed(2) : null,
        flaggedDayCount: flaggedDays.length,
        otCausedByFlag,
      });
    }
  }

  // ---------------- evening/bulk stamps ----------------
  const eveningNotes = [];
  for (const r of dayRecords) {
    if (r.visit?.eveningStamps?.length) {
      eveningNotes.push({ tech: r.tech, date: r.date, dow: r.dow, stamps: r.visit.eveningStamps.map(fmtHM), lastRealStamp: fmtHM(r.visit.lastStamp) });
    }
  }

  // ---------------- write private JSON ----------------
  const auditOut = { source: path.basename(csvPath), window: { from, to }, generatedAt: new Date().toISOString(), skippedTechs, dayRecords, weeklyRows, eveningNotes };
  const privateOutPath = path.join(PRIVATE_DIR, `${to}_audit.json`);
  fs.writeFileSync(privateOutPath, JSON.stringify(auditOut, null, 1));

  // ---------------- markdown report ----------------
  const fixable = allFlags.filter(f => f.fixable && f.type !== 'UNAPPROVED');
  const nonFixable = allFlags.filter(f => !f.fixable && f.type !== 'UNAPPROVED');
  const unapproved = allFlags.filter(f => f.type === 'UNAPPROVED');

  const flagRow = f => `| ${f.tech} | ${f.date} (${f.dow}) | ${f.type} | ${JSON.stringify(f.detail).replace(/[{}"]/g, '').replace(/,/g, ', ')} | ${f.impactHours == null ? '—' : (f.impactHours > 0 ? '+' : '') + f.impactHours + ' h'} |`;
  const flagTable = list => list.length
    ? `| Tech | Date | Flag | Detail | Est. impact |\n|---|---|---|---|---|\n${list.map(flagRow).join('\n')}`
    : '_None._';

  const weeklyTable = weeklyRows.length
    ? `| Tech | Week of | Paid h | OT h | Stops | Stops/paid h | OT h/100 stops | Flagged days | OT from a flagged day? |\n|---|---|---|---|---|---|---|---|---|\n` +
      weeklyRows.map(r => r.salaried
        ? `| ${r.tech} | ${r.week} | — | — | ${r.stops} | — | — | — | salaried |`
        : `| ${r.tech} | ${r.week} | ${r.paid} | ${r.ot} | ${r.stops} | ${r.stopsPerPaidHour ?? '—'} | ${r.otPer100Stops ?? '—'} | ${r.flaggedDayCount} | ${r.otCausedByFlag ? 'yes' : 'no'} |`
      ).join('\n')
    : '_No weeks in range._';

  const eveningTable = eveningNotes.length
    ? `| Tech | Date | Stamp(s) excluded | Last real stamp used |\n|---|---|---|---|\n` +
      eveningNotes.map(e => `| ${e.tech} | ${e.date} (${e.dow}) | ${e.stamps.join(', ')} | ${e.lastRealStamp ?? '—'} |`).join('\n')
    : '_None._';

  const skippedNote = skippedTechs.length ? `\nSkipped (no field visits in window): ${skippedTechs.map(s => s.tech).join(', ')}.\n` : '';
  const unapprovedNote = unapproved.length
    ? `\n${[...new Set(unapproved.map(f => f.tech))].map(t => `${t} (${unapproved.filter(f => f.tech === t).length} day(s))`).join(', ')} still unapproved in Gusto for this window — the flags above still apply once approved.\n`
    : '';

  const report = `# Timesheet audit — ${from} to ${to}

Source: \`${path.basename(csvPath)}\`. Jobber completion stamps are the ground truth for when a
tech was working; a timesheet row that disagrees by more than a normal drive-in/out is a
discrepancy until a note explains it. Hours only — no rate or dollar figure appears anywhere below.
${skippedNote}
## 1. Fix before approving

Rows still unapproved in Gusto that the stamps contradict.

${flagTable(fixable)}

## 2. Already approved, worth a word

Same class of finding on rows already paid. Nothing to edit in Gusto; raise it with the tech and,
if a pattern forms, hand it to \`ops-hr\`.

${flagTable(nonFixable)}
${unapprovedNote}
## 3. Overtime vs. stops, by tech by week

${weeklyTable}

Read this for two things: overtime with no stops behind it (a punch problem, see part 1/2 above),
and overtime at the same stop count as a tech with none (a pace question for route-engine, not
this audit).

## 4. Evening and bulk stamps noticed

Stamps after ${RULES.thresholds.eveningStampHour}:00 with a gap of more than
${RULES.thresholds.eveningStampGapMin} minutes before them are usually office bulk edits, not field
work. They are excluded from the tech's last stamp above and listed here so nobody reads them as a
late-night job.

${eveningTable}

## 5. Method

Thresholds (edit in \`rules.json\`): clock-out more than ${RULES.thresholds.missedClockOutMin} min
after the last stamp with no accepted-reason note = missed clock-out. Clock-in more than
${RULES.thresholds.lateClockInMin} min after the first stamp = late clock-in (underpaid). Clock-in
more than ${RULES.thresholds.earlyClockInMin} min before the first stamp = early clock-in
(overpaid). A note-mentioned time off by more than ${RULES.thresholds.correctionMismatchMin} min
from the recorded clock time = correction not applied. A "clock out"/"punch out" note with a
clock-out more than ${RULES.thresholds.correctionBeforeLastStampMin} min before the last stamp =
correction set before the last job. A weekday with stops but zero paid hours = missing punch (US
holidays in \`rules.json\` are exempt). Paid hours with zero stops in the pulled window, any day at
${RULES.thresholds.longDayHours}+ paid hours, a clock span vs. paid-hours gap over
${RULES.thresholds.spanMismatchHours} h, and any weekend paid hours are flagged for a look, not
assumed wrong. Estimated impact is signed: **+ overpaid** (paid for time not worked), **−
underpaid** (worked but not paid); flags with no reliable estimate show \`—\`.
`;
  const reportPath = path.join(REPORTS_DIR, `${to}_timesheet-audit.md`);
  fs.writeFileSync(reportPath, report);

  // ---------------- console summary ----------------
  console.log(`\nTechs audited: ${auditTechs.join(', ')}`);
  if (skippedTechs.length) console.log(`Skipped (office, no field visits): ${skippedTechs.map(s => s.tech).join(', ')}`);
  console.log(`\nFlags: ${allFlags.length} total`);
  const byType = {};
  for (const f of allFlags) byType[f.type] = (byType[f.type] || 0) + 1;
  for (const [t, n] of Object.entries(byType)) console.log(`  ${t}: ${n}`);
  console.log(`\n-- Fix before approving (${fixable.length}) --`);
  for (const f of fixable) console.log(`  ${f.tech.padEnd(16)} ${f.date} ${f.dow}  ${f.type.padEnd(24)} ${JSON.stringify(f.detail)}  impact=${f.impactHours ?? '—'}`);
  console.log(`\n-- Already approved, worth a word (${nonFixable.length}) --`);
  for (const f of nonFixable) console.log(`  ${f.tech.padEnd(16)} ${f.date} ${f.dow}  ${f.type.padEnd(24)} ${JSON.stringify(f.detail)}  impact=${f.impactHours ?? '—'}`);
  console.log(`\n-- Weekly OT vs stops --`);
  for (const r of weeklyRows) {
    if (r.salaried) console.log(`  ${r.tech.padEnd(16)} wk ${r.week}  stops=${r.stops} (salaried)`);
    else console.log(`  ${r.tech.padEnd(16)} wk ${r.week}  paid=${r.paid} ot=${r.ot} stops=${r.stops} stops/h=${r.stopsPerPaidHour ?? '—'} ot/100stops=${r.otPer100Stops ?? '—'} flaggedDays=${r.flaggedDayCount} otFromFlag=${r.otCausedByFlag}`);
  }
  console.log(`\n-- Evening/bulk stamps (${eveningNotes.length}) --`);
  for (const e of eveningNotes) console.log(`  ${e.tech.padEnd(16)} ${e.date} ${e.dow}  excluded=${e.stamps.join(',')} lastReal=${e.lastRealStamp ?? '—'}`);

  console.log(`\nWrote:\n  ${path.relative(ROOT, reportPath)}\n  ${path.relative(ROOT, privateOutPath)}`);
}

main();
