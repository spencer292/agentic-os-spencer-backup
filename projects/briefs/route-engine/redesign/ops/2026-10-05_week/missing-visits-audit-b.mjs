#!/usr/bin/env node
// READ-ONLY follow-up: recent visits for #5511, and every job on the clients of the archived jobs.
import '../../../lib/write-gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../../../.env');
const TZ = 'America/Los_Angeles';
const env = {}; for (const l of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }) })).json();
if (tr.refresh_token && tr.refresh_token !== env.JOBBER_REFRESH_TOKEN) { const t = fs.readFileSync(ENV_PATH, 'utf8'); fs.writeFileSync(ENV_PATH, t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, 'JOBBER_REFRESH_TOKEN=' + tr.refresh_token)); }
const gql = async (query, variables) => (await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + tr.access_token, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' }, body: JSON.stringify({ query, variables }) })).json();
const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

for (const no of ['5511', '8426', '8480', '8515', '8276']) {
  await sleep(3000);
  const d = await gql(`query($n:String!){ jobs(first:5, searchTerm:$n){ nodes{ jobNumber id
    visits(first:15, filter:{ startAt:{ after:"2026-08-15T00:00:00-07:00", before:"2027-01-31T00:00:00-08:00" } }){ nodes{ startAt isComplete assignedUsers(first:2){ nodes{ name{ full } } } } }
    client{ id name jobs(first:20){ nodes{ jobNumber jobStatus jobType title lineItems(first:4){ nodes{ name } }
      visits(first:6, filter:{ startAt:{ after:"2026-10-01T00:00:00-07:00", before:"2027-01-31T00:00:00-08:00" } }){ nodes{ startAt isComplete assignedUsers(first:2){ nodes{ name{ full } } } } } } } } } } }`, { n: no });
  if (d.errors) { console.log(no, JSON.stringify(d.errors).slice(0, 200)); continue; }
  const j = d.data.jobs.nodes.find(x => String(x.jobNumber) === no);
  console.log(`\n#${no} ${j.client.name}  jobId ${j.id}`);
  console.log('  this job since 08-15: ' + j.visits.nodes.map(v => `${pt(v.startAt)}${v.isComplete ? '✓' : ''} ${v.assignedUsers.nodes.map(u => u.name.full.split(' ')[0]).join('+')}`).join('; '));
  for (const o of j.client.jobs.nodes) if (String(o.jobNumber) !== no) console.log(`  other job #${o.jobNumber} ${o.jobStatus}/${o.jobType} [${o.lineItems.nodes.map(x => x.name).join(' | ')}]  from 10-01: ${o.visits.nodes.map(v => `${pt(v.startAt)}${v.isComplete ? '✓' : ''} ${v.assignedUsers.nodes.map(u => u.name.full.split(' ')[0]).join('+')}`).join('; ') || 'none'}`);
}
