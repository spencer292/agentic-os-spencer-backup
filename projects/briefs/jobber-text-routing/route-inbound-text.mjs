#!/usr/bin/env node
// route-inbound-text.mjs — CLI form of the ownership lookup.
//
// Same brain as the desk tool (see lib-resolve.mjs), for terminal use and for scripting.
// Kept deliberately platform-agnostic: it takes a phone number or client name and returns a
// routing decision, so if conversational texting ever moves to a platform that emits an
// inbound-message webhook, this is the function that webhook calls.
//
// Jobber itself can never call it — Jobber has no inbound-message webhook and its API cannot
// read texts (verified 2026-08-05: `MessageInterfaceEdge` exposes no `node` field).
//
// Usage:
//   node route-inbound-text.mjs "(253) 988-7254"
//   node route-inbound-text.mjs "Dave Sinner" --json
//
// Exit codes: 0 = routed to a tech, 3 = desk answers it, 1 = error.

import { resolve, handoffMessage } from './lib-resolve.mjs';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const query = args.find((a) => !a.startsWith('--'));

if (!query) {
  console.error('Usage: route-inbound-text.mjs <phone or client name> [--json]');
  process.exit(1);
}

let r;
try {
  r = resolve(query);
} catch (err) {
  console.error(String(err.message || err));
  process.exit(1);
}

r.handoff = handoffMessage(r);

if (asJson) {
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.owner?.tech ? 0 : 3);
}

console.log(`\nLookup: ${r.query}`);

if (r.match === 'none') {
  console.log(`  No match → desk answers`);
  console.log(`  ${r.reason}\n`);
  process.exit(3);
}

console.log(`  Client:  ${r.client.name}`
  + `${r.client.isLead ? ' (LEAD)' : ''}${r.client.isArchived ? ' (ARCHIVED)' : ''}`);

if (r.client.smsBlocked) console.log(`  !  Texting disabled for this number in Jobber — reply by phone.`);
if (r.others?.length) console.log(`  !  Number shared with: ${r.others.join(', ')} — confirm who is texting.`);

if (r.owner.tech) {
  const o = r.owner;
  console.log(`  Owner:   ${o.tech}  (${o.basis}, ${o.confidence} confidence)`);
  if (o.product) console.log(`  Program: ${o.product}`);
  if (o.jobNumber) {
    const timing = o.inDays !== undefined
      ? `visit in ${o.inDays} day(s)`
      : `visit completed ${o.daysAgo} day(s) ago`;
    console.log(`  Job:     #${o.jobNumber} — ${timing}`);
  }
  if (r.contact?.phone || r.contact?.email) {
    console.log(`  Reach:   ${[r.contact.phone, r.contact.email].filter(Boolean).join(' · ')}`);
  }
} else {
  console.log(`  Owner:   none (${r.owner.basis})`);
}

console.log(`  Route →  ${r.route}\n`);
process.exit(r.owner.tech ? 0 : 3);
