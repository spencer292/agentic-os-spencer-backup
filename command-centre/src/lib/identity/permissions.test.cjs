const assert = require("node:assert/strict");
const path = require("node:path");
const { test, before, after } = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Same leaf-first loading the store test uses: load each sibling module and inject
// it as a stub into the modules that value-import it. permissions.ts imports the
// store/types as `import type` only (erased), so it loads stub-free.
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
const permissions = loadTsModule(ID("permissions.ts"));

const EMBED_DIM = 8;

/** @type {import("./store").IdentityStore} */
let s;
let seq = 0;

/** A fresh team plus one member at the given role/status, for isolated checks. */
async function teamWith(role, status = "active") {
  seq += 1;
  const team = await s.createTeam({ slug: `perm-${seq}`, name: `Perm ${seq}` });
  const user = await s.upsertUser({ email: `perm-${seq}@example.com` });
  await s.upsertMembership({ teamId: team.id, userId: user.id, role, status });
  return { team, user };
}

before(async () => {
  s = await store.openIdentityStore({ backend: "pglite", embedDim: EMBED_DIM });
});

after(async () => {
  await s.close();
});

test("requireTeamRole passes when the active role meets the minimum", async () => {
  const { team, user } = await teamWith("admin");
  const m = await permissions.requireTeamRole(s, team.id, user.id, "admin");
  assert.equal(m.role, "admin");

  // owner outranks admin.
  const owner = await teamWith("owner");
  const om = await permissions.requireTeamRole(s, owner.team.id, owner.user.id, "admin");
  assert.equal(om.role, "owner");
});

test("requireTeamRole rejects an insufficient role", async () => {
  const { team, user } = await teamWith("member");
  await assert.rejects(
    permissions.requireTeamRole(s, team.id, user.id, "admin"),
    (err) => err instanceof permissions.PermissionError,
  );
});

test("requireTeamRole rejects a non-active membership", async () => {
  const invited = await teamWith("admin", "invited");
  await assert.rejects(
    permissions.requireTeamRole(s, invited.team.id, invited.user.id, "admin"),
    (err) => err instanceof permissions.PermissionError,
  );

  const suspended = await teamWith("owner", "suspended");
  await assert.rejects(
    permissions.requireTeamRole(s, suspended.team.id, suspended.user.id, "member"),
    (err) => err instanceof permissions.PermissionError,
  );
});

test("requireTeamRole rejects a non-member", async () => {
  seq += 1;
  const team = await s.createTeam({ slug: `perm-none-${seq}`, name: "No Members" });
  const stranger = await s.upsertUser({ email: `stranger-${seq}@example.com` });
  await assert.rejects(
    permissions.requireTeamRole(s, team.id, stranger.id, "member"),
    (err) => err instanceof permissions.PermissionError,
  );
});
