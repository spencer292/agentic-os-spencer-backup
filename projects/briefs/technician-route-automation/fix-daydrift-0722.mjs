// One-off (2026-07-21, Spencer in-session): move the two day-drifted orders off 7/22 to their
// new Jobber day 7/24 BEFORE running drift-check fix, so the 7/22 re-plan can't pull them back.
// The subsequent drift-check fix run re-detects them as missing on 7/24, SYNCs the correct
// Jobber tech, re-plans 7/24, and writes times back.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../..', '.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// Round 2 (same session): Thu→Fri moves Spencer made in Jobber after the first fix run.
const MOVES = [
  { orderNo: '7735-2254957236', date: '2026-07-24' },
  { orderNo: '6409-2255182374', date: '2026-07-24' },
  { orderNo: '5829-2255248341', date: '2026-07-24' },
];

for (const mv of MOVES) {
  const res = await fetch(`https://api.optimoroute.com/v1/create_order?key=${env.OPTIMOROUTE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'UPDATE',
      orderNo: mv.orderNo,
      date: mv.date,
      allowedDates: { from: mv.date, to: mv.date },
      priority: 'M',
    }),
  });
  const d = await res.json().catch(() => ({}));
  console.log(mv.orderNo, '->', mv.date, d.success ? 'OK' : 'FAILED ' + JSON.stringify(d).slice(0, 200));
  await new Promise((r) => setTimeout(r, 400));
}
