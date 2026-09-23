#!/usr/bin/env node
// Proves the write gate does what it claims. Safe to run any time: every write it attempts is
// expected to be REFUSED before the request leaves the machine, so it cannot touch a real customer.
// If any WRITE case passes through, this exits non-zero and the gate is not containing anything.
import '../lib/write-gate.mjs';

const J = 'https://api.getjobber.com/api/graphql';
const O = 'https://api.optimoroute.com/v1';
let pass = 0, fail = 0;

async function mustRefuse(label, fn) {
  try { await fn(); console.log(`  FAIL  ${label} — went through`); fail++; }
  catch (e) {
    if (/WRITE REFUSED/.test(e.message)) { console.log(`  ok    ${label} — refused`); pass++; }
    else { console.log(`  FAIL  ${label} — threw something else: ${e.message.slice(0, 80)}`); fail++; }
  }
}

async function mustPass(label, fn) {
  try { await fn(); console.log(`  ok    ${label} — not gated`); pass++; }
  catch (e) {
    if (/WRITE REFUSED/.test(e.message)) { console.log(`  FAIL  ${label} — gate blocked a READ`); fail++; }
    else { console.log(`  ok    ${label} — not gated (network/auth error is fine: ${e.message.slice(0, 40)})`); pass++; }
  }
}

console.log('\nWRITE GATE — containment test\n');

await mustRefuse('jobber visitEditSchedule', () => fetch(J, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'mutation { visitEditSchedule(visitId:"x") { visit { id } userErrors { message } } }' }),
}));

await mustRefuse('jobber visitEditAssignedUsers', () => fetch(J, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'mutation { visitEditAssignedUsers(visitId:"x") { userErrors { message } } }' }),
}));

await mustRefuse('jobber visitDelete', () => fetch(J, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'mutation { visitDelete(visitId:"x") { userErrors { message } } }' }),
}));

// An unrecognised mutation name must still be caught — safe-by-default, not by allowlist.
await mustRefuse('jobber unknown mutation', () => fetch(J, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'mutation { somethingNobodyListed(id:"x") { id } }' }),
}));

await mustRefuse('optimoroute create_order', () => fetch(`${O}/create_order?key=FAKE`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
}));

await mustRefuse('optimoroute start_planning', () => fetch(`${O}/start_planning?key=FAKE`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
}));

await mustRefuse('optimoroute delete_order', () => fetch(`${O}/delete_order?key=FAKE`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
}));

// Reads must be untouched or the gate breaks every read-only tool on the board.
await mustPass('jobber query (not a mutation)', () => fetch(J, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ visits { nodes { id } } }' }),
}));

await mustPass('optimoroute get_routes', () => fetch(`${O}/get_routes?key=FAKE&date=2026-08-24`));
await mustPass('unrelated host', () => fetch('https://example.com'));

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
