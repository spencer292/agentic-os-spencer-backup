#!/usr/bin/env node
// READ-ONLY. Spencer's 10-04 list of 11 jobs "missing visits". For each: product (line item),
// last completed visit, every open future visit, and the weekday/tech history to place an add on.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../../../.env');
const TZ = 'America/Los_Angeles';
const LIST = [
  ['8276', 'luke', '2026-10-02', 'na', 0], ['7875', 'luke', '2026-10-01', 'na', 0], ['8200', 'robert', '2026-10-01', 'la', 1],
  ['8503', 'luke', '2026-09-30', 'na', 0], ['8255', 'alias', '2026-09-30', 'na', 0], ['8515', 'robert', '2026-09-30', 'la', 0],
  ['5511', 'cory', '2026-09-30', 'ha', 0], ['8426', 'tavis', '2026-09-28', 'la', 0], ['8136', 'luke', '2026-09-28', 'na', 0],
  ['8480', 'robert', '2026-09-28', 'la', 0], ['8500', 'luke', '2026-09-28', 'na', 0],
];
const env = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) })).json();
if (!tr.access_token) { console.error('token refresh failed'); process.exit(1); }
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) { let t = fs.readFileSync(ENV_PATH, 'utf8'); fs.writeFileSync(ENV_PATH, t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token)); }
const gql = async (query, variables) => (await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + tr.access_token, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) })).json();
const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ });
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dow = d => DOW[new Date(d + 'T12:00:00').getDay()];
const out = [];
const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
for (const [no, tech, last, act, caught] of LIST.filter(r => !ONLY.length || ONLY.includes(r[0]))) {
  await new Promise(r => setTimeout(r, 4000));
  const d = await gql(`query($n:String!){ jobs(first:5, searchTerm:$n){ nodes{ id jobNumber jobStatus jobType title client{ name }
    property{ address{ street1 city postalCode } } lineItems(first:10){ nodes{ name } }
    visits(first:40){ nodes{ id title startAt isComplete completedAt assignedUsers(first:3){ nodes{ id name{ full } } } } } } } }`, { n: no });
  if (d.errors) { console.log(no, JSON.stringify(d.errors).slice(0, 300)); continue; }
  const j = (d.data.jobs.nodes || []).find(x => String(x.jobNumber) === no);
  if (!j) { console.log(`#${no} NOT FOUND`); continue; }
  const items = j.lineItems.nodes.map(x => x.name).join(' | ');
  const product = /total mole control/i.test(items) ? 'TMCP' : /quick fix/i.test(items) ? 'QuickFix' : 'OTHER';
  const vs = j.visits.nodes.map(v => ({ id: v.id, date: pt(v.startAt).slice(0, 10), time: pt(v.startAt).slice(11, 16), done: v.isComplete, tech: v.assignedUsers.nodes.map(u => u.name.full).join('+'), techId: v.assignedUsers.nodes[0]?.id, title: v.title })).sort((a, b) => a.date.localeCompare(b.date));
  const doneV = vs.filter(v => v.done), open = vs.filter(v => !v.done);
  const future = open.filter(v => v.date >= '2026-10-05'), stale = open.filter(v => v.date < '2026-10-05');
  out.push({ no, id: j.jobId || j.id, client: j.client.name, status: j.jobStatus, jobType: j.jobType, product, items, addr: `${j.property?.address?.street1}, ${j.property?.address?.city} ${j.property?.address?.postalCode}`, listed: { tech, last, act, caught }, completed: doneV.length, total: vs.length, recentDone: doneV.slice(-6).map(v => `${v.date} ${dow(v.date)} ${v.tech}`), future: future.slice(0, 3).map(v => `${v.date} ${dow(v.date)} ${v.tech}`), staleOpen: stale.map(v => `${v.date} ${v.tech}`) });
  const o = out[out.length - 1];
  console.log(`\n#${no} ${o.client} — ${o.status}/${o.jobType} — ${product} [${items}]\n   ${o.addr}\n   listed: ${tech} last ${last} ${act} caught ${caught}\n   visits ${o.completed} done / ${o.total} total\n   recent done: ${o.recentDone.join('; ')}\n   open future: ${o.future.join('; ') || 'NONE'}\n   open past (not completed): ${o.staleOpen.join('; ') || '-'}`);
}
fs.writeFileSync(path.join(__dirname, ONLY.length ? 'missing-visits-audit-2.json' : 'missing-visits-audit.json'), JSON.stringify(out, null, 1));
