// job id -> client id for the history job set, so a closed job whose client got a new job
// (renewal, Quick Fix -> TMCP) is not counted as traps left behind. Read-only.
import fs from 'node:fs';
import { gql, sleep } from '../catch-tally/jb.mjs';
const jobs = JSON.parse(fs.readFileSync('hist-jobs.json', 'utf8'));
const out = fs.existsSync('hist-clients.json') ? JSON.parse(fs.readFileSync('hist-clients.json', 'utf8')) : {};
const todo = jobs.filter(j => !out[j.id]);
for (let i = 0; i < todo.length; i += 50) {
  const chunk = todo.slice(i, i + 50);
  const d = await gql(`query { ${chunk.map((j, k) => `j${k}: job(id: ${JSON.stringify(j.id)}) { client { id } }`).join(' ')} }`);
  chunk.forEach((j, k) => { out[j.id] = d[`j${k}`]?.client?.id || null; });
  fs.writeFileSync('hist-clients.json', JSON.stringify(out));
  process.stderr.write(`clients ${Object.keys(out).length}/${jobs.length}\n`);
  await sleep(100);
}
