#!/usr/bin/env node
// mark-contacted.mjs — record that a client was already contacted by a human, so the robot
// never double-texts them.
//
// The robot's state file only knows what the ROBOT sent. When Spencer or the office texts
// someone by hand, that has to be recorded here or the next run will text them again.
// (The sender also has an automatic guard for this — see the "activity today" check — but this
// is the explicit, durable way to say "leave this person alone for this stage".)
//
//   node projects/briefs/jobber-text-automation/scripts/mark-contacted.mjs "Deborah Larry" "Nancy Parkes"
//   node ... mark-contacted.mjs --list
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'collection-queue.json');
const STATE_FILE = path.join(DATA_DIR, 'collection-state.json');

const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { sent: {} };
const args = process.argv.slice(2);

if (args.includes('--list')) {
  const keys = Object.entries(state.sent);
  if (!keys.length) console.log('\n  nothing recorded yet\n');
  else { console.log(`\n  ${keys.length} recorded:`); keys.forEach(([k, v]) => console.log(`   ${v}  ${k}`)); console.log(); }
  process.exit(0);
}
if (!args.length) { console.error('Usage: mark-contacted.mjs "Client Name" [...]   |   --list'); process.exit(1); }
if (!fs.existsSync(QUEUE_FILE)) { console.error('No queue — run build-collection-queue.mjs first.'); process.exit(1); }

const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
const pool = [...queue.send, ...queue.rolled];
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

let marked = 0;
for (const name of args) {
  const tokens = norm(name).split(' ').filter(t => t.length > 1);
  const hits = pool.filter(r => tokens.every(t => norm(r.name).includes(t)));
  if (!hits.length) { console.log(`  ?  no queued client matches "${name}"`); continue; }
  if (hits.length > 1) { console.log(`  !  "${name}" matches ${hits.length}: ${hits.map(h => h.name).join(', ')} — be more specific`); continue; }
  const r = hits[0];
  if (state.sent[r.stateKey]) { console.log(`  =  ${r.name} already recorded (${state.sent[r.stateKey]})`); continue; }
  state.sent[r.stateKey] = new Date().toISOString();
  console.log(`  ✓  ${r.name} — ${r.stage}, $${r.total} — will not be texted by the robot`);
  marked++;
}

fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
console.log(`\n  ${marked} marked. Rebuild the queue to see the updated send list.\n`);
