#!/usr/bin/env node
// route-inbound-text.mjs — given an inbound SMS phone number, work out WHO at Got Moles owns it.
//
// This is the routing brain for the inbound-text problem. It is deliberately platform-agnostic:
// it takes a phone number and returns a routing decision. Whatever messaging platform we land on
// (Quo/OpenPhone, JustCall, Twilio) calls this on its inbound-message webhook and then does the
// assign/notify in its own API.
//
// Jobber itself can NEVER call this — Jobber has no inbound-message webhook and its API cannot
// read texts (verified 2026-08-05: `MessageInterfaceEdge` exposes no `node` field). That is the
// whole reason a messaging layer in front of Jobber is required.
//
// Usage:
//   node route-inbound-text.mjs "(253) 988-7254"
//   node route-inbound-text.mjs 2539887254 --json
//
// Exit codes: 0 = routed, 3 = no match (route to sales/office queue), 1 = error.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const JOBBER = path.join(REPO, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');

// How far back a completed visit still counts as "this tech owns the relationship".
const OWNERSHIP_WINDOW_DAYS = 120;

// Jobber runs two limiters: a request-rate guard and a leaky-bucket QUERY COST budget. Deep
// client->jobs->visits fan-out is expensive enough to trip the cost bucket on its own, so retry
// THROTTLED with backoff rather than pulling smaller pages and missing visits.
function gql(query, attempt = 0) {
  try {
    const out = execFileSync(process.execPath, [JOBBER, 'query', query], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch (err) {
    const msg = String(err.stderr || err.message || '');
    if (msg.includes('THROTTLED') && attempt < 4) {
      const waitMs = 2000 * Math.pow(2, attempt);
      execFileSync(process.execPath, ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${waitMs})`]);
      return gql(query, attempt + 1);
    }
    throw err;
  }
}

// Jobber stores numbers unformatted (e.g. "2539887254"). Normalize to the last 10 digits so
// +1, dashes, parens and spaces all resolve to the same search term.
function normalize(raw) {
  const digits = String(raw).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function daysBetween(a, b) {
  return Math.round((a - b) / 86400000);
}

function findClients(phone) {
  const d = gql(`{ clients(first:10, searchTerm:${JSON.stringify(phone)}) {
    nodes { id name isLead isArchived jobberWebUri
            phones { number normalizedPhoneNumber smsAllowed } } } }`);
  // searchTerm is broad — keep only clients that genuinely carry this number.
  return (d.clients?.nodes || []).filter((c) =>
    (c.phones || []).some((p) => normalize(p.normalizedPhoneNumber || p.number) === phone)
  );
}

function visitsForClient(clientId) {
  const d = gql(`{ client(id:${JSON.stringify(clientId)}) {
    jobs(first:8) { nodes { id jobNumber jobStatus
      visits(first:20) { nodes { id startAt isComplete completedAt
        assignedUsers(first:5) { nodes { id name { full } } } } } } } } }`);
  const visits = [];
  for (const job of d.client?.jobs?.nodes || []) {
    for (const v of job.visits?.nodes || []) {
      visits.push({ ...v, jobNumber: job.jobNumber, jobStatus: job.jobStatus });
    }
  }
  return visits;
}

// Ownership rule, in priority order:
//   1. The tech on the NEXT scheduled visit — they are about to walk the property.
//   2. The tech on the MOST RECENT completed visit, if inside the ownership window —
//      the customer is almost certainly replying about work that tech just did.
//   3. Nobody → office/sales queue.
function decideOwner(visits, now) {
  const withTech = visits.filter((v) => v.assignedUsers?.nodes?.length);

  const upcoming = withTech
    .filter((v) => !v.isComplete && v.startAt && new Date(v.startAt) >= now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const past = withTech
    .filter((v) => v.isComplete && v.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  if (upcoming.length) {
    const v = upcoming[0];
    return {
      tech: v.assignedUsers.nodes[0].name.full,
      techId: v.assignedUsers.nodes[0].id,
      basis: 'next-scheduled-visit',
      confidence: 'high',
      visit: { id: v.id, jobNumber: v.jobNumber, startAt: v.startAt, inDays: daysBetween(new Date(v.startAt), now) },
    };
  }

  if (past.length) {
    const v = past[0];
    const age = daysBetween(now, new Date(v.completedAt));
    if (age <= OWNERSHIP_WINDOW_DAYS) {
      return {
        tech: v.assignedUsers.nodes[0].name.full,
        techId: v.assignedUsers.nodes[0].id,
        basis: 'last-completed-visit',
        confidence: age <= 21 ? 'high' : 'medium',
        visit: { id: v.id, jobNumber: v.jobNumber, completedAt: v.completedAt, daysAgo: age },
      };
    }
  }

  return { tech: null, basis: 'no-recent-visit', confidence: 'none', visit: null };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const raw = args.find((a) => !a.startsWith('--'));
  if (!raw) {
    console.error('Usage: route-inbound-text.mjs <phone> [--json]');
    process.exit(1);
  }

  const phone = normalize(raw);
  if (phone.length !== 10) {
    console.error(`Could not normalize "${raw}" to a 10-digit US number (got "${phone}").`);
    process.exit(1);
  }

  const now = new Date();
  const clients = findClients(phone);

  // No client on this number → a lead or a wrong number. Office/sales owns it.
  if (!clients.length) {
    const result = { phone, match: 'none', route: 'office-sales-queue',
                     reason: 'No Jobber client carries this number — treat as new lead.' };
    output(result, asJson);
    process.exit(3);
  }

  // Multiple clients share the number (spouses, property managers). Route on the first that has
  // a live owner, but flag it — a human should confirm which client is texting.
  const candidates = clients.map((c) => ({ client: c, owner: decideOwner(visitsForClient(c.id), now) }));
  const best = candidates.find((c) => c.owner.tech) || candidates[0];

  const result = {
    phone,
    match: clients.length > 1 ? 'ambiguous-multiple-clients' : 'single',
    client: {
      id: best.client.id,
      name: best.client.name,
      isLead: best.client.isLead,
      isArchived: best.client.isArchived,
      url: best.client.jobberWebUri,
      smsBlocked: (best.client.phones || []).some(
        (p) => normalize(p.normalizedPhoneNumber || p.number) === phone && p.smsAllowed === false
      ),
    },
    ...(clients.length > 1 && { otherClientsOnNumber: clients.filter((c) => c.id !== best.client.id).map((c) => c.name) }),
    owner: best.owner,
    route: best.owner.tech ? 'assign-to-tech' : 'office-sales-queue',
  };

  output(result, asJson);
}

function output(r, asJson) {
  if (asJson) return console.log(JSON.stringify(r, null, 2));
  console.log(`\nInbound text from ${r.phone}`);
  if (r.match === 'none') {
    console.log(`  No matching client → ${r.route}`);
    console.log(`  ${r.reason}\n`);
    return;
  }
  console.log(`  Client:  ${r.client.name}${r.client.isLead ? ' (LEAD)' : ''}${r.client.isArchived ? ' (ARCHIVED)' : ''}`);
  if (r.client.smsBlocked) console.log(`  ⚠ SMS not allowed on this number in Jobber — reply by phone.`);
  if (r.otherClientsOnNumber) console.log(`  ⚠ Number shared with: ${r.otherClientsOnNumber.join(', ')} — confirm who is texting.`);
  if (r.owner.tech) {
    console.log(`  Owner:   ${r.owner.tech}  (${r.owner.basis}, confidence: ${r.owner.confidence})`);
    const v = r.owner.visit;
    if (v?.inDays !== undefined) console.log(`  Visit:   job #${v.jobNumber} in ${v.inDays} day(s)`);
    if (v?.daysAgo !== undefined) console.log(`  Visit:   job #${v.jobNumber}, completed ${v.daysAgo} day(s) ago`);
  } else {
    console.log(`  Owner:   none (${r.owner.basis})`);
  }
  console.log(`  Route →  ${r.route}\n`);
}

main();
