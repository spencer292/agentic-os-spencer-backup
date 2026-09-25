#!/usr/bin/env node
// ROUTE ENGINE — grant, revoke and inspect write authority.
//
// The kill switch from spec v2 Part 7 Step 1. Every grant is TIME-BOXED on purpose: the failure mode
// this guards against is not someone maliciously enabling writes, it is a grant made for one run and
// never revoked, which is how route-drift-check came to be rewriting Spencer's board unattended.
// An expired grant is refused by lib/write-gate.mjs exactly like an absent one.
//
// Usage:
//   node write-authority.mjs status
//   node write-authority.mjs enable --reason "write back approved 08-24 plan" --ttl 30m [--ceiling 600]
//   node write-authority.mjs disable
//   node write-authority.mjs ledger [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'write-authority.json');
const LEDGER_DIR = path.join(ROOT, 'ledger');

const argv = process.argv.slice(2);
const cmd = argv[0] || 'status';
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };

const read = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n');

function parseTtl(t) {
  const m = String(t || '').match(/^(\d+)\s*(m|min|h|hr)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = (m[2] || 'm').toLowerCase();
  return unit.startsWith('h') ? n * 60 : n;
}

function live(s) {
  if (!s.writesEnabled) return { on: false, why: `disabled — ${s.reason || 'no reason recorded'}` };
  if (!s.enabledUntil) return { on: false, why: 'enabled with no expiry — not honoured' };
  const until = new Date(s.enabledUntil);
  if (!(until > new Date())) return { on: false, why: `EXPIRED ${s.enabledUntil}` };
  const mins = Math.round((until - new Date()) / 60000);
  return { on: true, why: `ENABLED for another ${mins} min (until ${s.enabledUntil})` };
}

if (cmd === 'status') {
  const s = read(); const l = live(s);
  console.log(`\nROUTE ENGINE — WRITE AUTHORITY\n`);
  console.log(`  state      ${l.on ? 'WRITES ENABLED' : 'WRITES BLOCKED'}`);
  console.log(`  detail     ${l.why}`);
  console.log(`  reason     ${s.reason || '—'}`);
  console.log(`  grantedBy  ${s.enabledBy || '—'}`);
  console.log(`  ceiling    ${s.ceilingPerRun} writes per run`);
  console.log(`  updated    ${s.updatedAt}`);
  const day = new Date().toISOString().slice(0, 10);
  const f = path.join(LEDGER_DIR, `${day}.jsonl`);
  if (fs.existsSync(f)) {
    const rows = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    const c = {};
    for (const r of rows) c[r.outcome] = (c[r.outcome] || 0) + 1;
    console.log(`  today      ${rows.length} gated events — ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  } else {
    console.log(`  today      no gated events`);
  }
  console.log();
} else if (cmd === 'enable') {
  const reason = flag('reason');
  const ttl = parseTtl(flag('ttl', '30m'));
  if (!reason) { console.error('--reason is required. A grant with no stated purpose is the thing this prevents.'); process.exit(1); }
  if (!ttl || ttl > 240) { console.error('--ttl must be 1..240 minutes (e.g. 30m, 2h). Open-ended grants are refused.'); process.exit(1); }
  const s = read();
  s.writesEnabled = true;
  s.enabledUntil = new Date(Date.now() + ttl * 60000).toISOString();
  s.enabledBy = `${os.userInfo().username}@${os.hostname()}`;
  s.reason = reason;
  if (flag('ceiling')) s.ceilingPerRun = Number(flag('ceiling'));
  s.updatedAt = new Date().toISOString();
  save(s);
  console.log(`\n  WRITES ENABLED for ${ttl} min (until ${s.enabledUntil})`);
  console.log(`  reason   ${reason}`);
  console.log(`  ceiling  ${s.ceilingPerRun} writes per run`);
  console.log(`  This lapses on its own. Revoke early:  node write-authority.mjs disable\n`);
} else if (cmd === 'disable') {
  const s = read();
  s.writesEnabled = false;
  s.enabledUntil = null;
  s.enabledBy = null;
  s.reason = flag('reason', 'Revoked.');
  s.updatedAt = new Date().toISOString();
  save(s);
  console.log('\n  WRITES BLOCKED.\n');
} else if (cmd === 'ledger') {
  const day = argv[1] || new Date().toISOString().slice(0, 10);
  const f = path.join(LEDGER_DIR, `${day}.jsonl`);
  if (!fs.existsSync(f)) { console.log(`no ledger for ${day}`); process.exit(0); }
  const rows = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  console.log(`\nLEDGER ${day} — ${rows.length} events\n`);
  for (const r of rows) {
    console.log(`  ${r.ts.slice(11, 19)}  ${String(r.outcome).padEnd(16)} ${String(r.target + '.' + r.op).padEnd(40)} ${r.script}  ${r.why || r.note || ''}`);
  }
  console.log();
} else {
  console.error('commands: status | enable --reason "..." --ttl 30m [--ceiling N] | disable | ledger [YYYY-MM-DD]');
  process.exit(1);
}
