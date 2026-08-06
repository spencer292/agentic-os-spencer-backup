// lib-resolve.mjs — shared ownership resolution for the text desk.
//
// One job: given a phone number or a client name, work out WHO at Got Moles owns that customer
// and hand back enough context for the desk to answer or hand off.
//
// Jobber cannot tell us a text arrived (no inbound-message webhook, and the API cannot read
// messages — verified 2026-08-05). So this is driven by a human reading the Jobber message
// center. Everything downstream of "the desk sees a message" is what we can automate.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../../..');
const JOBBER = path.join(REPO, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const CONTACTS = path.join(HERE, 'tech-contacts.json');

// A completed visit older than this no longer implies ownership.
const OWNERSHIP_WINDOW_DAYS = 120;
// Lookups are cached so the desk can re-check a customer without re-hitting the API.
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map();

function sleep(ms) {
  execFileSync(process.execPath, ['-e',
    `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${ms})`]);
}

// Jobber runs a leaky-bucket QUERY COST budget alongside its request-rate guard. The
// client->jobs->visits fan-out is expensive enough to trip it alone, so back off and retry
// rather than pulling smaller pages and silently missing visits.
export function gql(query, attempt = 0) {
  try {
    const out = execFileSync(process.execPath, [JOBBER, 'query', query], {
      cwd: REPO, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
      // Capture stderr rather than letting execFileSync pass it through to our own stderr —
      // otherwise the THROTTLED text never reaches err.stderr and the retry below can't see it.
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch (err) {
    const msg = String(err.stderr || '') + String(err.stdout || '') + String(err.message || '');
    if (msg.includes('THROTTLED') && attempt < 4) {
      sleep(2000 * Math.pow(2, attempt));
      return gql(query, attempt + 1);
    }
    throw new Error(msg.slice(0, 500) || 'Jobber query failed');
  }
}

export function normalize(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function looksLikePhone(q) {
  return normalize(q).length === 10;
}

function daysBetween(a, b) {
  return Math.round((a - b) / 86400000);
}

// Local fallback file. Used only to fill gaps in what Jobber returns.
function localContacts() {
  try {
    const c = JSON.parse(fs.readFileSync(CONTACTS, 'utf8'));
    delete c._comment;
    return c;
  } catch {
    return {};
  }
}

// Tech contact numbers live in a Jobber TEAM CUSTOM FIELD, deliberately NOT in the user profile
// phone field.
//
// Why: Jobber's On My Way text offers a callback number, and setting a tech's profile phone makes
// their personal number selectable there. Customers then text that personal line directly, the
// business never sees the conversation, and it walks when the tech leaves. Jobber documents this
// exact workaround: "a team custom field can be set up as a way to record their number which will
// not add it as a callback option for on my way texts."
//
// So: profile phone stays blank, the number lives in a custom field, and the On My Way callback
// stays pointed at the office number.
const CONTACT_FIELD = /cell|phone|mobile|contact/i;
let dirCache = null;

export function techDirectory({ useCache = true } = {}) {
  if (useCache && dirCache && Date.now() - dirCache.at < 10 * 60 * 1000) return dirCache.value;

  const local = localContacts();
  const dir = {};

  try {
    const d = gql(`{ users(first:50, filter:{status:ACTIVATED}) { nodes {
      name { full } email { raw }
      customFields { __typename ... on CustomFieldText { label valueText } } } } }`);

    for (const u of d.users?.nodes || []) {
      const name = (u.name?.full || '').trim();
      if (!name) continue;
      const field = (u.customFields || [])
        .find((f) => f.__typename === 'CustomFieldText'
                  && CONTACT_FIELD.test(f.label || '')
                  && (f.valueText || '').trim());
      dir[name] = {
        phone: field ? field.valueText.trim() : '',
        email: u.email?.raw || '',
        source: field ? `Jobber (${field.label})` : '',
      };
    }
  } catch {
    // Jobber unreachable — fall back entirely to the local file rather than failing the lookup.
  }

  // Local file fills anything Jobber didn't supply. Jobber wins where both have a value, so the
  // team roster stays the single source of truth once the custom field is populated.
  for (const [name, c] of Object.entries(local)) {
    const cur = dir[name] || (dir[name] = { phone: '', email: '', source: '' });
    if (!cur.phone && c.phone) { cur.phone = c.phone; cur.source = 'tech-contacts.json'; }
    if (!cur.email && c.email) cur.email = c.email;
  }

  dirCache = { at: Date.now(), value: dir };
  return dir;
}

// Back-compat name used by desk-server's /api/techs.
export const techContacts = techDirectory;

export function searchClients(q) {
  const phone = normalize(q);
  const term = looksLikePhone(q) ? phone : String(q).trim();
  const d = gql(`{ clients(first:10, searchTerm:${JSON.stringify(term)}) {
    nodes { id name isLead isArchived jobberWebUri
            phones { number normalizedPhoneNumber smsAllowed } } } }`);
  const all = d.clients?.nodes || [];
  // A phone search must match a real number on the record; a name search trusts Jobber's ranking.
  if (!looksLikePhone(q)) return all;
  return all.filter((c) => (c.phones || [])
    .some((p) => normalize(p.normalizedPhoneNumber || p.number) === phone));
}

// Deliberately narrow. Two facts per job — the next visit and the last completed one — rather
// than paging visit history. Two reasons:
//   1. Cost. The client->jobs->visits fan-out trips Jobber's query-cost limiter on its own.
//   2. Correctness. This account has visits scheduled out to 2036 (a known scheduling defect),
//      so "first N visits" in either sort direction can silently miss the ones near today.
//      A date window pins the query to the period that actually implies ownership.
export function visitsForClient(clientId, now = new Date()) {
  const iso = (d) => new Date(d).toISOString();
  const past = iso(now.getTime() - (OWNERSHIP_WINDOW_DAYS + 30) * 86400000);
  const soon = iso(now.getTime() + 90 * 86400000);
  const nowIso = iso(now);

  const d = gql(`{ client(id:${JSON.stringify(clientId)}) {
    jobs(first:6) { nodes { jobNumber jobStatus jobberWebUri
      lineItems(first:3) { nodes { name } }
      property { address { street city postalCode } }
      upcoming: visits(first:1, filter:{startAt:{after:"${nowIso}", before:"${soon}"}},
                       sort:{key:START_AT, direction:ASCENDING}) {
        nodes { id startAt isComplete completedAt
                assignedUsers(first:2) { nodes { name { full } } } } }
      recent: visits(first:1, filter:{status:COMPLETED, completedAt:{after:"${past}"}},
                     sort:{key:START_AT, direction:DESCENDING}) {
        nodes { id startAt isComplete completedAt
                assignedUsers(first:2) { nodes { name { full } } } } } } } } }`);

  const visits = [];
  for (const job of d.client?.jobs?.nodes || []) {
    const meta = {
      jobNumber: job.jobNumber,
      jobStatus: job.jobStatus,
      jobUrl: job.jobberWebUri,
      product: (job.lineItems?.nodes || []).map((l) => l.name).join(' | '),
      address: job.property?.address,
    };
    for (const v of job.upcoming?.nodes || []) visits.push({ ...v, ...meta });
    for (const v of job.recent?.nodes || []) visits.push({ ...v, ...meta, isComplete: true });
  }
  return visits;
}

// Ownership, in priority order:
//   1. The tech on the NEXT scheduled visit — they are about to walk the property.
//   2. The tech on the MOST RECENT completed visit, inside the ownership window — the customer
//      is almost certainly replying about work that tech just did.
//   3. Nobody → the desk answers it.
export function decideOwner(visits, now = new Date()) {
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
      basis: 'next scheduled visit',
      confidence: 'high',
      jobNumber: v.jobNumber, jobUrl: v.jobUrl, product: v.product, address: v.address,
      when: v.startAt, inDays: daysBetween(new Date(v.startAt), now),
    };
  }

  if (past.length) {
    const v = past[0];
    const age = daysBetween(now, new Date(v.completedAt));
    if (age <= OWNERSHIP_WINDOW_DAYS) {
      return {
        tech: v.assignedUsers.nodes[0].name.full,
        basis: 'last completed visit',
        confidence: age <= 21 ? 'high' : 'medium',
        jobNumber: v.jobNumber, jobUrl: v.jobUrl, product: v.product, address: v.address,
        when: v.completedAt, daysAgo: age,
      };
    }
  }

  return { tech: null, basis: 'no visit in the last 120 days', confidence: 'none' };
}

export function resolve(query, { useCache = true } = {}) {
  const key = String(query).trim().toLowerCase();
  if (useCache) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { ...hit.value, cached: true };
  }

  const now = new Date();
  const clients = searchClients(query);

  let value;
  if (!clients.length) {
    value = {
      query, match: 'none', route: 'desk answers',
      reason: looksLikePhone(query)
        ? 'No Jobber client carries this number — treat as a new lead.'
        : 'No client matched that name.',
    };
  } else {
    const candidates = clients.slice(0, 5)
      .map((c) => ({ client: c, owner: decideOwner(visitsForClient(c.id), now) }));
    const best = candidates.find((c) => c.owner.tech) || candidates[0];
    const contacts = techDirectory();

    value = {
      query,
      match: clients.length > 1 ? 'multiple' : 'single',
      client: {
        name: best.client.name,
        isLead: best.client.isLead,
        isArchived: best.client.isArchived,
        url: best.client.jobberWebUri,
        phones: (best.client.phones || []).map((p) => p.number),
        smsBlocked: (best.client.phones || []).some((p) => p.smsAllowed === false),
      },
      others: clients.filter((c) => c.id !== best.client.id).map((c) => c.name),
      owner: best.owner,
      contact: best.owner.tech ? (contacts[best.owner.tech] || null) : null,
      route: best.owner.tech ? `hand to ${best.owner.tech}` : 'desk answers',
    };
  }

  cache.set(key, { at: Date.now(), value });
  return value;
}

export function handoffMessage(r) {
  if (!r.owner?.tech) return '';
  const addr = r.owner.address
    ? `${r.owner.address.street || ''}, ${r.owner.address.city || ''}`.replace(/^, /, '')
    : '';
  const timing = r.owner.inDays !== undefined
    ? `visit in ${r.owner.inDays} day(s)`
    : `visit completed ${r.owner.daysAgo} day(s) ago`;
  return `${r.owner.tech} — ${r.client.name} just texted the office.`
    + `\nJob #${r.owner.jobNumber}${addr ? ` · ${addr}` : ''} · ${timing}.`
    + `\nTheir number: ${r.client.phones[0] || 'n/a'}`;
}
