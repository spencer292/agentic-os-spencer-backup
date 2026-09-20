const assert = require("node:assert/strict");
const path = require("node:path");
const { test, before, after } = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// loadTsModule transpiles a SINGLE .ts file and does not recurse into sibling
// imports, so each leaf module is loaded first and injected as a stub into the
// identity store. The memory modules (migrate/adapters/backend) and the identity
// row-mappers/types load stub-free: their only cross-file imports are `import
// type` (erased) or third-party/node builtins that fall through to real require.
const MEM = (file) => path.resolve(__dirname, "../memory", file);
const ID = (file) => path.resolve(__dirname, file);

const migrate = loadTsModule(MEM("migrate.ts"));
const adapter = loadTsModule(MEM("pglite-adapter.ts"));
const postgresAdapter = loadTsModule(MEM("postgres-adapter.ts"));
const backend = loadTsModule(MEM("backend.ts"));
const rowMappers = loadTsModule(ID("row-mappers.ts"));
const store = loadTsModule(ID("store.ts"), {
  stubs: {
    "../memory/migrate": migrate,
    "../memory/pglite-adapter": adapter,
    "../memory/postgres-adapter": postgresAdapter,
    "../memory/backend": backend,
    "./row-mappers": rowMappers,
  },
});

// Small embedding dimension keeps the 0001 vector columns cheap; the team-platform
// tables have no vectors. Force PGLite so a stray MEMORY_DATABASE_URL in the env
// can't redirect the suite at a real Postgres.
const EMBED_DIM = 8;

/** @type {import("./store").IdentityStore} */
let s;
let teamSeq = 0;

/** A fresh team (+ optional members) per test, so tests never collide in the shared store. */
async function freshTeam() {
  teamSeq += 1;
  return s.createTeam({ slug: `team-${teamSeq}`, name: `Team ${teamSeq}` });
}

before(async () => {
  s = await store.openIdentityStore({ backend: "pglite", embedDim: EMBED_DIM });
});

after(async () => {
  await s.close();
});

// ---------------------------------------------------------------------------
// Migration: 0002 applies on top of 0001 in the same database.
// ---------------------------------------------------------------------------

test("openIdentityStore applies the team-platform migration", async () => {
  for (const tbl of [
    "users",
    "teams",
    "memberships",
    "clients",
    "client_grants",
    "workstations",
    "audit_events",
  ]) {
    const reg = await s.client.query(`SELECT to_regclass('${tbl}') AS reg`);
    assert.notEqual(reg.rows[0].reg, null, `table ${tbl} should exist`);
  }

  const led = await s.client.query(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  const versions = led.rows.map((r) => Number(r.version));
  assert.ok(versions.includes(1), "memory migration applied");
  assert.ok(versions.includes(2), "team-platform migration applied");
});

// ---------------------------------------------------------------------------
// Users — upsert is idempotent on a case-insensitive email.
// ---------------------------------------------------------------------------

test("upsertUser is idempotent on case-insensitive email", async () => {
  const a = await s.upsertUser({ email: "Casey@Example.com", displayName: "Casey" });
  const b = await s.upsertUser({ email: "casey@example.com" });
  assert.equal(a.id, b.id, "same user row regardless of email case");
  assert.equal(b.displayName, "Casey", "existing display name preserved when omitted");

  const found = await s.getUserByEmail("CASEY@EXAMPLE.COM");
  assert.equal(found?.id, a.id);
});

// ---------------------------------------------------------------------------
// The model can represent team membership.
// ---------------------------------------------------------------------------

test("represents team membership with a role", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `m-${team.slug}@example.com` });

  const m = await s.upsertMembership({
    teamId: team.id,
    userId: user.id,
    role: "admin",
  });
  assert.equal(m.role, "admin");
  assert.equal(m.status, "active");

  assert.equal(await s.isActiveMember(team.id, user.id), true);

  const listed = await s.listMemberships(team.id);
  assert.equal(listed.length, 1);

  // Suspending a membership withdraws active access without deleting the row.
  await s.setMembershipStatus(team.id, user.id, "suspended");
  assert.equal(await s.isActiveMember(team.id, user.id), false);
  assert.equal((await s.getMembership(team.id, user.id))?.status, "suspended");
});

// ---------------------------------------------------------------------------
// The model can represent client-level access; resolve a slug to a client.
// ---------------------------------------------------------------------------

test("represents client-level read/write access", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `g-${team.slug}@example.com` });
  const client = await s.upsertClient({ teamId: team.id, slug: "acme", name: "Acme" });

  // The slug → client resolve chain the enforcement layer relies on.
  const bySlug = await s.getClientBySlug(team.id, "acme");
  assert.equal(bySlug?.id, client.id);

  const grant = await s.grantClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: user.id,
    access: "read",
    grantedBy: user.id,
  });
  assert.equal(grant.access, "read");
  assert.equal(grant.status, "active");

  const active = await s.getActiveGrant(team.id, client.id, user.id);
  assert.equal(active?.id, grant.id);
  assert.equal(active?.access, "read");
});

// ---------------------------------------------------------------------------
// Revoked grants can be checked without deleting history.
// ---------------------------------------------------------------------------

test("revoke flips status without deleting history; re-grant supersedes", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `r-${team.slug}@example.com` });
  const client = await s.upsertClient({ teamId: team.id, slug: "beta", name: "Beta" });

  await s.grantClientAccess({ teamId: team.id, clientId: client.id, userId: user.id, access: "read" });

  const revoked = await s.revokeClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: user.id,
    revokedBy: user.id,
  });
  assert.equal(revoked?.status, "revoked");
  assert.notEqual(revoked?.revokedAt, null);

  // No active grant now …
  assert.equal(await s.getActiveGrant(team.id, client.id, user.id), null);
  // … but the revoked row is still on record (history preserved).
  let history = await s.listGrants({ teamId: team.id, clientId: client.id, userId: user.id });
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "revoked");

  // Re-granting after a revoke works and keeps the old row as history.
  const regranted = await s.grantClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: user.id,
    access: "write",
  });
  assert.equal(regranted.access, "write");
  assert.equal((await s.getActiveGrant(team.id, client.id, user.id))?.access, "write");

  history = await s.listGrants({ teamId: team.id, clientId: client.id, userId: user.id });
  assert.equal(history.length, 2, "revoked + active rows both retained");
  assert.equal(history.filter((g) => g.status === "active").length, 1);
});

test("at most one active grant per (team, client, user)", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `u-${team.slug}@example.com` });
  const client = await s.upsertClient({ teamId: team.id, slug: "gamma", name: "Gamma" });

  await s.grantClientAccess({ teamId: team.id, clientId: client.id, userId: user.id, access: "read" });

  // A second raw active grant for the same triple must violate the partial unique index.
  await assert.rejects(
    s.client.query(
      `INSERT INTO client_grants (team_id, client_id, user_id, access, status)
       VALUES ($1, $2, $3, 'write', 'active')`,
      [team.id, client.id, user.id],
    ),
  );
});

// ---------------------------------------------------------------------------
// Sensitive actions can be recorded in audit events, queryable by team + target.
// ---------------------------------------------------------------------------

test("grant/revoke write audit events queryable by team and target", async () => {
  const team = await freshTeam();
  const admin = await s.upsertUser({ email: `admin-${team.slug}@example.com` });
  const member = await s.upsertUser({ email: `member-${team.slug}@example.com` });
  const client = await s.upsertClient({ teamId: team.id, slug: "delta", name: "Delta" });

  const grant = await s.grantClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: member.id,
    access: "read",
    grantedBy: admin.id,
  });
  await s.revokeClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: member.id,
    revokedBy: admin.id,
  });

  const byTeam = await s.listAuditEvents({ teamId: team.id });
  const actions = byTeam.map((e) => e.action);
  assert.ok(actions.includes("grant.granted"));
  assert.ok(actions.includes("grant.revoked"));
  assert.equal(byTeam[0].actorUserId, admin.id, "newest-first ordering");

  // Narrowed to a single target (the grant row).
  const byTarget = await s.listAuditEvents({
    teamId: team.id,
    targetType: "grant",
    targetId: grant.id,
  });
  assert.equal(byTarget.length, 2, "both grant + revoke target the same grant id");
});

test("recordAuditEvent stores a standalone sensitive action", async () => {
  const team = await freshTeam();
  const admin = await s.upsertUser({ email: `inv-admin-${team.slug}@example.com` });
  const invited = await s.upsertUser({ email: `invited-${team.slug}@example.com` });
  const membership = await s.upsertMembership({
    teamId: team.id,
    userId: invited.id,
    status: "invited",
    invitedBy: admin.id,
  });

  const event = await s.recordAuditEvent({
    teamId: team.id,
    actorUserId: admin.id,
    action: "membership.invited",
    targetType: "membership",
    targetId: membership.id,
    summary: "invited a member",
  });
  assert.equal(event.action, "membership.invited");

  const found = await s.listAuditEvents({
    teamId: team.id,
    targetType: "membership",
    targetId: membership.id,
  });
  assert.equal(found.length, 1);
  assert.equal(found[0].id, event.id);
});

// ---------------------------------------------------------------------------
// Atomicity: a failed grant rolls back, leaving the prior active grant intact.
// ---------------------------------------------------------------------------

test("a failed grant rolls back and preserves the prior active grant", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `tx-${team.slug}@example.com` });
  const client = await s.upsertClient({ teamId: team.id, slug: "epsilon", name: "Epsilon" });

  const original = await s.grantClientAccess({
    teamId: team.id,
    clientId: client.id,
    userId: user.id,
    access: "read",
  });

  // An invalid access value trips the CHECK constraint on INSERT — after the
  // transaction has already revoked the prior active grant. The rollback must
  // restore it.
  await assert.rejects(
    s.grantClientAccess({
      teamId: team.id,
      clientId: client.id,
      userId: user.id,
      access: "owner", // not in ('read','write')
    }),
  );

  const active = await s.getActiveGrant(team.id, client.id, user.id);
  assert.equal(active?.id, original.id, "prior grant restored by rollback");
  assert.equal(active?.access, "read");
  const history = await s.listGrants({ teamId: team.id, clientId: client.id, userId: user.id });
  assert.equal(history.length, 1, "no orphan row from the failed insert");
});

// ---------------------------------------------------------------------------
// Workstations — minimal model: register, supersede a fingerprint, revoke.
// ---------------------------------------------------------------------------

test("workstations register, supersede a fingerprint, and revoke", async () => {
  const team = await freshTeam();
  const user = await s.upsertUser({ email: `w-${team.slug}@example.com` });

  const w1 = await s.registerWorkstation({
    teamId: team.id,
    userId: user.id,
    name: "Laptop",
    fingerprint: "fp-1",
  });
  assert.equal(w1.status, "active");

  // Re-registering the same fingerprint supersedes the old active registration.
  const w2 = await s.registerWorkstation({
    teamId: team.id,
    userId: user.id,
    name: "Laptop (reinstalled)",
    fingerprint: "fp-1",
  });
  assert.notEqual(w2.id, w1.id);

  const all = await s.listWorkstations(team.id, user.id);
  assert.equal(all.length, 2);
  assert.equal(all.filter((w) => w.status === "active").length, 1);

  const revoked = await s.revokeWorkstation(w2.id);
  assert.equal(revoked?.status, "revoked");
  assert.notEqual(revoked?.revokedAt, null);
});
