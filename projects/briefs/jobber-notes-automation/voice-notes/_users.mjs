// _users.mjs — read-only. Lists Jobber users so techs can be mapped to login codes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../../.env');
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const tr = await fetch('https://api.getjobber.com/api/oauth/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.JOBBER_CLIENT_ID, client_secret: env.JOBBER_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: env.JOBBER_REFRESH_TOKEN }),
});
const token = (await tr.json()).access_token;
const r = await fetch('https://api.getjobber.com/api/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': '2025-04-16' },
  body: JSON.stringify({ query: `{ users(first: 50) { nodes { id name { full } email { raw } status } } }` }),
});
const d = await r.json();
if (d.errors) console.log('ERRORS:', JSON.stringify(d.errors).slice(0, 400));
for (const u of (d.data?.users?.nodes || [])) {
  console.log(`${u.status || ''}\t${u.name?.full}\t${u.id}`);
}
