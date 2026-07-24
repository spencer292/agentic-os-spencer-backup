// One-off cleanup: delete the scores pushed on 2026-07-23 with Sunday-keyed
// periodStartDates (board turned out to be Monday-start). Ignores 404s.
//   node projects/briefs/got-moles-scale/scripts/ninety-delete-scores.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const env = {};
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const cfg = JSON.parse(readFileSync(path.join(here, 'ninety-kpi-map.json'), 'utf8'));

const sundayWeeks = ['2026-04-26','2026-05-03','2026-05-10','2026-05-17','2026-05-24','2026-05-31',
  '2026-06-07','2026-06-14','2026-06-21','2026-06-28','2026-07-05','2026-07-12','2026-07-19'];

const del = async (p) => {
  const res = await fetch('https://api.public.ninety.io/v1' + p, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.NINETY_API_TOKEN}` },
  });
  if (res.ok) return 'deleted';
  if (res.status === 404) return '404';
  return `ERR ${res.status}: ${(await res.text()).slice(0, 150)}`;
};

let deleted = 0, missing = 0, errors = [];
for (const [key, m] of Object.entries(cfg.metrics)) {
  if (!m.kpiId) continue;
  for (const w of sundayWeeks) {
    const r = await del(`/scorecard/kpis/${m.kpiId}/scores/${w}`);
    if (r === 'deleted') deleted++;
    else if (r === '404') missing++;
    else errors.push(`${key}@${w}: ${r}`);
    await new Promise((r2) => setTimeout(r2, 60));
  }
}
// the past-due dollar note pushed at Sunday 2026-07-19
const noteKpi = cfg.metrics.past_due_invoices.kpiId;
const nr = await del(`/scorecard/kpis/${noteKpi}/notes/2026-07-19`);
console.log(`Scores deleted: ${deleted}, not-found (never pushed): ${missing}, note delete: ${nr}`);
errors.forEach((e) => console.log('  ' + e));
if (errors.length) process.exit(1);
