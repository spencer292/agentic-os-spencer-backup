#!/usr/bin/env node
// The customers who were emailed a MONDAY 2026-08-03 arrival window and then had their visit moved
// to another day by the full-week write. Cause: `optimize-week write --date=2026-08-03` only wrote
// the visits arriving INTO Monday; the 53 leaving it stayed put until the full write ran hours
// later. Their schedule is now correct, their expectation is not.
//
// Outputs name, email, phone and the new day so the office can contact them.
// Usage: node stranded-monday-contacts.mjs > stranded-monday.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV = path.resolve(__dirname, '../../../.env');
const env = {};
for (const l of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }

const tr = await (await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
})).json();
const tok = tr.access_token;
const gql = async (query, variables) => (await fetch('https://api.getjobber.com/api/graphql', {
  method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
  body: JSON.stringify({ query, variables }),
})).json();

// which visits were stranded: on Monday before the write, planned for another day
const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'mon-live.json'), 'utf8')).filter(v => !v.isComplete);
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'optimize-plan.json'), 'utf8'));
const newDate = {};
for (const w of plan.writes) newDate[w.visitId] = { date: w.date, driver: w.driver };
const stranded = before.filter(v => newDate[v.id] && newDate[v.id].date !== '2026-08-03');

// pull client contact details for the whole week, then match
const q = `query($after: String) { visits(first: 25, after: $after, filter: { startAt: { after: "2026-08-02T00:00:00Z", before: "2026-08-09T00:00:00Z" } }) {
  nodes { id title job { jobNumber client { name emails { address } phones { number } } } property { address { street city postalCode } } }
  pageInfo { hasNextPage endCursor } } }`;
const contact = {};
let after = null;
do {
  const d = await gql(q, { after });
  const c = d?.data?.visits;
  if (!c) { console.error(JSON.stringify(d).slice(0, 300)); break; }
  for (const n of c.nodes) contact[n.id] = {
    client: n.job?.client?.name || n.title,
    email: (n.job?.client?.emails || [])[0]?.address || null,
    phone: (n.job?.client?.phones || [])[0]?.number || null,
    street: n.property?.address?.street, city: n.property?.address?.city,
    job: n.job?.jobNumber,
  };
  after = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
} while (after);

const DOW = { '2026-08-04': 'Tuesday, August 4', '2026-08-05': 'Wednesday, August 5',
              '2026-08-06': 'Thursday, August 6', '2026-08-07': 'Friday, August 7' };
const out = stranded.map(v => ({
  visit: v.id, ...(contact[v.id] || {}),
  newDate: newDate[v.id].date, newDay: DOW[newDate[v.id].date] || newDate[v.id].date,
  tech: newDate[v.id].driver,
})).filter(r => r.client);
out.sort((a, b) => (a.newDate || '').localeCompare(b.newDate || '') || String(a.client).localeCompare(String(b.client)));
console.log(JSON.stringify(out, null, 1));
console.error(`stranded: ${stranded.length}  with contact rows: ${out.length}  with email: ${out.filter(r => r.email).length}  no email: ${out.filter(r => !r.email).length}`);
