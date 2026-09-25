#!/usr/bin/env node
// Proves no script that can write is missing the write gate.
//
// This is the half that makes transport gating trustworthy. The gate itself is only as good as its
// coverage, and coverage decays the moment somebody adds a script — which, on this board, happens
// most sessions (117 scripts and counting). So coverage is asserted, not assumed.
//
// A script NEEDS the gate if it contains a Jobber mutation name or hits an OptimoRoute endpoint that
// is not a get_/search_ read. Detection is deliberately the same rule the gate uses.
//
// Usage:  node check-write-gate.mjs [--fix]
//   --fix inserts the import at the top of every offender (before its first import, so the patch is
//         installed before any fetch can run) and re-checks.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');           // repo root
const SCAN = [
  'projects/briefs/technician-route-automation',
  'projects/briefs/route-engine/scripts',
  'projects/tool-jobber/scripts',
];
const GATE_RE = /route-engine\/lib\/write-gate\.mjs/;
const JOBBER_MUTATIONS = /\b(visitEditSchedule|visitEditAssignedUsers|visitCreate|visitDelete|visitEdit|jobEdit|jobCreate|propertyEdit|clientEdit|clientCreate|quoteEdit|quoteCreate|invoiceCreate|noteCreate|customFieldEdit)\b/;

// Detecting OptimoRoute writes by URL SHAPE under-detects, and under-detection is the one failure
// this checker cannot have. push-week.mjs builds `https://api.optimoroute.com/v1/${endpoint}` from a
// variable and passes 'create_order' at the call site 250 lines away, so a path regex saw nothing
// and the file went ungated with two live write call-sites. The gate would classify it correctly at
// runtime — but an ungated script never imports the gate, so its fetch is never patched.
//
// So: a file that talks to OptimoRoute at all AND names any write endpoint anywhere in its source is
// a writer, however the URL is assembled.
const OPTIMO_HOST = /api\.optimoroute\.com/;
const OPTIMO_WRITE_ENDPOINT = /\b(create_order|create_or_update_orders|delete_order|delete_all_orders|start_planning|stop_planning|update_drivers_parameters|update_order|set_order|create_driver|delete_driver)\b/;
const OPTIMO_WRITE_URL = /api\.optimoroute\.com\/v1\/(?!get_|search_)[a-z_0-9]+/;
// A Jobber GraphQL caller that contains the word `mutation` is a writer even if the operation name
// is one this list has never heard of.
const JOBBER_ANY_MUTATION = /api\.getjobber\.com\/api\/graphql/;

const FIX = process.argv.includes('--fix');
const needs = [], covered = [], fixed = [];

for (const dir of SCAN) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs).filter(x => x.endsWith('.mjs'))) {
    const p = path.join(abs, f);
    const src = fs.readFileSync(p, 'utf8');
    // The gate and its own tooling are exempt — they define the mechanism.
    if (p.includes('route-engine') && /write-gate|write-authority|check-write-gate/.test(f)) continue;
    const writes =
      JOBBER_MUTATIONS.test(src) ||
      (JOBBER_ANY_MUTATION.test(src) && /\bmutation\b/.test(src)) ||
      OPTIMO_WRITE_URL.test(src) ||
      (OPTIMO_HOST.test(src) && OPTIMO_WRITE_ENDPOINT.test(src));
    if (!writes) continue;
    if (GATE_RE.test(src)) { covered.push(path.join(dir, f)); continue; }
    needs.push({ rel: path.join(dir, f), p, src, dir });
  }
}

if (FIX) {
  for (const n of needs) {
    // Relative path from the script's folder back to the gate.
    const rel = path.relative(path.dirname(n.p), path.join(ROOT, 'projects/briefs/route-engine/lib/write-gate.mjs')).replace(/\\/g, '/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    const line = `import '${spec}';  // route-engine write gate — MUST be the first import (spec v2 Part 7 Step 1)\n`;
    const lines = n.src.split('\n');
    // Insert before the first import so the fetch patch is installed before any module body runs.
    let at = lines.findIndex(l => /^\s*import\s/.test(l));
    if (at < 0) {
      // No imports: go after the shebang and its leading comment block.
      at = 0;
      if (lines[0]?.startsWith('#!')) at = 1;
      while (lines[at]?.startsWith('//')) at++;
    }
    lines.splice(at, 0, line.trimEnd());
    fs.writeFileSync(n.p, lines.join('\n'));
    fixed.push(n.rel);
  }
}

const stillMissing = FIX ? [] : needs.map(n => n.rel);

console.log(`\nWRITE GATE COVERAGE\n`);
console.log(`  scripts that can write : ${covered.length + needs.length}`);
console.log(`  gated                  : ${covered.length + fixed.length}`);
if (fixed.length) {
  console.log(`  newly gated            : ${fixed.length}`);
  for (const f of fixed) console.log(`      + ${f}`);
}
if (stillMissing.length) {
  console.log(`\n  UNGATED — these can write with nothing standing in the way:\n`);
  for (const f of stillMissing) console.log(`      ! ${f}`);
  console.log(`\n  Fix:  node ${path.relative(ROOT, fileURLToPath(import.meta.url)).replace(/\\/g, '/')} --fix\n`);
  process.exit(1);
}
console.log(`\n  All writing scripts are gated.\n`);
