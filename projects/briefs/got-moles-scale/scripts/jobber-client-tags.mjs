// Add/remove tags on a Jobber CLIENT. Tags live on Client, not Job.
//   node projects/briefs/got-moles-scale/scripts/jobber-client-tags.mjs \
//     --client <encodedId> [--remove "Tag A,Tag B"] [--add "Tag C"] [--dry-run]
//
// Uses clientEdit's tagsToAdd / tagsToDelete, which are targeted list operations — they do NOT
// replace the client's whole tag set, so untouched tags (Autopay, LARGE PROPERTY, ...) survive.
// Always prints the before/after tag set. Refuses to run without an explicit --client id:
// there are multiple similarly-named clients in this account (8 Larsen/Larson, 3 of them tagged
// "TMCP - Active"), so name matching is not safe enough for a write.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const env = {};
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry-run');
const clientId = argVal('--client');
const toRemove = (argVal('--remove') || '').split(',').map((s) => s.trim()).filter(Boolean);
const toAdd = (argVal('--add') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!clientId) { console.error('FATAL: --client <encodedId> is required'); process.exit(1); }
if (!toRemove.length && !toAdd.length) { console.error('FATAL: nothing to do — pass --remove and/or --add'); process.exit(1); }

let token = null;
async function accessToken() {
  if (token) return token;
  const res = await fetch('https://api.getjobber.com/api/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
  });
  const d = await res.json();
  if (!res.ok) { console.error('FATAL: Jobber token refresh failed'); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) {
    const t = readFileSync(path.join(root, '.env'), 'utf8');
    writeFileSync(path.join(root, '.env'), t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m, `JOBBER_REFRESH_TOKEN=${d.refresh_token}`));
  }
  token = d.access_token; return token;
}
async function gql(query, variables = {}) {
  const t = await accessToken();
  const h = { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  if (env.JOBBER_GRAPHQL_VERSION) h['X-JOBBER-GRAPHQL-VERSION'] = env.JOBBER_GRAPHQL_VERSION;
  const res = await fetch('https://api.getjobber.com/api/graphql', { method: 'POST', headers: h, body: JSON.stringify({ query, variables }) });
  const d = await res.json().catch(() => ({}));
  if (d.errors) { console.error('FATAL: ' + JSON.stringify(d.errors).slice(0, 400)); process.exit(1); }
  return d.data;
}
const labels = (c) => (c?.tags?.nodes || []).map((t) => t.label);

const before = await gql(`query($id:EncodedId!){ client(id:$id){ id name isArchived tags(first:30){ nodes{ label } } } }`, { id: clientId });
const c = before?.client;
if (!c) { console.error(`FATAL: no client with id ${clientId}`); process.exit(1); }
console.log(`Client:  ${c.name}  (archived=${c.isArchived})`);
console.log(`Before:  [${labels(c).join(', ') || '(none)'}]`);
console.log(`Remove:  [${toRemove.join(', ') || '-'}]    Add: [${toAdd.join(', ') || '-'}]`);

const missing = toRemove.filter((t) => !labels(c).includes(t));
if (missing.length) console.log(`Note:    not currently on this client, will no-op: [${missing.join(', ')}]`);

if (DRY) { console.log('\nDry run — nothing changed.'); process.exit(0); }

const input = {};
if (toAdd.length) input.tagsToAdd = toAdd;
if (toRemove.length) input.tagsToDelete = toRemove;
const res = await gql(`mutation($id:EncodedId!, $input:ClientEditInput!){
  clientEdit(clientId:$id, input:$input){
    client{ id name tags(first:30){ nodes{ label } } }
    userErrors{ message path } } }`, { id: clientId, input });

const ue = res?.clientEdit?.userErrors || [];
if (ue.length) { console.error('FAILED: ' + JSON.stringify(ue)); process.exit(1); }
console.log(`After:   [${labels(res.clientEdit.client).join(', ') || '(none)'}]`);
console.log('Done.');
