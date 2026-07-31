// jobber.js — minimal Jobber GraphQL client for the Worker runtime.
//
// Auth note (verified 2026-07-28): Jobber does NOT rotate the refresh token — refreshing
// twice with the same token returns the same refresh_token and the old one stays valid.
// So this Worker can share JOBBER_REFRESH_TOKEN with the repo's local scripts without the
// two fighting over a rotating credential, and needs no KV to persist it.
//
// Jobber returns partial "hidden due to permissions" errors for RequestNote objects our
// token cannot read, alongside perfectly good data. Those are tolerated here for the same
// reason report-sync.mjs tolerates them.

const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';

let cachedToken = null;
let cachedAt = 0;

async function getToken(env, force = false) {
  if (!force && cachedToken && Date.now() - cachedAt < 50 * 60 * 1000) return cachedToken;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.access_token) throw new Error(`Jobber token refresh failed (HTTP ${res.status})`);
  cachedToken = d.access_token;
  cachedAt = Date.now();
  return cachedToken;
}

const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));

export async function gql(env, query, variables = {}, attempt = 0) {
  const token = await getToken(env, attempt > 0);
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 && attempt < 2) return gql(env, query, variables, attempt + 1);
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 4) {
    await new Promise(r => setTimeout(r, 1500 * 2 ** attempt));
    return gql(env, query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`Jobber HTTP ${res.status}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) {
    throw new Error(`Jobber GraphQL: ${JSON.stringify(data.errors).slice(0, 200)}`);
  }
  return data.data;
}

// PT calendar day [00:00, 24:00) expressed in UTC — handles PDT/PST without a tz library.
// Same approach as report-sync.mjs so the app and the nightly sync agree on "today".
export function ptDayBoundsUtc(date) {
  const mk = (yy, mm, dd) => {
    const noonUtc = new Date(Date.UTC(yy, mm - 1, dd, 12));
    const ptHour = +noonUtc.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', hour12: false });
    return new Date(Date.UTC(yy, mm - 1, dd, 12 - ptHour)).toISOString();
  };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { after: mk(y, m, d), before: mk(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}

export function ptToday() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 10);
}

// Today's visits assigned to one technician, newest-note-first context included so the
// tech can see what was on the ground last time before they start talking.
export async function visitsForTech(env, jobberUserId, date) {
  const { after, before } = ptDayBoundsUtc(date);
  const out = [];
  let cursor = null, pages = 0;
  do {
    const q = `query($after: ISO8601DateTime!, $before: ISO8601DateTime!, $cursor: String) {
      visits(first: 100, after: $cursor, filter: { startAt: { after: $after, before: $before } }) {
        nodes {
          id title startAt
          assignedUsers(first: 5) { nodes { id name { full } } }
          job {
            id jobNumber
            client { name }
            property { address { street city } }
            notes(last: 3) { nodes { __typename ... on JobNote { message createdAt } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;
    const d = await gql(env, q, { after, before, cursor });
    for (const v of d.visits.nodes) {
      if (!v.job?.id) continue;
      const assigned = (v.assignedUsers?.nodes || []);
      if (jobberUserId && !assigned.some(u => u.id === jobberUserId)) continue;
      const notes = (v.job.notes?.nodes || []).filter(n => n && n.__typename === 'JobNote' && n.message);
      const latest = notes.length ? notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)) : null;
      out.push({
        visitId: v.id,
        jobId: v.job.id,
        jobNumber: v.job.jobNumber,
        client: v.job.client?.name || '(no client)',
        address: [v.job.property?.address?.street, v.job.property?.address?.city].filter(Boolean).join(', '),
        startAt: v.startAt,
        lastNote: latest ? latest.message : null,
        lastNoteAt: latest ? latest.createdAt : null,
      });
    }
    cursor = d.visits.pageInfo.hasNextPage ? d.visits.pageInfo.endCursor : null;
    pages++;
  } while (cursor && pages < 10);

  // De-dupe by job (a job can have more than one visit in a day) and order by start time.
  const byJob = new Map();
  for (const v of out) if (!byJob.has(v.jobId)) byJob.set(v.jobId, v);
  return [...byJob.values()].sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
}

// Signature introspected 2026-07-28: jobCreateNote(jobId: EncodedId!, input: JobCreateNoteInput!)
// -> JobCreateNotePayload { job, jobNote, userErrors }.
//
// Known limitation: JobNote.createdBy is set by Jobber from the OAuth connection, not by
// us — there is no author field on JobCreateNoteInput. Notes posted through this app will
// show in Jobber as created by the connected API user, not by the technician. The tech's
// identity is preserved in the Worker's own log line instead.
export async function createJobNote(env, jobId, message) {
  const q = `mutation($jobId: EncodedId!, $input: JobCreateNoteInput!) {
    jobCreateNote(jobId: $jobId, input: $input) {
      jobNote { id createdAt }
      userErrors { message path }
    }
  }`;
  const d = await gql(env, q, { jobId, input: { message } });
  const errs = d?.jobCreateNote?.userErrors || [];
  if (errs.length) throw new Error(errs.map(e => e.message).join('; '));
  return d?.jobCreateNote?.jobNote || null;
}
