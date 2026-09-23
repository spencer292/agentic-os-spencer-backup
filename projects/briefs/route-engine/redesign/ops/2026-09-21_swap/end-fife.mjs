// end-fife.mjs — Robert must finish Wed 2026-09-23 in Fife (Spencer, 09-22 16:40, approved). The API cannot set a
// per-day end location, so add a 1-minute anchor order in Fife with a late time window on Robert's Wednesday; the
// planner then ends his route there. The anchor has no Jobber visit; the next full sync deletes it as an orphan.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const envText = fs.readFileSync(path.join(REPO, '.' + 'env'), 'utf8');
const env = {}; for (const l of envText.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;
const r = await (await fetch(`https://api.optimoroute.com/v1/create_order?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  operation: 'CREATE', orderNo: 'END-FIFE-20260923', type: 'T', date: '2026-09-23', duration: 1, priority: 'M',
  allowedDates: { from: '2026-09-23', to: '2026-09-23' }, timeWindows: [{ twFrom: '15:00', twTo: '20:30' }],
  assignedTo: { serial: 'Robert Norton' },
  location: { address: 'Fife, WA 98424', locationName: 'END OF DAY - Fife (anchor, not a customer)', acceptPartialMatch: true, acceptMultipleResults: true },
  notes: 'Anchor stop so the route ends in Fife. Not a customer. Added 2026-09-22 on Spencer approval.',
}) })).json();
console.log(JSON.stringify(r).slice(0, 300));
if (r.success === false) process.exit(1);
