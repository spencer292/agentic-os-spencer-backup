// Route-sync ENGINE (reference logic for the n8n Code nodes). Read-only dry-run.
// Produces, for a target date: the time-fix list + the write-back plan (tech/time),
// honoring the freeze-today rule. Nothing is written.
import { execFileSync } from 'node:child_process';

const REPO = 'C:/Agentic-os-got-moles';
const JOBBER = `${REPO}/.claude/skills/tool-jobber/scripts/jobber-api.mjs`;
const OPTIMO = `${REPO}/.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs`;
const TODAY = '2026-07-06'; // in n8n: "now" in America/Los_Angeles
const DATE = process.argv[2] || '2026-07-08';
const FIX_START = '07:00', FIX_END = '19:00';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextDay = (d) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
const toPacific = (iso) => { const d = new Date(iso); d.setUTCHours(d.getUTCHours() - 7); return d.toISOString(); };

// --- FREEZE-TODAY GUARD ---
if (DATE <= TODAY) { console.error(`REFUSED: ${DATE} is today or past — frozen (techs dispatched).`); process.exit(1); }

// --- OptimoRoute plan ---
const orRaw = JSON.parse(execFileSync('node', [OPTIMO, 'routes', DATE], { encoding: 'utf8', maxBuffer: 1 << 24 }));
const planByOrder = new Map();
const stopsByDriver = {};
for (const route of orRaw.routes || []) {
  const driver = route.driverName || '(unassigned)';
  for (const s of route.stops || []) {
    stopsByDriver[driver] = (stopsByDriver[driver] || 0) + 1;
    planByOrder.set(String(s.orderNo), { driver, timePacific: s.scheduledAtDt ? s.scheduledAtDt.slice(11, 16) : null });
  }
}

// --- Jobber visits (paginated, throttle-safe) ---
async function fetchVisits() {
  const all = []; let cursor = null, hasNext = true, page = 0;
  while (hasNext && page < 20) {
    page++;
    const after = cursor ? `, after: "${cursor}"` : '';
    const q = `query { visits(first: 30${after}, filter: { startAt: { after: "${DATE}T07:00:00Z", before: "${nextDay(DATE)}T07:00:00Z" } }) { nodes { id startAt endAt job { jobNumber } assignedUsers { nodes { name { full } } } } pageInfo { hasNextPage endCursor } } }`;
    let parsed = null;
    for (let a = 1; a <= 6; a++) {
      const out = execFileSync('node', [JOBBER, 'query', q], { encoding: 'utf8', maxBuffer: 1 << 24 });
      if (out.includes('"jobNumber"') || out.includes('"nodes": []')) { parsed = JSON.parse(out.slice(out.indexOf('{'))); break; }
      await sleep(8000);
    }
    if (!parsed) throw new Error('Jobber throttled, page ' + page);
    all.push(...parsed.visits.nodes);
    hasNext = parsed.visits.pageInfo.hasNextPage; cursor = parsed.visits.pageInfo.endCursor;
    await sleep(1500);
  }
  return all;
}
const visits = await fetchVisits();

// --- classify + plan ---
const timeFix = [];       // anytime visits NOT in plan -> set 07:00-19:00 (become routable)
const writeBack = [];     // visits IN plan -> assign OR tech + OR time
const timedNotPlanned = []; // timed but not routed by OR -> flag (overflow/unschedulable)
const seenJobs = new Set();
for (const v of visits) {
  const jn = v.job && v.job.jobNumber; if (jn == null) continue;
  seenJobs.add(String(jn));
  const startP = toPacific(v.startAt).slice(11, 16);
  const anytime = startP === '00:00'; // "anytime" marker
  const plan = planByOrder.get(String(jn));
  if (plan) {
    // In the OR plan -> write its tech + time back, whatever Jobber currently shows
    const curTech = (v.assignedUsers?.nodes || []).map((u) => u.name.full).sort().join(', ') || '(none)';
    const techChange = curTech !== plan.driver;
    const timeChange = (anytime ? 'anytime' : startP) !== plan.timePacific;
    writeBack.push({ job: String(jn), tech: `${curTech} -> ${plan.driver}`, techChange, time: `${anytime ? 'anytime' : startP} -> ${plan.timePacific}`, timeChange });
  } else if (anytime) {
    timeFix.push({ job: String(jn), set: `${FIX_START}-${FIX_END}` });
  } else {
    timedNotPlanned.push({ job: String(jn), time: startP });
  }
}
// OR-plan orders with no matching Jobber visit (should be ~0)
const orphanOrders = [...planByOrder.keys()].filter((o) => !seenJobs.has(o));

// --- report ---
console.log(`\n===== DRY RUN — ${DATE} (read-only) =====`);
console.log(`OptimoRoute plan: ${[...planByOrder.keys()].length} stops  (${Object.entries(stopsByDriver).map(([d, n]) => `${d}=${n}`).join(', ')})`);
console.log(`Jobber active visits: ${visits.length}`);
console.log(`\n[1] WRITE-BACK — visits in the OR plan -> assign tech + time: ${writeBack.length}`);
console.log(`    would change tech: ${writeBack.filter((w) => w.techChange).length}   would change time: ${writeBack.filter((w) => w.timeChange).length}`);
console.log(`    orphan OR orders (no Jobber visit): ${orphanOrders.length}`);
console.log(`    sample:`);
for (const w of writeBack.slice(0, 8)) console.log(`      job ${w.job}: tech[${w.tech}]${w.techChange ? ' *' : ''}  time[${w.time}]${w.timeChange ? ' *' : ''}`);
console.log(`\n[2] TIME-FIX — anytime visits NOT yet routed -> set ${FIX_START}-${FIX_END}: ${timeFix.length}`);
console.log(`    (become routable; next optimize places them or flags overflow)`);
console.log(`\n[3] FLAG — timed visits OptimoRoute did not route (overflow?): ${timedNotPlanned.length}`);
for (const t of timedNotPlanned.slice(0, 5)) console.log(`      job ${t.job} @ ${t.time}`);
